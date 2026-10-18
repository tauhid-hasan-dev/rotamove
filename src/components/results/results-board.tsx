"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { AlertTriangle, PencilLine, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Shell } from "@/components/common/section";
import { FiltersPanel } from "@/components/results/filters-panel";
import { MoverCard, type MoverTag } from "@/components/results/mover-card";
import { MoverSkeleton } from "@/components/results/quote-skeleton";
import { SearchHud } from "@/components/results/search-hud";
import { useSearchStream } from "@/components/results/use-search-stream";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getCity, type TransportMode } from "@/lib/geo";
import { applyFilters, sortQuotes, DEFAULT_FILTERS } from "@/lib/matching";
import { getMover } from "@/lib/movers";
import { useI18n } from "@/i18n/provider";
import type { ContactChannel, QuoteFilters } from "@/lib/types";
import type { DecodedMoveSpec } from "@/lib/lead-codec";

export function ResultsBoard({
  leadId,
  token,
  spec,
  channel = "whatsapp",
  limit,
}: {
  leadId: string;
  token: string | null;
  spec: DecodedMoveSpec;
  channel?: ContactChannel;
  /**
   * How many carriers the customer asked us to contact, or `null` for all.
   * Chosen on the contact step and carried through the results URL.
   */
  limit: number | null;
}) {
  const { dict, t, href, rtl } = useI18n();
  const stream = useSearchStream(leadId, token);
  const [filters, setFilters] = useState<QuoteFilters>(DEFAULT_FILTERS);

  const from = getCity(spec.origin.cityCode);
  const to = getCity(spec.destination.cityCode);
  const { quotes } = stream;

  const availableModes = useMemo(
    () => [...new Set(quotes.map((q) => q.mode))] as TransportMode[],
    [quotes],
  );

  /**
   * Ranking is always "best match" now — the customer asked for the top N
   * carriers, so re-ordering by speed or rating after the fact would change
   * *which* ones were contacted, which is not something a list control should
   * quietly do.
   */
  const ranked = useMemo(
    () => sortQuotes(applyFilters(quotes, filters), "best"),
    [quotes, filters],
  );

  const visible = useMemo(
    () => (limit === null ? ranked : ranked.slice(0, limit)),
    [ranked, limit],
  );

  const tags = useMemo(() => {
    const map = new Map<string, MoverTag>();
    if (!visible.length) return map;
    const best = [...visible].sort((a, b) => b.matchScore - a.matchScore)[0];
    if (best) map.set(best.id, "best");
    return map;
  }, [visible]);

  /**
   * Skeletons stand in for results still arriving, but never for more than the
   * customer asked for — showing five placeholders when they requested two
   * promises something the board will not deliver.
   */
  const pending = (() => {
    const expected =
      stream.status === "searching" && stream.expectedTotal
        ? stream.expectedTotal
        : stream.status === "connecting"
          ? 3
          : 0;
    if (!expected) return 0;
    const target = limit === null ? expected : Math.min(expected, limit);
    return Math.max(0, target - visible.length);
  })();

  if (!from || !to) {
    return (
      <Shell className="py-28">
        <Empty title={dict.results.unreadableTitle} body={dict.results.unreadableBody} />
      </Shell>
    );
  }

  const filterPanel = (
    <FiltersPanel
      filters={filters}
      onChange={setFilters}
      availableModes={availableModes}
      resultCount={visible.length}
      totalCount={quotes.length}
    />
  );

  return (
    <>
      <div className="sticky top-16 z-40 border-b bg-background">
        <Shell className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
          <p className="flex items-center gap-2 text-[14px]">
            <span className="font-medium">{from.name}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{to.name}</span>
          </p>
          <p className="text-[13px] text-muted-foreground tnum">
            {t.volume(spec.volumeM3)} · {t.dateShort(spec.moveDate)}
          </p>
          <Button asChild variant="ghost" size="sm" className="ms-auto rounded-full text-[13px]">
            <Link
              href={href(`/quote?from=${from.code}&to=${to.code}&size=${spec.propertySize}`)}
            >
              <PencilLine className="size-3.5" />
              {dict.common.edit}
            </Link>
          </Button>
        </Shell>
      </div>

      <Shell>
        <SearchHud
          stages={stream.stages}
          progress={stream.progress}
          found={visible.length}
          originCode={from.code}
          destCode={to.code}
          status={stream.status}
          elapsedMs={stream.elapsedMs}
        />

        {stream.status === "error" && (
          <div className="mb-6 flex flex-col items-start gap-4 rounded-3xl border p-6 sm:flex-row sm:items-center">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <p className="min-w-0 flex-1 text-[14.5px] text-muted-foreground">{stream.error}</p>
            <Button onClick={stream.retry} variant="outline" className="rounded-full">
              <RefreshCw className="size-4" />
              {dict.common.tryAgain}
            </Button>
          </div>
        )}

        <div className="grid gap-10 pb-16 lg:grid-cols-[216px_minmax(0,1fr)] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-[150px] max-h-[calc(100vh-180px)] overflow-y-auto pe-2 scrollbar-slim">
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              {/* One ranking, stated rather than offered as a choice. */}
              <span className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-[13.5px] font-medium text-ink">
                {dict.results.sort.best}
              </span>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="ms-auto rounded-full lg:hidden">
                    <SlidersHorizontal className="size-4" />
                    {dict.results.filtersTitle}
                  </Button>
                </SheetTrigger>
                <SheetContent side={rtl ? "right" : "left"} className="w-[310px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{dict.results.filtersTitle}</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-8">{filterPanel}</div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="mt-5 space-y-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((quote, i) => {
                  const mover = getMover(quote.moverId);
                  if (!mover) return null;
                  return (
                    <MoverCard
                      key={quote.id}
                      quote={quote}
                      mover={mover}
                      tag={tags.get(quote.id) ?? null}
                      index={i}
                      channel={channel}
                      originCode={from.code}
                      destCode={to.code}
                    />
                  );
                })}
              </AnimatePresence>

              {pending > 0 &&
                Array.from({ length: Math.min(pending, 3) }).map((_, i) => (
                  <MoverSkeleton key={`sk-${i}`} delay={i * 120} />
                ))}

              {stream.status === "done" && visible.length === 0 && (
                <Empty
                  title={dict.results.noFiltersTitle}
                  body={dict.results.noFiltersBody}
                  action={
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                    >
                      {dict.results.clearFilters}
                    </Button>
                  }
                />
              )}
            </div>

            {stream.status === "done" && visible.length > 0 && (
              <p className="mt-8 text-[13px] leading-relaxed text-muted-foreground">
                {dict.results.rankingNote}
              </p>
            )}
          </div>
        </div>
      </Shell>
    </>
  );
}

function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const { dict, href } = useI18n();
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed px-6 py-16 text-center">
      <h3 className="text-[20px]">{title}</h3>
      <p className="max-w-md text-[14.5px] text-muted-foreground">{body}</p>
      {action ?? (
        <Button asChild className="rounded-full">
          <Link href={href("/")}>{dict.common.startAgain}</Link>
        </Button>
      )}
    </div>
  );
}
