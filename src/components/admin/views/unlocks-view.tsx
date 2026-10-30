"use client";

import { useCallback, useEffect, useState } from "react";
import { LockOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader, StatusBadge } from "@/components/admin/bits";
import { DELIVERY_META } from "@/lib/admin/labels";
import type { UnlockRecord } from "@/lib/unlock-store";
import { useI18n } from "@/i18n/provider";

/**
 * Live pay-per-seen unlock feed.
 *
 * Unlike every other admin page this is not seeded data: the rows are real
 * clicks made in the partner dashboard, read from the unlock store through
 * `/api/admin/unlocks`. Click Unlock over there, watch the row appear here —
 * that is the whole demonstration of the plan's billing model.
 */
export function UnlocksView() {
  const { dict, t } = useI18n();
  const ux = dict.admin.unlocks;
  const [unlocks, setUnlocks] = useState<UnlockRecord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/unlocks", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { unlocks: UnlockRecord[] };
      setUnlocks(data.unlocks);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    // First fetch goes through a zero-delay timer rather than running in the
    // effect body — state updates then happen in a callback, which is the
    // shape the react-hooks/set-state-in-effect rule insists on.
    const initial = setTimeout(() => void load(), 0);
    // A demo-friendly cadence: fast enough that an unlock made in another tab
    // shows up on its own, slow enough to be invisible in the network tab.
    const timer = setInterval(() => void load(), 15_000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [load]);

  const total = (unlocks ?? []).reduce((sum, u) => sum + u.feeEur, 0);

  return (
    <>
      <PageHeader
        title={ux.title}
        description={ux.description}
        actions={
          <Button variant="outline" className="gap-2" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden />
            {ux.refresh}
          </Button>
        }
      />

      {failed && unlocks === null ? (
        <EmptyState
          title={ux.errorTitle}
          description={ux.errorBody}
          action={
            <Button variant="outline" onClick={() => void refresh()}>
              {dict.common.tryAgain}
            </Button>
          }
        />
      ) : unlocks !== null && unlocks.length === 0 ? (
        <EmptyState
          icon={<LockOpen className="size-5" aria-hidden />}
          title={ux.emptyTitle}
          description={ux.emptyBody}
        />
      ) : (
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ux.colPartner}</TableHead>
                    <TableHead>{ux.colLead}</TableHead>
                    <TableHead className="text-end">{ux.colFee}</TableHead>
                    <TableHead>{ux.colUnlockedAt}</TableHead>
                    <TableHead>{ux.colEmail}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(unlocks ?? []).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="text-[13.5px] font-medium">{u.partnerName}</p>
                        <p className="code text-[11px] text-muted-foreground">
                          {u.partnerPublicId}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-[13px]">{u.routeLabel}</p>
                        <p className="tnum text-[11.5px] text-muted-foreground">
                          {u.leadId} · {t.volume(u.volumeM3)}
                        </p>
                      </TableCell>
                      <TableCell className="tnum text-end font-medium">
                        {t.eur(u.feeEur)}
                      </TableCell>
                      <TableCell className="tnum text-[13px] text-muted-foreground">
                        {t.dateTime(u.unlockedAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          meta={DELIVERY_META[u.emailStatus]}
                          label={dict.admin.status.delivery[u.emailStatus]}
                        />
                        <p className="mt-1 text-[11.5px] text-muted-foreground">{u.emailTo}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {unlocks !== null && unlocks.length > 0 && (
              <p className="tnum border-t px-4 py-3 text-[13px] text-muted-foreground">
                {t.fill(ux.totalLine, {
                  n: t.number(unlocks.length),
                  total: t.eur(Math.round(total * 100) / 100),
                })}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
