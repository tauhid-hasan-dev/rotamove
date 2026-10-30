"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowRight,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Filter,
  Inbox,
  Check,
  Copy,
  LayoutDashboard,
  LogOut,
  Receipt,
  Route,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import { MoverLogo } from "@/components/common/mover-logo";
import { DASHBOARD_GUTTER, PANEL } from "@/components/partners/dashboard/surface";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Logo } from "@/components/site/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArchivePanel } from "@/components/partners/dashboard/archive-panel";
import { LeadRow } from "@/components/partners/dashboard/lead-row";
import { LeadTrendPanel } from "@/components/partners/dashboard/lead-trend";
import { NotificationsPanel } from "@/components/partners/dashboard/notifications-panel";
import { PlanPanel } from "@/components/partners/dashboard/plan-panel";
import { RoutesPanel } from "@/components/partners/dashboard/routes-panel";
import { SettingsPanel } from "@/components/partners/dashboard/settings-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePartnerMetrics, type BoardLead } from "@/lib/demo-leads";
import type { PartnerLane } from "@/lib/lanes";
import { DAY_MS, daysUntil } from "@/lib/plan-cycle";
import { generatePartnerHistory, type PartnerHistory } from "@/lib/partner-history";
import type { PartnerProfile } from "@/lib/partner-profile";
import type { PlanSubscription } from "@/lib/plan-store";
import type { Mover, PlanId } from "@/lib/types";
import { REGION_ORDER, cityRegion, getCity } from "@/lib/geo";
import { LEAD_FEE_CAP_EUR, LEAD_FEE_FLOOR_EUR, AVG_LEAD_FEE_EUR, PRO_MONTHLY_EUR } from "@/lib/plans";
import { MOVERS } from "@/lib/movers";
import { PARTNER_COOKIE } from "@/lib/partner-session";
import { useI18n } from "@/i18n/provider";
import { regionName } from "@/i18n/geo-labels";
import { cn } from "@/lib/utils";

/**
 * `settings` is a section like the others but is deliberately absent from
 * `SECTION_IDS`, so it does not appear in the rail. It is reached from the
 * account menu, which is where someone looks for the things that are about
 * them rather than about their leads — and a fifth rail entry would cost the
 * four daily ones width on a phone to show the one opened once a quarter.
 *
 * The two `archive/` sections are not in `SECTION_IDS` either: they hang off
 * the Archive disclosure below it, because they are one destination a
 * partner visits occasionally and not two more daily tabs.
 */
type SectionId =
  | "overview"
  | "inbox"
  | "lanes"
  | "billing"
  | "settings"
  | "archive/invoices"
  | "archive/leads";

const SECTION_ICONS: Record<SectionId, typeof Inbox> = {
  overview: LayoutDashboard,
  inbox: Inbox,
  lanes: Route,
  billing: CreditCard,
  settings: Settings,
  "archive/invoices": Receipt,
  "archive/leads": Inbox,
};

/**
 * What the rail offers at the top level.
 *
 * Narrower than `SectionId` on purpose: these are exactly the ids that
 * `dict.partnerDashboard.sections` has a label for, so the rail can index it
 * without a cast. The archive's two children take their labels from the
 * archive dictionary instead, because that is where the rest of their words
 * already live.
 */
type RailSectionId = Extract<SectionId, "overview" | "inbox" | "lanes" | "billing">;

const SECTION_IDS: RailSectionId[] = ["overview", "inbox", "lanes", "billing"];

/** The Archive disclosure's children, in the order they are offered. */
const ARCHIVE_IDS = ["archive/invoices", "archive/leads"] as const;

const isArchive = (section: SectionId): boolean => section.startsWith("archive/");

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
  subscription: initialSubscription,
  account,
  profile,
}: {
  board: BoardLead[];
  now: number;
  lanes: PartnerLane[];
  /** Server-recorded pay-per-seen unlocks, so a refresh keeps them revealed. */
  initialUnlocked: string[];
  /** The plan in force at render time. Reconciled against the API on mount. */
  subscription: PlanSubscription;
  account: PartnerAccount;
  /** Editable account details, behind the account menu's Settings entry. */
  profile: PartnerProfile;
}) {
  const { dict, href } = useI18n();
  const pd = dict.partnerDashboard;
  const router = useRouter();

  /*
   * The plan is a billing fact held on the server, and this is the first
   * paint of it — not the owner of it.
   *
   * It used to be read straight from the prop on every render, on the
   * reasoning that state here would be a copy a refresh could silently
   * discard. That is true of a single server, and false of this one: Next
   * compiles route handlers and page renders into separate serverless
   * functions with separate memory, so on Vercel the plan API writes into
   * one process and this page is rendered by another that cannot see it. A
   * partner changed their plan, got the confirmation, and found the old plan
   * still on screen after a reload.
   *
   * So the API is the single source of truth and the prop is a starting
   * value: the subscription is reconciled against `GET /api/partners/plan`
   * on mount, and updated from the response of any change. `router.refresh()`
   * still runs for everything else on the page.
   */
  const [subscription, setSubscription] = useState(initialSubscription);

  useEffect(() => {
    // Through a timer so the state update lands in a callback rather than in
    // the effect body — the shape `react-hooks/set-state-in-effect` requires.
    const id = setTimeout(async () => {
      try {
        const response = await fetch("/api/partners/plan", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { subscription: PlanSubscription };
        setSubscription(data.subscription);
      } catch {
        // The server-rendered value stays on screen. It is the right value on
        // any single-process deployment and a stale one here at worst.
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const plan = subscription.plan;
  const [section, setSection] = useState<SectionId>("overview");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set(initialUnlocked));
  const [region, setRegion] = useState<string>("all");
  const [onlyNew, setOnlyNew] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const metrics = useMemo(() => generatePartnerMetrics(plan), [plan]);

  /*
   * The account's own past: the daily series the trend chart draws, and the
   * invoices and leads old enough to be archived.
   *
   * Keyed on the plan because the volumes are a function of it, and on the
   * server-supplied `now` rather than the clock, so the first client render
   * reproduces the server's bars exactly.
   */
  const history = useMemo(() => generatePartnerHistory(plan, now), [plan, now]);

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
            (sum, id) => sum + (board.find((b) => b.lead.id === id)?.feeEur ?? 0),
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
        onOpenSettings={() => setSection("settings")}
        onSignOut={signOut}
      />

      <div className={cn(DASHBOARD_GUTTER, "flex flex-col gap-8 py-8 lg:flex-row lg:gap-10")}>
      {/* sidebar ------------------------------------------------- */}
      <aside className="lg:w-[228px] lg:shrink-0">
        <div className="lg:sticky lg:top-24">
          {/* On a phone this is a strip, not a column. With a fourth entry
              it no longer divides the width into readable thirds, so the
              labels size to their own text and the strip scrolls — better
              a row you can push than "Lead board" broken over two lines. */}
          <nav
            className="scrollbar-slim -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
            aria-label={pd.navAria}
          >
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
                    "inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[14px] transition-colors lg:w-full",
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

            {/* Archive is a disclosure, not a destination: it has nothing of
                its own to show, so the button opens the two things it holds
                rather than a landing page listing them. It stays open while
                one of them is the current section, so navigating into the
                archive does not collapse the way back out. */}
            <button
              type="button"
              onClick={() => setArchiveOpen((v) => !v)}
              aria-expanded={archiveOpen || isArchive(section)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[14px] transition-colors lg:w-full",
                isArchive(section)
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Archive className="size-4 shrink-0" strokeWidth={2} />
              {pd.sections.archive}
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 transition-transform duration-200 lg:ms-auto rtl:-scale-x-100",
                  (archiveOpen || isArchive(section)) && "rotate-90 rtl:-rotate-90",
                )}
                aria-hidden
              />
            </button>

            {(archiveOpen || isArchive(section)) &&
              ARCHIVE_IDS.map((id) => {
                const active = section === id;
                const Icon = SECTION_ICONS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSection(id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      // Indented on the column, flush in the phone strip —
                      // there is no parent above it there to indent from.
                      "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13.5px] transition-colors lg:w-full lg:ps-9",
                      active
                        ? "bg-brand-soft font-medium text-foreground dark:bg-accent"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" strokeWidth={2} />
                    {pd.archive[id === "archive/invoices" ? "invoices" : "leads"]}
                  </button>
                );
              })}
          </nav>

          {/* Sign-out moved into the account menu in the bar; what is left
              here is the plan, which belongs beside the navigation because
              it changes what the sections show. */}
          <div className="mt-6 hidden border-t pt-6 lg:block">
            <PlanPanel subscription={subscription} now={now} onChanged={setSubscription} />
          </div>
        </div>
      </aside>

      {/* content ------------------------------------------------- */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3 lg:hidden">
          <PlanPanel subscription={subscription} now={now} onChanged={setSubscription} compact />
        </div>

        {section === "overview" && (
          <OverviewPanel
            account={account}
            board={board}
            unlocked={unlocked}
            lanes={lanes}
            metrics={metrics}
            history={history}
            plan={plan}
            walletSpent={walletSpent}
            subscription={subscription}
            now={now}
            onGoTo={setSection}
          />
        )}

        {isArchive(section) && (
          <ArchivePanel
            view={section === "archive/invoices" ? "invoices" : "leads"}
            history={history}
            // The trading name off the mover record rather than the contact's
            // own name: an invoice is addressed to the company that owes it.
            partner={{
              companyName: mover.name,
              partnerId: account.partnerId,
              email: account.email,
            }}
          />
        )}

        {section === "settings" && <SettingsPanel profile={profile} />}

        {section === "inbox" && (
          <div className="mt-4 lg:mt-0">
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

            {/* space-y-5, not -3. Each row is a tinted card carrying four
                lines and its own actions; at twelve pixels the gap read as
                a table rule rather than as separation, and the eye lost
                where one lead ended and the next began. */}
            <div className="mt-5 space-y-5">
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
            onChanged={setSubscription}
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
  onOpenSettings,
  onSignOut,
}: {
  account: PartnerAccount;
  mover: Mover;
  plan: PlanId;
  copiedId: boolean;
  onCopyId: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  const { dict } = useI18n();
  const pd = dict.partnerDashboard;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className={cn(DASHBOARD_GUTTER, "flex h-16 items-center gap-4")}>
        {/* `Logo` is already a link home with its own label. Wrapping it in
            another one nested an <a> inside an <a>, which the HTML parser
            unpicks on the server and React then refuses to hydrate. */}
        <Logo className="shrink-0" />

        {/* Language sits immediately before the account block, which is
            where a signed-in partner looks for the things that are about
            them rather than about their leads. It is the same switcher the
            public site uses, so it keeps the path and only swaps the
            locale — changing language on the dashboard returns you to the
            dashboard. */}
        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher />

          <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full p-1 ps-2.5 outline-ring/40 transition-colors hover:bg-muted">
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

            {/* Account settings. Here rather than in the section rail: this
                is where someone looks for the things that are about them,
                and the rail belongs to the four sections they open daily. */}
            <DropdownMenuItem onSelect={onOpenSettings} className="gap-2">
              <Settings className="size-4" aria-hidden />
              {pd.sections.settings}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={onSignOut} className="gap-2">
              <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />
              {dict.login.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/**
 * The Dashboard section.
 *
 * What the three KPIs used to do from above every page, plus the context
 * that makes them mean something — and nothing beyond what the platform can
 * actually observe. There is no win rate here and no revenue chart, because
 * Rotamove never learns whether a partner won the job; inventing that was
 * the reason the old performance panel was taken out, and it is not coming
 * back dressed as an overview.
 *
 * Everything below is derived from the board, the lanes and the plan the
 * partner is already looking at on the other three sections.
 */
function OverviewPanel({
  account,
  board,
  unlocked,
  lanes,
  metrics,
  history,
  plan,
  walletSpent,
  subscription,
  now,
  onGoTo,
}: {
  account: PartnerAccount;
  board: BoardLead[];
  unlocked: Set<string>;
  lanes: PartnerLane[];
  metrics: ReturnType<typeof generatePartnerMetrics>;
  history: PartnerHistory;
  plan: PlanId;
  walletSpent: number;
  subscription: PlanSubscription;
  now: number;
  onGoTo: (section: SectionId) => void;
}) {
  const { dict, t } = useI18n();
  const pd = dict.partnerDashboard;
  const ov = pd.overview;
  const isPro = plan === "pro_unlimited";

  const awaiting = board.filter((b) => b.status === "new" && !unlocked.has(b.lead.id)).length;

  /*
   * Corridors on the board right now, busiest first. Counted, not modelled.
   *
   * Grouped by region pair rather than by city pair. Eighteen leads across
   * eighteen distinct city pairs is eighteen bars all reading "1", which is
   * a chart that has learned nothing — at region level the same board says
   * "most of what is in front of you is Türkiye to Western Europe", which is
   * the thing a dispatcher would actually act on.
   */
  const corridors = useMemo(() => {
    const tally = new Map<string, { label: string; value: number }>();
    for (const item of board) {
      const from = getCity(item.lead.origin.cityCode);
      const to = getCity(item.lead.destination.cityCode);
      if (!from || !to) continue;
      const fromRegion = cityRegion(from);
      const toRegion = cityRegion(to);
      const key = `${fromRegion}:${toRegion}`;
      const entry = tally.get(key);
      if (entry) entry.value += 1;
      else {
        tally.set(key, {
          label: `${regionName(dict, fromRegion)} → ${regionName(dict, toRegion)}`,
          value: 1,
        });
      }
    }
    return [...tally.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [board, dict]);

  const activeLanes = lanes.filter((lane) => lane.status === "active").length;

  /*
   * The next charge is the day after this period's last day — the period the
   * partner actually bought, not the calendar month. This used to be the 1st
   * of next month, which told a carrier who joined on the 18th that their
   * flat fee was due in twelve days when it was due in thirty.
   */
  const nextCycle = new Date(Date.parse(subscription.cycleEnds) + DAY_MS);

  return (
    <div className="mt-4 lg:mt-0">
      {/* Above the greeting, because a document request holding up an
          application is the most important thing on this page and renders
          nothing at all when there is none. */}
      <NotificationsPanel />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] tracking-[-0.03em]">
            {t.fill(ov.greeting, { name: account.name })}
          </h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {awaiting > 0
              ? t.fill(ov.awaiting, { n: t.number(awaiting) })
              : ov.awaitingNone}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onGoTo("inbox")}
          className="group inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-[13.5px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985]"
        >
          {ov.openBoard}
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
        </button>
      </div>

      {/* Three figures, one row.
          "Avg. reply time" and "On the board now" used to sit here too. The
          first was the only number on the page the platform infers rather
          than observes, and the second restated the line directly above it —
          the greeting already says how many leads are waiting. What is left
          is volume, cost and reach, which is the set a partner can act on. */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          label={pd.kpis.leadsThisMonth}
          value={t.number(metrics.leadsThisMonth)}
          sub={
            isPro
              ? pd.kpis.unlimitedOnPlan
              : t.fill(pd.kpis.nUnlocked, { n: t.number(metrics.unlocked) })
          }
        />
        <Kpi
          label={pd.kpis.platformSpend}
          value={t.eur(Math.round((metrics.spendEur + walletSpent) * 100) / 100)}
          sub={
            isPro
              ? t.fill(pd.kpis.flatPerMonth, { amount: t.eur(PRO_MONTHLY_EUR) })
              : t.fill(plan === "pay_per_seen" ? pd.kpis.perUnlockApprox : pd.kpis.perLeadApprox, {
                  amount: t.eur(AVG_LEAD_FEE_EUR),
                })
          }
        />
        {/* Routes was a panel of its own in the grid below. As a third card
            it reads as what it is — a count, with the same weight as the
            other two — and the link it carried comes with it. */}
        <Kpi
          label={pd.sections.lanes}
          value={t.number(activeLanes)}
          sub={
            lanes.length === 0
              ? pd.lanes.emptyTitle
              : lanes.length === activeLanes
                ? ov.lanesAllActive
                : t.fill(ov.lanesPaused, { n: t.number(lanes.length - activeLanes) })
          }
          action={{ label: ov.manageLanes, onClick: () => onGoTo("lanes") }}
        />
      </div>

      {/* Directly under the cards, because it is the same three months of
          the same account seen as a shape rather than as one number. */}
      <LeadTrendPanel days={history.days} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* corridors ------------------------------------------- */}
        <section className={cn(PANEL, "p-6")}>
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {ov.corridorsTitle}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {ov.corridorsBody}
          </p>
          {corridors.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed p-6 text-center text-[13px] text-muted-foreground">
              {pd.board.empty}
            </p>
          ) : (
            <Bars items={corridors} className="mt-4" />
          )}
        </section>

        {/* billing -------------------------------------------- */}
        <div className="grid gap-4">
          <section className={cn(PANEL, "p-6")}>
            <div className="flex items-center gap-2.5">
              <Sparkles className="size-4 text-brand" aria-hidden />
              <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {pd.billing.currentPlan}
              </h3>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="eyebrow">{pd.billing.billedThisCycle}</dt>
                <dd className="mt-1.5 text-[20px] font-medium tnum">
                  {t.eur(
                    Math.round((isPro ? PRO_MONTHLY_EUR : metrics.spendEur + walletSpent) * 100) /
                      100,
                  )}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">{pd.billing.nextCharge}</dt>
                <dd className="mt-1.5 text-[20px] font-medium tnum">
                  {isPro ? t.dateShort(nextCycle.toISOString()) : pd.billing.onUnlock}
                </dd>
              </div>
            </dl>
            {subscription.pendingPlan && subscription.effectiveFrom && (
              <p className="mt-4 text-[12.5px] leading-snug text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t.fill(pd.planChange.remaining, {
                    days: t.count(
                      dict.units.days,
                      daysUntil(now, subscription.effectiveFrom),
                    ),
                    plan: pd.planNames[subscription.pendingPlan],
                  })}
                </span>{" "}
                {t.fill(pd.planChange.pendingLine, {
                  plan: pd.planNames[subscription.pendingPlan],
                  date: t.dateLong(subscription.effectiveFrom),
                })}
              </p>
            )}
            <button
              type="button"
              onClick={() => onGoTo("billing")}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium underline decoration-brand decoration-2 underline-offset-4"
            >
              {ov.openBilling}
            </button>
          </section>
        </div>
      </div>

    </div>
  );
}

/**
 * A ranked list with a bar behind each value.
 *
 * Written here rather than imported from the admin console: that module is
 * a client bundle built around the admin's own data store, and a partner
 * dashboard reaching into it to borrow twenty lines of markup would tie two
 * unrelated surfaces together for no gain.
 */
function Bars({
  items,
  className,
}: {
  items: Array<{ key: string; label: string; value: number }>;
  className?: string;
}) {
  const { t } = useI18n();
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol className={className}>
      {items.map((item) => (
        <li key={item.key} className="py-1.5">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="shrink-0 font-medium tnum">{t.number(item.value)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-brand-deep"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * One figure, its caption, and optionally a way into the section behind it.
 *
 * The action is laid out at the bottom of the card rather than after the
 * caption, so a card that has one stays the same height as the two beside it
 * that do not.
 */
function Kpi({
  label,
  value,
  sub,
  action,
}: {
  label: string;
  value: string;
  sub: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className={cn(PANEL, "flex flex-col p-5")}>
      <p className="eyebrow">{label}</p>
      <p className="mt-2.5 text-[26px] font-medium leading-none tracking-[-0.035em] tnum">
        {value}
      </p>
      <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">{sub}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-auto pt-3 text-start text-[13px] font-medium underline decoration-brand decoration-2 underline-offset-4"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function BillingPanel({
  plan,
  walletSpent,
  metrics,
  now,
  subscription,
  onChanged,
}: {
  plan: PlanId;
  walletSpent: number;
  metrics: ReturnType<typeof generatePartnerMetrics>;
  now: number;
  subscription: PlanSubscription;
  onChanged: (next: PlanSubscription) => void;
}) {
  const { dict, t } = useI18n();
  const pd = dict.partnerDashboard;
  const isPro = plan === "pro_unlimited";

  const invoices = [
    { ref: "INV-2026-0418", period: pd.billing.periodThisMonth, amount: isPro ? PRO_MONTHLY_EUR : metrics.spendEur, paid: false },
    { ref: "INV-2026-0392", period: pd.billing.periodLastMonth, amount: isPro ? PRO_MONTHLY_EUR : 198.4, paid: true },
    { ref: "INV-2026-0361", period: pd.billing.periodTwoMonthsAgo, amount: isPro ? PRO_MONTHLY_EUR : 164.8, paid: true },
  ];

  // Same thirty-day boundary the overview shows, from the subscription rather
  // than the calendar.
  const nextCycle = new Date(Date.parse(subscription.cycleEnds) + DAY_MS);

  const planDescription = isPro
    ? t.fill(pd.billing.proDesc, { amount: t.eur(PRO_MONTHLY_EUR) })
    : t.fill(plan === "pay_per_seen" ? pd.billing.ppsDesc : pd.billing.pplDesc, {
        floor: t.eur(LEAD_FEE_FLOOR_EUR),
        cap: t.eur(LEAD_FEE_CAP_EUR),
      });

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className={cn(PANEL, "p-6")}>
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
              {t.eur(
                Math.round((isPro ? PRO_MONTHLY_EUR : metrics.spendEur + walletSpent) * 100) /
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
              {t.eur(
                Math.round(
                  ((isPro ? PRO_MONTHLY_EUR : metrics.spendEur) /
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
          <PlanPanel subscription={subscription} now={now} onChanged={onChanged} />
        </div>
      </div>

      <div className={cn(PANEL, "p-6")}>
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
              <span className="shrink-0 text-[13px] tnum">{t.eur(inv.amount)}</span>
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
