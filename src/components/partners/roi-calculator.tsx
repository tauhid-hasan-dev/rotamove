"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { LEAD_FEE_CAP_USD, PRO_MONTHLY_USD } from "@/lib/plans";
import { formatUsdPrecise } from "@/lib/format";
import { cn } from "@/lib/utils";

const AVG_LEAD_FEE = 5.2;
const BREAK_EVEN = Math.ceil(PRO_MONTHLY_USD / AVG_LEAD_FEE);

/**
 * Plan chooser.
 *
 * One input, one answer. Below the break-even it says pay-per-lead, because
 * that is true — a partner told the truth at twelve leads a month upgrades at
 * forty and stays.
 */
export function PlanChooser() {
  const [leads, setLeads] = useState(60);

  const { pplCost, proWins, saving } = useMemo(() => {
    const pplCost = leads * AVG_LEAD_FEE;
    return {
      pplCost,
      proWins: PRO_MONTHLY_USD <= pplCost,
      saving: Math.abs(PRO_MONTHLY_USD - pplCost),
    };
  }, [leads]);

  const max = Math.max(PRO_MONTHLY_USD, pplCost);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border bg-card p-7 sm:p-10">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor="leads" className="text-[15px]">
          Leads you&apos;d take per month
        </label>
        <span className="text-[28px] font-medium leading-none tnum">{leads}</span>
      </div>

      <Slider
        id="leads"
        className="mt-6"
        value={[leads]}
        min={5}
        max={300}
        step={5}
        onValueChange={([v]) => setLeads(v)}
        aria-label="Leads per month"
      />

      <div className="mt-10 space-y-5">
        <Bar
          label="Pro Unlimited"
          amount={PRO_MONTHLY_USD}
          max={max}
          win={proWins}
          note="flat, any volume"
        />
        <Bar
          label="Pay Per Lead"
          amount={pplCost}
          max={max}
          win={!proWins}
          note={`≈ $${AVG_LEAD_FEE} each · capped at $${LEAD_FEE_CAP_USD}`}
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t pt-8">
        <p className="min-w-0 flex-1 text-[15.5px] leading-relaxed">
          <span className="font-medium">
            {proWins ? "Pro Unlimited" : "Pay Per Lead"} is cheaper for you
          </span>{" "}
          <span className="text-muted-foreground">
            {proWins
              ? `by ${formatUsdPrecise(saving)} a month — and only Pro puts you in instant search results.`
              : `by ${formatUsdPrecise(saving)} a month. Pro wins from ${BREAK_EVEN} leads.`}
          </span>
        </p>
        <Link
          href="/partners/dashboard"
          className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-[15px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985]"
        >
          {proWins ? "Start Pro trial" : "Create free account"}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
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
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("text-[15px]", win && "font-medium")}>{label}</span>
        <span className="text-[16px] font-medium tnum">{formatUsdPrecise(amount)}</span>
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
