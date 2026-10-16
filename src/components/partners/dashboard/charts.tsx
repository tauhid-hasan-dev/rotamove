"use client";

import { motion } from "motion/react";

import type { PartnerMetrics } from "@/lib/demo-leads";
import { cn } from "@/lib/utils";

/**
 * Hand-built charts.
 *
 * A charting library would be heavier than the two shapes this dashboard
 * needs, and SVG lets the bars inherit the brand's exact geometry.
 */

export function WeeklyChart({ data }: { data: PartnerMetrics["weekly"] }) {
  const maxLeads = Math.max(...data.map((d) => d.leads), 1);

  return (
    <div className="rounded-3xl border bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-[17px] tracking-[-0.025em]">
          Leads and wins, last six weeks
        </h3>
        <div className="flex items-center gap-4 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-border" />
            leads
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-brand" />
            won
          </span>

        </div>
      </div>

      <div className="relative mt-7 flex h-[180px] items-end gap-3 sm:gap-5">
        {data.map((d, i) => (
          <div key={d.week} className="relative flex h-full flex-1 flex-col justify-end gap-1">
            <span className="text-center text-[10.5px] text-muted-foreground tnum">
              {d.leads}
            </span>
            <div className="relative w-full" style={{ height: `${(d.leads / maxLeads) * 100}%` }}>
              <motion.span
                className="absolute inset-0 rounded-t-md bg-border"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "bottom" }}
              />
              <motion.span
                className="absolute inset-x-0 bottom-0 rounded-t-md bg-brand"
                style={{ height: `${(d.won / Math.max(1, d.leads)) * 100}%`, transformOrigin: "bottom" }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-3 sm:gap-5">
        {data.map((d) => (
          <span
            key={d.week}
            className="flex-1 text-center text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"
          >
            {d.week}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CorridorSplit({ data }: { data: PartnerMetrics["corridorSplit"] }) {
  const max = Math.max(...data.map((d) => d.leads), 1);
  return (
    <div className="rounded-3xl border bg-card p-6 sm:p-7">
      <h3 className="text-[17px] tracking-[-0.025em]">
        Where your leads come from
      </h3>
      <ul className="mt-6 space-y-4">
        {data.map((row, i) => {
          const winRate = row.won / Math.max(1, row.leads);
          return (
            <li key={row.corridor}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13.5px] font-medium">{row.corridor}</span>
                <span className="shrink-0 text-[12px] text-muted-foreground tnum">
                  {row.leads} · {Math.round(winRate * 100)}% won
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn("h-full rounded-full", i === 0 ? "bg-brand" : "bg-brand/45")}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(row.leads / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "brand" | "verify";
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "mt-2 text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-none tracking-[-0.04em] tnum",
          tone === "brand" && "text-brand",
          tone === "verify" && "text-verify",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[12px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

