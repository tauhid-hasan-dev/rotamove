"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  ChevronDown,
  Filter,
  Inbox,
  Check,
  Copy,
  LogOut,
  Route,
  Wallet,
} from "lucide-react";
import { MoverLogo } from "@/components/common/mover-logo";
import { PAGE_GUTTER } from "@/components/common/section";
import { Logo } from "@/components/site/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadRow } from "@/components/partners/dashboard/lead-row";
import { PlanPanel } from "@/components/partners/dashboard/plan-panel";
import { RoutesPanel } from "@/components/partners/dashboard/routes-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePartnerMetrics, type BoardLead } from "@/lib/demo-leads";
import type { PartnerLane } from "@/lib/lanes";
import type { PlanSubscription } from "@/lib/plan-store";
import type { Mover, PlanId } from "@/lib/types";
import { REGION_ORDER, cityRegion, getCity } from "@/lib/geo";
import { LEAD_FEE_CAP_USD, LEAD_FEE_FLOOR_USD, AVG_LEAD_FEE_USD, PRO_MONTHLY_USD } from "@/lib/plans";
import { MOVERS } from "@/lib/movers";
import { PARTNER_COOKIE } from "@/lib/partner-session";
import { useI18n } from "@/i18n/provider";
import { regionName } from "@/i18n/geo-labels";
import { cn } from "@/lib/utils";

type SectionId = "inbox" | "lanes" | "billing";

const SECTION_ICONS: Record<SectionId, typeof Inbox> = {
  inbox: Inbox,
  lanes: Route,
  billing: CreditCard,
};

const SECTION_IDS: SectionId[] = ["inbox", "lanes", "billing"];

/**
 * Partner dashboard.
 *
 * Three sections behind a sidebar, and nothing on screen the platform cannot
 * actually observe. The performance charts and the win-rate figures that used
 * to sit here were invented — Rotamove never learns whether a partner won the
 * job — so what remains is lead flow, response speed and spend.
 */
/** Who is signed in. Resolved from the session cookie on the server. */
export interface PartnerAccount {
  name: string;
  email: string;
  partnerId: string;
  moverId: string;
}

export function PartnerDashboard({
  board,
  now,
  lanes,
  initialUnlocked,
  subscription,
  account,
}: {
  board: BoardLead[];
  now: number;
  lanes: PartnerLane[];
  /** Server-recorded pay-per-seen unlocks, so a refresh keeps them revealed. */
  initialUnlocked: string[];
  /** The plan in force, plus any change queued for next month. */
  subscription: PlanSubscription;
  account: PartnerAccount;
}) {
  const { dict, href, t } = useI18n();
  const pd = dict.partnerDashboard;
  const router = useRouter();
  // Not state. The plan is a billing fact held on the server; the dashboard
  // renders it and asks the API to change it, rather than owning a copy
  // that a refresh would silently discard.
  const plan = subscription.plan;
  const [section, setSection] = useState<SectionId>("inbox");
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set(initialUnlocked));
  const [region, setRegion] = useState<string>("all");
  const [onlyNew, setOnlyNew] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const metrics = useMemo(() => generatePartnerMetrics(plan), [plan]);

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

  // Pro partners unlock for nothing; both per-unit plans pay per unlock.
  const walletSpent = useMemo(
    () =>
      plan === "pro_unlimited"
        ? 0
        : [...unlocked].reduce(
            (sum, id) => sum + (board.find((b) => b.lead.id === id)?.feeUsd ?? 0),
            0,
          ),
    [unlocked, board, plan],
  );

  // The mover record behind the signed-in account, for its logo and accent.
  const mover = useMemo(
    () => MOVERS.find((m) => m.id === account.moverId) ?? MOVERS[0],
    [account.moverId],
  );

  const copyPartnerId = () => {
    void navigator.clipboard?.writeText(account.partnerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const signOut = () => {
    document.cookie = `${PARTNER_COOKIE}=; path=/; max-age=0; samesite=lax`;
    router.push(href("/partners/login"));
  };

  return (
    <>
      {/* The workspace's own bar. Logo left, account right — the identity
          block used to sit at the top of the sidebar, which put the company
          name in the same column as the navigation and left the top of the
          page to a marketing header the partner has no use for. */}
      <DashboardBar
        account={account}
        mover={mover}
        plan={plan}
        copiedId={copiedId}
        onCopyId={copyPartnerId}
        onSignOut={signOut}
      />

      <div className={cn(PAGE_GUTTER, "flex flex-col gap-8 py-8 lg:flex-row lg:gap-10")}>
      {/* sidebar ------------------------------------------------- */}
      <aside className="lg:w-[228px] lg:shrink-0">
        <div className="lg:sticky lg:top-24">
          <nav className="flex gap-1 lg:flex-col" aria-label={pd.navAria}>
            {SECTION_IDS.map((id) => {
              const active = section === id;
              const Icon = SECTION_ICONS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] transition-colors lg:flex-none",
                    active
                      ? "bg-brand-soft font-medium text-foreground dark:bg-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={2} />
                  {pd.sections[id]}
                  {id === "inbox" && newCount > 0 && (
                    <span className="ms-auto rounded-full bg-brand px-1.5 py-0.5 text-[10.5px] font-medium text-ink tnum">
                      {newCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sign-out moved into the account menu in the bar; what is left
              here is the plan, which belongs beside the navigation because
              it changes what the sections show. */}
          <div className="mt-6 hidden border-t pt-6 lg:block">
            <PlanPanel subscription={subscription} />
          </div>
        </div>
      </aside>

      {/* content ------------------------------------------------- */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3 lg:hidden">
          <PlanPanel subscription={subscription} compact />
        </div>

        {/* kpis ------------------------------------------------- */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:mt-0">
          <Kpi
            label={pd.kpis.leadsThisMonth}
            value={t.number(metrics.leadsThisMonth)}
            sub={
              plan === "pro_unlimited"
                ? pd.kpis.unlimitedOnPlan
                : t.fill(pd.kpis.nUnlocked, { n: t.number(metrics.unlocked) })
            }
          />
          <Kpi
            label={pd.kpis.avgReply}
            value={t.fill(dict.units.minutesShort, { n: t.number(metrics.avgResponseMins) })}
            sub={plan === "pro_unlimited" ? pd.kpis.autoConfirmed : pd.kpis.manualPickup}
          />
          <Kpi
            label={pd.kpis.platformSpend}
            value={t.usd(Math.round((metrics.spendUsd + walletSpent) * 100) / 100)}
            sub={
              plan === "pro_unlimited"
                ? t.fill(pd.kpis.flatPerMonth, { amount: t.usd(PRO_MONTHLY_USD) })
                : t.fill(
                    plan === "pay_per_seen" ? pd.kpis.perUnlockApprox : pd.kpis.perLeadApprox,
                    { amount: t.usd(AVG_LEAD_FEE_USD) },
                  )
            }
          />
        </div>

        {section === "inbox" && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[20px] tracking-[-0.03em]">{pd.sections.inbox}</h2>

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
                  {pd.board.newOnly}
                </button>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="w-[190px]">
                    <SelectValue placeholder={dict.common.allCorridors} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{dict.common.allCorridors}</SelectItem>
                    {REGION_ORDER.map((id) => (
                      <SelectItem key={id} value={id}>
                        {regionName(dict, id)}
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
                  plan={plan}
                  unlocked={unlocked.has(item.lead.id)}
                  onUnlock={(id) => setUnlocked((prev) => new Set(prev).add(id))}
                  now={now}
                  email={account.email}
                />
              ))}
              {visible.length === 0 && (
                <p className="rounded-xl border border-dashed p-10 text-center text-[14px] text-muted-foreground">
                  {pd.board.empty}
                </p>
              )}
            </div>
          </div>
        )}

        {section === "lanes" && <RoutesPanel initial={lanes} now={now} />}

        {section === "billing" && (
          <BillingPanel
            plan={plan}
            walletSpent={walletSpent}
            metrics={metrics}
            now={now}
            subscription={subscription}
          />
        )}
      </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- */

/**
 * The dashboard's own top bar.
 *
 * Logo on the left, account on the right, nothing in between — a signed-in
 * workspace does not need the marketing nav, and a partner reading a lead
 * does not need eight ways to leave the page.
 *
 * The company, its plan and the account number all live behind the avatar,
 * which is where someone looks for "who am I signed in as". Sign-out is in
 * there too, rather than loose at the bottom of the sidebar.
 */
function DashboardBar({
  account,
  mover,
  plan,
  copiedId,
  onCopyId,
  onSignOut,
}: {
  account: PartnerAccount;
  mover: Mover;
  plan: PlanId;
  copiedId: boolean;
  onCopyId: () => void;
  onSignOut: () => void;
}) {
  const { dict } = useI18n();
  const pd = dict.partnerDashboard;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className={cn(PAGE_GUTTER, "flex h-16 items-center gap-4")}>
        {/* `Logo` is already a link home with its own label. Wrapping it in
            another one nested an <a> inside an <a>, which the HTML parser
            unpicks on the server and React then refuses to hydrate. */}
        <Logo className="shrink-0" />

        <DropdownMenu>
          <DropdownMenuTrigger className="ms-auto flex items-center gap-2.5 rounded-full p-1 ps-2.5 outline-ring/40 transition-colors hover:bg-muted">
            {/* The name and plan are hidden on phones; the avatar is the
                affordance, and the menu holds everything either way. */}
            <span className="hidden min-w-0 text-end sm:block">
              <span className="block truncate text-[13.5px] font-medium leading-tight">
                {mover.name}
              </span>
              <span className="block truncate text-[10.5px] uppercase tracking-[0.12em] leading-tight text-muted-foreground">
                {pd.planNames[plan]}
              </span>
            </span>
            <MoverLogo mover={mover} size="sm" />
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-[13.5px] font-medium">{mover.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {account.email}
              </span>
              <span className="mt-1.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {pd.planNames[plan]}
              </span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* The account number. Partners quote this to support, so it is
                one click to copy rather than something to read off a screen.
                `onSelect` is prevented so copying does not close the menu
                before the confirmation tick is visible. */}
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onCopyId();
              }}
              className="gap-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {pd.partnerId}
                </span>
                <span className="code mt-0.5 block truncate text-[13px] font-semibold">
                  {account.partnerId}
                </span>
              </span>
              {copiedId ? (
                <Check className="size-3.5 shrink-0 text-verify" strokeWidth={3} />
              ) : (
                <Copy className="size-3.5 shrink-0 text-muted-foreground" />
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={onSignOut} className="gap-2">
              <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />
              {dict.login.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

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

function BillingPanel({
  plan,
  walletSpent,
  metrics,
  now,
  subscription,
}: {
  plan: PlanId;
  walletSpent: number;
  metrics: ReturnType<typeof generatePartnerMetrics>;
  now: number;
  subscription: PlanSubscription;
}) {
  const { dict, t } = useI18n();
  const pd = dict.partnerDashboard;
  const isPro = plan === "pro_unlimited";

  const invoices = [
    { ref: "INV-2026-0418", period: pd.billing.periodThisMonth, amount: isPro ? PRO_MONTHLY_USD : metrics.spendUsd, paid: false },
    { ref: "INV-2026-0392", period: pd.billing.periodLastMonth, amount: isPro ? PRO_MONTHLY_USD : 198.4, paid: true },
    { ref: "INV-2026-0361", period: pd.billing.periodTwoMonthsAgo, amount: isPro ? PRO_MONTHLY_USD : 164.8, paid: true },
  ];

  // First of next month, from the request clock the board already carries.
  const anchor = new Date(now);
  const nextCycle = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);

  const planDescription = isPro
    ? t.fill(pd.billing.proDesc, { amount: t.usd(PRO_MONTHLY_USD) })
    : t.fill(plan === "pay_per_seen" ? pd.billing.ppsDesc : pd.billing.pplDesc, {
        floor: t.usd(LEAD_FEE_FLOOR_USD),
        cap: t.usd(LEAD_FEE_CAP_USD),
      });

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <Wallet className="size-4 text-brand" />
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {pd.billing.currentPlan}
          </h3>
        </div>
        <p className="mt-4 text-[26px] font-semibold tracking-[-0.035em]">
          {pd.planNames[plan]}
        </p>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
          {planDescription}
        </p>

        <dl className="mt-7 grid gap-5 border-t pt-6 sm:grid-cols-2">
          <div>
            <dt className="eyebrow">{pd.billing.billedThisCycle}</dt>
            <dd className="mt-1.5 text-[24px] font-medium tnum">
              {t.usd(
                Math.round((isPro ? PRO_MONTHLY_USD : metrics.spendUsd + walletSpent) * 100) /
                  100,
              )}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">{pd.billing.nextCharge}</dt>
            <dd className="mt-1.5 text-[24px] font-medium tnum">
              {isPro ? t.dateShort(nextCycle.toISOString()) : pd.billing.onUnlock}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">{pd.billing.leadsConsumed}</dt>
            <dd className="mt-1.5 text-[24px] font-medium tnum">
              {isPro ? "∞" : t.number(metrics.unlocked)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">{pd.billing.effectiveCost}</dt>
            <dd className="mt-1.5 text-[24px] font-medium text-verify tnum">
              {t.usd(
                Math.round(
                  ((isPro ? PRO_MONTHLY_USD : metrics.spendUsd) /
                    Math.max(1, isPro ? metrics.leadsThisMonth : metrics.unlocked)) *
                    100,
                ) / 100,
              )}
            </dd>
          </div>
        </dl>

        {/* The real control, not the toast-only button that used to sit
            here claiming an upgrade had happened. */}
        <div className="mt-7 border-t pt-6">
          <PlanPanel subscription={subscription} />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {pd.billing.invoices}
        </h3>
        <ul className="mt-5 divide-y">
          {invoices.map((inv) => (
            <li key={inv.ref} className="flex items-center gap-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] tnum">{inv.ref}</p>
                <p className="text-[12px] text-muted-foreground">{inv.period}</p>
              </div>
              <span className="shrink-0 text-[13px] tnum">{t.usd(inv.amount)}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em]",
                  inv.paid
                    ? "bg-verify/12 text-verify"
                    : "bg-brand-soft text-foreground dark:bg-accent",
                )}
              >
                {inv.paid ? pd.billing.statusPaid : pd.billing.statusOpen}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">
          {pd.billing.footnote}
        </p>
      </div>
    </div>
  );
}
