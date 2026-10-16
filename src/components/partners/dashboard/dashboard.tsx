"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  CreditCard,
  Download,
  Filter,
  Inbox,
  Infinity as InfinityIcon,
  Settings2,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/common/section";
import { MoverLogo } from "@/components/common/mover-logo";
import { CorridorSplit, KpiCard, WeeklyChart } from "@/components/partners/dashboard/charts";
import { LeadRow } from "@/components/partners/dashboard/lead-row";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePartnerMetrics, type BoardLead } from "@/lib/demo-leads";
import { REGIONS, REGION_ORDER, cityRegion, getCity } from "@/lib/geo";
import { MOVERS } from "@/lib/movers";
import { LEAD_FEE_CAP_USD, PRO_MONTHLY_USD } from "@/lib/plans";
import { formatNumber, formatUsdPrecise, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

type TabId = "inbox" | "performance" | "billing";

const TABS: Array<{ id: TabId; label: string; icon: typeof Inbox }> = [
  { id: "inbox", label: "Lead board", icon: Inbox },
  { id: "performance", label: "Performance", icon: Sparkles },
  { id: "billing", label: "Billing", icon: CreditCard },
];

/** The partner account the demo signs you in as. */
const DEMO_PARTNER = MOVERS[0];

export function PartnerDashboard({ board, now }: { board: BoardLead[]; now: number }) {
  const [isPro, setIsPro] = useState(true);
  const [tab, setTab] = useState<TabId>("inbox");
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState<string>("all");
  const [onlyNew, setOnlyNew] = useState(false);

  const metrics = useMemo(() => generatePartnerMetrics(isPro), [isPro]);

  const visible = useMemo(
    () =>
      board.filter((item) => {
        if (onlyNew && item.status !== "new") return false;
        if (region === "all") return true;
        const from = getCity(item.lead.origin.cityCode);
        const to = getCity(item.lead.destination.cityCode);
        if (!from || !to) return false;
        return cityRegion(from) === region || cityRegion(to) === region;
      }),
    [board, region, onlyNew],
  );

  const walletSpent = useMemo(
    () =>
      [...unlocked].reduce(
        (sum, id) => sum + (board.find((b) => b.lead.id === id)?.feeUsd ?? 0),
        0,
      ),
    [unlocked, board],
  );

  const unlock = (id: string) => setUnlocked((prev) => new Set(prev).add(id));

  return (
    <div className="pb-20">
      {/* account bar -------------------------------------------- */}
      <div className="border-b bg-surface">
        <Shell className="flex flex-wrap items-center gap-4 py-5">
          <MoverLogo mover={DEMO_PARTNER} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold tracking-[-0.025em]">
              {DEMO_PARTNER.name}
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Partner ID {DEMO_PARTNER.id} · Istanbul
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <PlanSwitch isPro={isPro} onChange={setIsPro} />
            <Button variant="outline" size="sm" onClick={() => toast.info("CSV export queued")}>
              <Download className="size-3.5" />
              Export
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings2 className="size-4" />
            </Button>
          </div>
        </Shell>
      </div>

      {/* demo notice -------------------------------------------- */}
      <Shell className="pt-5">
        <p className="flex items-start gap-2.5 rounded-xl border border-brand bg-brand-soft p-3.5 text-[13px] leading-relaxed text-muted-foreground dark:bg-accent/50">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>
            <span className="font-medium text-foreground">Interactive demo.</span> Flip the plan
            switch above to see exactly how the lead board changes between{" "}
            <span className="font-medium text-foreground">Pro Unlimited</span> (everything
            unlocked, instant placement in customer search) and{" "}
            <span className="font-medium text-foreground">Pay Per Lead</span> (contact details
            hidden until you pay, capped at ${LEAD_FEE_CAP_USD}).
          </span>
        </p>
      </Shell>

      {/* tabs --------------------------------------------------- */}
      <Shell className="pt-6">
        <div role="tablist" className="flex gap-1 overflow-x-auto rounded-full border p-1 scrollbar-slim">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                  active ? "text-ink" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dash-tab"
                    className="absolute inset-0 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <t.icon className="relative size-3.5" />
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
      </Shell>

      {/* kpis --------------------------------------------------- */}
      <Shell className="pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Leads this month"
            value={formatNumber(metrics.leadsThisMonth)}
            sub={isPro ? "Unlimited on your plan" : `${metrics.unlocked} unlocked`}
          />
          <KpiCard
            label="Jobs won"
            value={String(metrics.won)}
            sub={`${pct(metrics.winRate)} of quotes`}
            tone="brand"
          />
          <KpiCard
            label="Avg. reply time"
            value={`${metrics.avgResponseMins} min`}
            sub={isPro ? "Auto-confirmed from your rate card" : "Manual pickup"}
          />
          <KpiCard
            label="Platform spend"
            value={formatUsdPrecise(metrics.spendUsd + walletSpent)}
            sub={
              isPro
                ? `Flat $${PRO_MONTHLY_USD}/mo, any volume`
                : `avg ${formatUsdPrecise(metrics.spendUsd / Math.max(1, metrics.unlocked))}/lead`
            }
            tone="verify"
          />
        </div>
      </Shell>

      {/* panels ------------------------------------------------- */}
      <Shell className="pt-8">
        {tab === "inbox" && (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[20px] tracking-[-0.03em]">
                Live lead board
              </h2>
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11.5px] font-medium text-ink tnum">
                {visible.filter((v) => v.status === "new").length} new
              </span>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyNew((v) => !v)}
                  aria-pressed={onlyNew}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition-colors",
                    onlyNew ? "border-brand bg-brand text-ink" : "hover:border-foreground/25",
                  )}
                >
                  <Filter className="size-3.5" />
                  New only
                </button>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="w-[190px]">
                    <SelectValue placeholder="All corridors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All corridors</SelectItem>
                    {REGION_ORDER.map((id) => (
                      <SelectItem key={id} value={id}>
                        {REGIONS[id].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {visible.map((item) => (
                <LeadRow
                  key={item.lead.id}
                  item={item}
                  isPro={isPro}
                  unlocked={unlocked.has(item.lead.id)}
                  onUnlock={unlock}
                  now={now}
                />
              ))}
              {visible.length === 0 && (
                <p className="rounded-xl border border-dashed p-10 text-center text-[14px] text-muted-foreground">
                  No leads match this filter right now. Widen the corridor selection.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "performance" && (
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <WeeklyChart data={metrics.weekly} />
            <CorridorSplit data={metrics.corridorSplit} />
            <div className="rounded-2xl border bg-card p-5 sm:p-6 lg:col-span-2">
              <h3 className="text-[17px] tracking-[-0.025em]">
                Where you are losing
              </h3>
              <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                See where you ranked on every enquiry you lost, and why.
              </p>
              <dl className="mt-6 grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="eyebrow">Median rank shown</dt>
                  <dd className="mt-1.5 text-[22px] font-medium tnum">3rd of 9</dd>
                </div>
                <div>
                  <dt className="eyebrow">Contacted after shortlist</dt>
                  <dd className="mt-1.5 text-[22px] font-medium tnum">41%</dd>
                </div>
                <div>
                  <dt className="eyebrow">Lost to response time</dt>
                  <dd className="mt-1.5 text-[22px] font-medium tnum">
                    {isPro ? "6%" : "31%"}
                  </dd>
                </div>
              </dl>
              {!isPro && (
                <p className="mt-5 rounded-lg border-l-2 border-brand bg-surface px-3 py-2 text-[13px] text-muted-foreground">
                  Nearly a third of your losses are speed, not price. Pro partners quote
                  automatically from their rate card and lose 6%.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "billing" && (
          <BillingPanel isPro={isPro} walletSpent={walletSpent} metrics={metrics} />
        )}
      </Shell>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function PlanSwitch({ isPro, onChange }: { isPro: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Subscription plan"
      className="inline-flex rounded-full border bg-background p-1"
    >
      {[
        { pro: true, label: "Pro Unlimited", icon: InfinityIcon, meta: `$${PRO_MONTHLY_USD}/mo` },
        { pro: false, label: "Pay Per Lead", icon: Ticket, meta: `≤$${LEAD_FEE_CAP_USD}` },
      ].map((option) => {
        const active = option.pro === isPro;
        return (
          <button
            key={option.label}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.pro)}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              active ? "text-ink" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="plan-pill"
                className="absolute inset-0 rounded-full bg-brand"
                transition={{ type: "spring", stiffness: 440, damping: 34 }}
              />
            )}
            <option.icon className="relative size-3.5" />
            <span className="relative">{option.label}</span>
            <span
              className={cn(
                "relative text-[10.5px] tnum",
                active ? "text-ink/60" : "text-muted-foreground",
              )}
            >
              {option.meta}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BillingPanel({
  isPro,
  walletSpent,
  metrics,
}: {
  isPro: boolean;
  walletSpent: number;
  metrics: ReturnType<typeof generatePartnerMetrics>;
}) {
  const invoices = [
    { ref: "INV-2026-0418", period: "This month", amount: isPro ? PRO_MONTHLY_USD : metrics.spendUsd, status: "Open" },
    { ref: "INV-2026-0392", period: "Last month", amount: isPro ? PRO_MONTHLY_USD : 198.4, status: "Paid" },
    { ref: "INV-2026-0361", period: "Two months ago", amount: isPro ? PRO_MONTHLY_USD : 164.8, status: "Paid" },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <Wallet className="size-4 text-brand" />
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Current plan
          </h3>
        </div>
        <p className="mt-4 text-[26px] font-semibold tracking-[-0.035em]">
          {isPro ? "Pro Unlimited" : "Pay Per Lead"}
        </p>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
          {isPro
            ? `Flat $${PRO_MONTHLY_USD} a month. Every international and domestic lead included, with instant-match placement in customer search. Cancel any time, no notice period.`
            : `No subscription. You are charged between $2 and $${LEAD_FEE_CAP_USD} each time you unlock a lead, and never more than the cap.`}
        </p>

        <dl className="mt-7 grid gap-5 border-t pt-6 sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Billed this cycle</dt>
            <dd className="mt-1.5 text-[24px] font-medium tnum">
              {formatUsdPrecise(isPro ? PRO_MONTHLY_USD : metrics.spendUsd + walletSpent)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Next charge</dt>
            <dd className="mt-1.5 text-[24px] font-medium tnum">
              {isPro ? "1 Nov" : "On unlock"}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Leads consumed</dt>
            <dd className="mt-1.5 text-[24px] font-medium tnum">
              {isPro ? "∞" : metrics.unlocked}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Effective cost / lead</dt>
            <dd className="mt-1.5 text-[24px] font-medium text-verify tnum">
              {formatUsdPrecise(
                (isPro ? PRO_MONTHLY_USD : metrics.spendUsd) /
                  Math.max(1, isPro ? metrics.leadsThisMonth : metrics.unlocked),
              )}
            </dd>
          </div>
        </dl>

        <Button
          className="mt-7"
          variant={isPro ? "outline" : "default"}
          onClick={() =>
            toast.success(isPro ? "Downgrade scheduled" : "Upgrade to Pro Unlimited", {
              description: isPro
                ? "You will move to Pay Per Lead at the end of the cycle."
                : `$${PRO_MONTHLY_USD}/month, unlimited leads, instant-match placement. 14-day trial starts now.`,
            })
          }
        >
          {isPro ? "Switch to Pay Per Lead" : `Upgrade to Pro — $${PRO_MONTHLY_USD}/mo`}
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Invoices
        </h3>
        <ul className="mt-5 divide-y">
          {invoices.map((inv) => (
            <li key={inv.ref} className="flex items-center gap-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] tnum">{inv.ref}</p>
                <p className="text-[12px] text-muted-foreground">{inv.period}</p>
              </div>
              <span className="shrink-0 text-[13px] tnum">
                {formatUsdPrecise(inv.amount)}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em]",
                  inv.status === "Paid"
                    ? "bg-verify/12 text-verify"
                    : "bg-brand-soft text-foreground",
                )}
              >
                {inv.status}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">
          Platform fees are billed in USD. Rotamove never touches the job revenue.
        </p>
      </div>
    </div>
  );
}
