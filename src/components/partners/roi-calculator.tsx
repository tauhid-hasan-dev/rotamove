"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  AVG_LEAD_FEE_USD,
  BREAK_EVEN_LEADS,
  LEAD_FEE_CAP_USD,
  PPS_OPEN_RATE,
  computeRoi,
} from "@/lib/plans";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Plan chooser.
 *
 * One input, one answer, now across all three plans. The ROI maths lives in
 * `computeRoi` so this bar chart and the partner-side comparison can never
 * disagree about which plan is cheaper.
 */
export function PlanChooser() {
  const { dict, t, href } = useI18n();
  const [leads, setLeads] = useState(60);

  const roi = useMemo(
    () =>
      computeRoi({ leadsPerMonth: leads, winRate: 0.2, avgJobValueEur: 2400, grossMargin: 0.3 }),
    [leads],
  );

  const { proCostUsd, pplCostUsd, ppsCostUsd, betterPlan, savingUsd } = roi;
  const max = Math.max(proCostUsd, pplCostUsd, ppsCostUsd);

  const winnerName = {
    pro_unlimited: dict.plans.proName,
    pay_per_lead: dict.plans.pplName,
    pay_per_seen: dict.plans.ppsName,
  }[betterPlan];

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border bg-card p-7 sm:p-10">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor="leads" className="text-[15px]">
          {dict.planChooser.label}
        </label>
        <span className="text-[28px] font-medium leading-none tnum">{t.number(leads)}</span>
      </div>

      <Slider
        id="leads"
        className="mt-6"
        value={[leads]}
        min={5}
        max={300}
        step={5}
        onValueChange={([v]) => setLeads(v)}
        aria-label={dict.planChooser.ariaLeads}
      />

      <div className="mt-10 space-y-5">
        <Bar
          label={dict.plans.proName}
          amount={proCostUsd}
          max={max}
          win={betterPlan === "pro_unlimited"}
          note={dict.planChooser.proNote}
        />
        <Bar
          label={dict.plans.pplName}
          amount={pplCostUsd}
          max={max}
          win={betterPlan === "pay_per_lead"}
          note={t.fill(dict.planChooser.pplNote, {
            fee: t.usd(AVG_LEAD_FEE_USD),
            cap: t.usd(LEAD_FEE_CAP_USD),
          })}
        />
        <Bar
          label={dict.plans.ppsName}
          amount={ppsCostUsd}
          max={max}
          win={betterPlan === "pay_per_seen"}
          note={t.fill(dict.planChooser.ppsNote, {
            percent: t.percent(PPS_OPEN_RATE),
            fee: t.usd(AVG_LEAD_FEE_USD),
          })}
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t pt-8">
        <p className="min-w-0 flex-1 text-[15.5px] leading-relaxed">
          <span className="font-medium">
            {t.fill(dict.planChooser.cheaperFor, { plan: winnerName })}
          </span>{" "}
          <span className="text-muted-foreground">
            {betterPlan === "pro_unlimited"
              ? t.fill(dict.planChooser.proWins, { saving: t.usd(savingUsd) })
              : betterPlan === "pay_per_seen"
                ? t.fill(dict.planChooser.ppsWins, { saving: t.usd(savingUsd) })
                : t.fill(dict.planChooser.pplWins, {
                    saving: t.usd(savingUsd),
                    breakEven: t.number(BREAK_EVEN_LEADS),
                  })}
          </span>
        </p>
        <Link
          href={href("/partners/dashboard")}
          className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-[15px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985]"
        >
          {betterPlan === "pro_unlimited"
            ? dict.planChooser.proCta
            : dict.planChooser.pplCta}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
        </Link>
      </div>
    </div>
  );
}

function Bar({
  label,
  amount,
  max,
  win,
  note,
}: {
  label: string;
  amount: number;
  max: number;
  win: boolean;
  note: string;
}) {
  const { t } = useI18n();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("text-[15px]", win && "font-medium")}>{label}</span>
        <span className="text-[16px] font-medium tnum">{t.usd(amount)}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full", win ? "bg-brand" : "bg-border")}
          animate={{ width: `${(amount / max) * 100}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground">{note}</p>
    </div>
  );
}
