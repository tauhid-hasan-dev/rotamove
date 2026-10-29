"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Mail, RefreshCw, Search } from "lucide-react";
import { EmptyState } from "@/components/admin/bits";
import { useAdminPageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAIL_FROM, type MailKind, type MailMessage } from "@/lib/mail";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * The outbox.
 *
 * Every message the product has sent, with its real subject and body. It
 * exists because this demo has no mail provider: approving a partner composes
 * a genuine email and records it here instead of handing it to SMTP, and a
 * flow whose whole point is "the partner gets told" needs somewhere you can
 * confirm that it happened and read exactly what they were told.
 *
 * It is not a mock-up of an inbox. These are the same strings a provider
 * would be handed, and the provider is the only missing piece.
 */

const KINDS: readonly MailKind[] = [
  "application_received",
  "application_approved",
  "application_declined",
  "documents_requested",
  "plan_queued",
  "plan_activated",
  "contact_changed",
];

export function OutboxView() {
  const { dict, t } = useI18n();
  const ox = dict.admin.outbox;
  useAdminPageTitle(ox.title);

  const [messages, setMessages] = useState<MailMessage[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MailKind | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/outbox", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { messages: MailMessage[] };
      setMessages(data.messages);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // Through a timer, so the state update lands in a callback rather than in
    // the effect body — the shape the react-hooks rules insist on.
    const initial = setTimeout(() => void load(), 0);
    return () => clearTimeout(initial);
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (messages ?? []).filter((m) => {
      if (kind !== "all" && m.kind !== kind) return false;
      if (!q) return true;
      return (
        m.to.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        (m.ref ?? "").toLowerCase().includes(q)
      );
    });
  }, [messages, query, kind]);

  return (
    <div className="animate-rise">
      {/* The standing caveat, stated where the evidence is. Anyone reading
          this page is checking whether a message went out, and the honest
          answer is "it was composed and recorded, not transmitted". */}
      <div className="mb-4 flex items-start gap-2.5 rounded-md border border-dashed bg-surface px-4 py-3">
        <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-[13px] leading-relaxed text-muted-foreground">{ox.notice}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="me-1 text-[13.5px] text-muted-foreground">
          {t.fill(ox.count, { n: t.number((messages ?? []).length) })}
        </p>

        <div className="relative ms-auto">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ox.searchPlaceholder}
            aria-label={ox.searchPlaceholder}
            className="w-56 ps-8"
          />
        </div>

        <Select value={kind} onValueChange={(v) => setKind(v as MailKind | "all")}>
          <SelectTrigger className="w-56" aria-label={ox.kindFilterAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ox.allKinds}</SelectItem>
            {KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {ox.kinds[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={refresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden />
          {dict.admin.unlocks.refresh}
        </Button>
      </div>

      {messages === null && !failed ? (
        <p className="flex items-center justify-center gap-2 py-14 text-[13.5px] text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {ox.loading}
        </p>
      ) : failed ? (
        <EmptyState
          title={ox.errorTitle}
          description={ox.errorBody}
          action={
            <Button variant="outline" onClick={refresh}>
              {dict.common.tryAgain}
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={query || kind !== "all" ? ox.emptyFiltered : ox.emptyNone}
          description={query || kind !== "all" ? dict.admin.common.loosenFilters : ox.emptyNoneBody}
          icon={<Mail className="size-5" aria-hidden />}
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((m) => {
            const expanded = open === m.id;
            return (
              <li key={m.id} className="overflow-hidden rounded-md border bg-card shadow-soft">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : m.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-start gap-3 px-5 py-4 text-start transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                        {ox.kinds[m.kind]}
                      </span>
                      {m.ref && <span className="code text-[11.5px]">{m.ref}</span>}
                    </span>
                    <span className="mt-1.5 block truncate text-[14px] font-medium">
                      {m.subject}
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                      {t.fill(ox.toLine, { from: MAIL_FROM, to: m.to })}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tnum text-[12.5px] text-muted-foreground">
                      {t.dateShort(m.sentAt)}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform",
                        expanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </span>
                </button>

                {expanded && (
                  /* `whitespace-pre-wrap` on purpose: the body is plain text
                     with blank lines between paragraphs, and rendering it as
                     anything else would misrepresent what was sent. */
                  <div className="border-t bg-surface px-5 py-4">
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{m.body}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
