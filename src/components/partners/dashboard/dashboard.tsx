"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Filter,
  Inbox,
  Infinity as InfinityIcon,
  LogOut,
  Ticket,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { MoverLogo } from "@/components/common/mover-logo";
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
import { AVG_LEAD_FEE_USD, LEAD_FEE_CAP_USD, PRO_MONTHLY_USD } from "@/lib/plans";
import { DEMO_PARTNER, PARTNER_COOKIE } from "@/lib/partner-session";
import { formatNumber, formatUsdPrecise } from "@/lib/format";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type SectionId = "inbox" | "billing";

const SECTIONS: Array<{ id: SectionId; label: string; icon: typeof Inbox }> = [
  { id: "inbox", label: "Lead board", icon: Inbox },
  { id: "billing", label: "Billing", icon: CreditCard },
];

/**
 * Partner dashboard.
 *
 * Two sections behind a sidebar, and nothing on screen the platform cannot
 * actually observe. The performance charts and the win-rate figures that used
 * to sit here were invented — Rotamove never learns whether a partner won the
 * job — so what remains is lead flow, response speed and spend.
 */
export function PartnerDashboard({ board, now }: { board: BoardLead[]; now: number }) {
  const { dict, href } = useI18n();
  const router = useRouter();
  const [isPro, setIsPro] = useState(true);
  const [section, setSection] = useState<SectionId>("inbox");
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState<string>("all");
  const [onlyNew, setOnlyNew] = useState(false);

  const metrics = useMemo(() => generatePartnerMetrics(isPro), [isPro]);

  const visible = useMemo(
    () =>
      board.filter((item) => {
        const isNew = item.status === "new" && !unlocked.has(item.lead.id);
        if (onlyNew && !isNew) return false;
        if (region === "all") return true;
        const from = getCity(item.lead.origin.cityCode);
        const to = getCity(item.lead.destination.cityCode);
        if (!from || !to) return false;
        return cityRegion(from) === region || cityRegion(to) === region;
      }),
    [board, region, onlyNew, unlocked],
  );

  const newCount = visible.filter(
    (v) => v.status === "new" && !unlocked.has(v.lead.id),
  ).length;

  // Pro partners unlock for nothing; only pay-per-lead unlocks cost money.
  const walletSpent = useMemo(
    () =>
      isPro
        ? 0
        : [...unlocked].reduce(
            (sum, id) => sum + (board.find((b) => b.lead.id === id)?.feeUsd ?? 0),
            0,
          ),
    [unlocked, board, isPro],
  );

  const signOut = () => {
    document.cookie = `${PARTNER_COOKIE}=; path=/; max-age=0; samesite=lax`;
    router.push(href("/partners/login"));
  };

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10 lg:px-8">
      {/* sidebar ------------------------------------------------- */}
      <aside className="lg:w-[228px] lg:shrink-0">
        <div className="lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <MoverLogo mover={DEMO_PARTNER} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-semibold tracking-[-0.02em]">
                {DEMO_PARTNER.name}
              </p>
              <p className="truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {isPro ? "Pro Unlimited" : "Pay Per Lead"}
              </p>
            </div>
          </div>

          <nav className="mt-6 flex gap-1 lg:flex-col" aria-label="Dashboard">
            {SECTIONS.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] transition-colors lg:flex-none",
                    active
                      ? "bg-brand-soft font-medium text-foreground dark:bg-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" strokeWidth={2} />
                  {item.label}
                  {item.id === "inbox" && newCount > 0 && (
                    <span className="ms-auto rounded-full bg-brand px-1.5 py-0.5 text-[10.5px] font-medium text-ink tnum">
                      {newCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 hidden border-t pt-6 lg:block">
            <PlanSwitch isPro={isPro} onChange={setIsPro} />
            <button
              type="button"
              onClick={signOut}
              className="mt-4 inline-flex items-center gap-2 px-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-3.5 rtl:-scale-x-100" />
              {dict.login.signOut}
            </button>
          </div>
        </div>
      </aside>

      {/* content ------------------------------------------------- */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3 lg:hidden">
          <PlanSwitch isPro={isPro} onChange={setIsPro} />
          <button
            type="button"
            onClick={signOut}
            className="ms-auto inline-flex items-center gap-2 text-[13px] text-muted-foreground"
          >
            <LogOut className="size-3.5 rtl:-scale-x-100" />
            {dict.login.signOut}
          </button>
        </div>

        {/* kpis ------------------------------------------------- */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:mt-0">
          <Kpi
            label="Leads this month"
            value={formatNumber(metrics.leadsThisMonth)}
            sub={isPro ? "Unlimited on your plan" : `${metrics.unlocked} unlocked`}
          />
          <Kpi
            label="Avg. reply time"
            value={`${metrics.avgResponseMins} min`}
            sub={isPro ? "Auto-confirmed from your rate card" : "Manual pickup"}
          />
          <Kpi
            label="Platform spend"
            value={formatUsdPrecise(metrics.spendUsd + walletSpent)}
            sub={
              isPro
                ? `Flat $${PRO_MONTHLY_USD}/mo, any volume`
                : `≈ ${formatUsdPrecise(AVG_LEAD_FEE_USD)} per lead`
            }
          />
        </div>

        {section === "inbox" && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[20px] tracking-[-0.03em]">Lead board</h2>

              <div className="ms-auto flex flex-wrap items-center gap-2">
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
                  onUnlock={(id) => setUnlocked((prev) => new Set(prev).add(id))}
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

        {section === "billing" && (
          <BillingPanel isPro={isPro} walletSpent={walletSpent} metrics={metrics} />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2.5 text-[26px] font-medium leading-none tracking-[-0.035em] tnum">
        {value}
      </p>
      <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">{sub}</p>
    </div>
  );
}

function PlanSwitch({ isPro, onChange }: { isPro: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Subscription plan"
      className="inline-flex rounded-full border bg-background p-1"
    >
      {[
        { pro: true, label: "Pro", icon: InfinityIcon },
        { pro: false, label: "Per lead", icon: Ticket },
      ].map((option) => {
        const active = option.pro === isPro;
        return (
          <button
            key={option.label}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.pro)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
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
    <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
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
                : `$${PRO_MONTHLY_USD}/month, unlimited leads, instant-match placement.`,
            })
          }
        >
          {isPro ? "Switch to Pay Per Lead" : `Upgrade to Pro — $${PRO_MONTHLY_USD}/mo`}
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Invoices</h3>
        <ul className="mt-5 divide-y">
          {invoices.map((inv) => (
            <li key={inv.ref} className="flex items-center gap-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] tnum">{inv.ref}</p>
                <p className="text-[12px] text-muted-foreground">{inv.period}</p>
              </div>
              <span className="shrink-0 text-[13px] tnum">{formatUsdPrecise(inv.amount)}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em]",
                  inv.status === "Paid"
                    ? "bg-verify/12 text-verify"
                    : "bg-brand-soft text-foreground dark:bg-accent",
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
