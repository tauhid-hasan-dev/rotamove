"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Box, Clock3, Truck } from "lucide-react";
import { motion } from "motion/react";
import { RouteLine } from "@/components/common/route-line";
import { getCity, cityCountry, resolveCorridor } from "@/lib/geo";
import { LAST_CALL_HOURS, type LastCallHours } from "@/lib/lanes";
import type { LastCallOffer } from "@/lib/last-call-offers";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function LastCallBoard({ offers, now }: { offers: LastCallOffer[]; now: number }) {
  const { dict, t, href } = useI18n();
  const lx = dict.lastCallPage;
  const [filter, setFilter] = useState<LastCallHours | "all">("all");

  const visible = useMemo(
    () => (filter === "all" ? offers : offers.filter((o) => o.hours === filter)),
    [offers, filter],
  );

  if (offers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed p-12 text-center">
        <Clock3 className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-4 text-[17px] font-medium tracking-[-0.02em]">{lx.emptyTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
          {lx.emptyBody}
        </p>
        <Link
          href={href("/")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-[15px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985]"
        >
          {lx.emptyCta}
          <ArrowRight className="size-4 rtl:-scale-x-100" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          {lx.filterAll}
        </FilterChip>
        {LAST_CALL_HOURS.map((hours) => (
          <FilterChip key={hours} active={filter === hours} onClick={() => setFilter(hours)}>
            {t.fill(lx.hours, { n: hours })}
          </FilterChip>
        ))}
        <span className="ms-auto text-[13px] text-muted-foreground tnum">
          {t.fill(lx.liveCount, { count: t.number(visible.length) })}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((offer, i) => (
          <OfferCard key={offer.id} offer={offer} now={now} index={i} />
        ))}
      </div>

      <p className="mt-8 text-center text-[13px] text-muted-foreground">{lx.anonymityNote}</p>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
        active
          ? "border-lastcall-accent bg-lastcall text-lastcall-foreground"
          : "text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function OfferCard({
  offer,
  now,
  index,
}: {
  offer: LastCallOffer;
  now: number;
  index: number;
}) {
  const { dict, t, href } = useI18n();
  const lx = dict.lastCallPage;
  const from = getCity(offer.fromCode);
  const to = getCity(offer.toCode);
  if (!from || !to) return null;

  const corridor = resolveCorridor(from, to);
  const mode = corridor?.modes[0] ?? "road";
  const msLeft = Date.parse(offer.endAt) - now;
  const hoursLeft = Math.floor(msLeft / 3_600_000);

  // Everything the request flow needs, so the wizard opens pre-answered.
  const request = href(
    `/quote?from=${offer.fromCode}&to=${offer.toCode}&lastcall=${offer.hours}&lc=${offer.id}`,
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col rounded-2xl border bg-card p-5 transition-shadow duration-300 hover:shadow-soft"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lastcall px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.12em] text-lastcall-foreground">
          <Clock3 className="size-3" />
          {t.fill(lx.hours, { n: offer.hours })}
        </span>
        <span className="ms-auto text-[12px] font-medium text-lastcall-foreground tnum">
          {hoursLeft >= 1 ? t.fill(lx.hoursLeft, { n: hoursLeft }) : lx.lessThanHour}
        </span>
      </div>

      <div className="mt-4">
        <RouteLine
          from={from.code}
          to={to.code}
          mode={mode}
          modeLabel={dict.enums.modes[mode].label}
          size="sm"
        />
        <p className="mt-2 truncate text-[13.5px] text-muted-foreground">
          {t.city(from, cityCountry(from).name)} → {t.city(to, cityCountry(to).name)}
        </p>
      </div>

      <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-muted-foreground tnum">
        <span className="inline-flex items-center gap-1.5">
          <Box className="size-3.5" />
          {t.fill(lx.capacity, { n: t.number(offer.capacityM3) })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Truck className="size-3.5" />
          {offer.vehicle === "lorry" ? lx.vehicleLorry : lx.vehicleVan}
        </span>
      </dl>

      <dl className="mt-3 space-y-1 border-t pt-3 text-[12px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">{lx.departs}</dt>
          <dd className="tnum font-medium">{t.dateTime(offer.startAt)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">{lx.expires}</dt>
          <dd className="tnum font-medium text-lastcall-foreground">{t.dateTime(offer.endAt)}</dd>
        </div>
      </dl>

      {offer.notes ? (
        <p className="mt-3 border-s-2 border-border ps-3 text-[12.5px] italic leading-relaxed text-muted-foreground">
          {offer.notes}
        </p>
      ) : null}

      <Link
        href={request}
        className="group mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-[14.5px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985]"
      >
        {lx.sendRequest}
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
      </Link>
    </motion.article>
  );
}
