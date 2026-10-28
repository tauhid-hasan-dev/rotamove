# Pay-per-seen plan + full-app localization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third pricing plan ("Pay per seen") with a masked lead board, server-persisted per-unlock charging, simulated unlock email, and admin visibility of unlocks — and make language switching apply to every screen including the admin and partner dashboards.

**Architecture:** The plan id becomes a 3-value union threaded through the partner dashboard (replacing an `isPro` boolean). Pay-per-seen unlocks go through a new authenticated API route backed by an in-memory unlock store (same pattern as `lane-store.ts`); the admin reads the same store through a new live "Unlocks" view. Localization: the partner dashboard reads everything from the dictionary via the existing `useI18n()` provider; the admin keeps its own root layout at `/admin` but resolves its locale from the `rotamove.locale` cookie (the same cookie the site switcher writes) and gets a cookie-writing switcher in its topbar.

**Tech Stack:** Next.js 16 App Router (route handlers, `proxy.ts`), React 19 client components, zod 4, sonner toasts, existing i18n provider (`src/i18n/provider.tsx`) with `Widen`-typed dictionaries in 8 locales.

## Global Constraints

- No database, no real email: in-memory stores + simulated send, per spec.
- Verification is `npm run build` + `npm run lint` + driving the running app — there is no test runner in this repo.
- Dictionary shape is compile-checked: adding keys to `en.ts` breaks the build until all 7 other locales match (`src/i18n/dictionaries.ts:32`).
- "Do not break anything": existing Pro Unlimited / Pay per lead behaviour, admin seeded data, and all public pages must behave exactly as before.
- Design change vs. spec §4: admin stays at `/admin` (own root layout); locale comes from the `rotamove.locale` cookie instead of a path segment. Rationale: nesting admin under `[locale]` would leak `LastCallBar`/site skip-link into the admin chrome and change `/admin` URLs for no user-visible gain. The proxy matcher keeps excluding `/admin`.

---

### Task 1: Extend the plan model

**Files:**
- Modify: `src/lib/types.ts:117` — `export type PlanId = "pro_unlimited" | "pay_per_lead" | "pay_per_seen";`
- Modify: `src/lib/plans.ts` — add `PPS_FEATURE_INCLUDED: readonly boolean[]` (10 entries, aligned with the new `plans.ppsFeatures` dictionary list).
- Modify: `src/lib/admin/labels.ts:148` — `PLAN_LABELS` becomes `Record<PlanId, string>` with `pay_per_seen: "Pay per seen"` (text later localized in Task 8).
- Modify: `src/lib/demo-leads.ts:218` — `generatePartnerMetrics(plan: PlanId)`:
  pro → `{312, 312, PRO_MONTHLY_USD, 12}` (unchanged), pay_per_lead → `{47, 31, 31*AVG, 41}` (unchanged), pay_per_seen → `{54, 9, 9*AVG, 55}` (board is browsed masked, fewer unlocks).

**Interfaces:**
- Produces: `PlanId` (3 values), `generatePartnerMetrics(plan: PlanId): PartnerMetrics`, `PPS_FEATURE_INCLUDED`.

**Steps:**
- [ ] Change the union; run `npx tsc --noEmit` (or `npm run build`) and fix EVERY non-exhaustive `Record<PlanId, …>` / plan ternary the compiler reports (expected: `labels.ts`, possibly `seed.ts`, `metrics.ts`). Ternaries on `plan === "pay_per_lead"` keep compiling silently — grep `pay_per_lead` and audit each site; seeded admin invoices must be byte-identical (no seeded mover gets the new plan).
- [ ] Commit: `feat: add pay_per_seen to the plan model`

### Task 2: Unlock store + API routes

**Files:**
- Create: `src/lib/unlock-store.ts`
- Create: `src/app/api/partners/unlock/route.ts` (GET, POST)
- Create: `src/app/api/admin/unlocks/route.ts` (GET)

**Interfaces:**
- Produces:
  ```ts
  export interface UnlockRecord {
    id: string;              // ul_<nanoid(10)>
    partnerId: string;       // mover id
    partnerName: string;
    partnerPublicId: string; // DEMO_PARTNER_ID style account number
    leadId: string;
    routeLabel: string;      // snapshot from BoardLead
    volumeM3: number;
    feeUsd: number;
    unlockedAt: string;      // ISO
    emailTo: string;         // DEMO_EMAIL
    emailStatus: "sent" | "opened";
  }
  export interface UnlockRepository {
    listForPartner(partnerId: string): Promise<UnlockRecord[]>;
    listAll(): Promise<UnlockRecord[]>;             // newest first
    record(input: Omit<UnlockRecord, "id" | "unlockedAt" | "emailStatus">): Promise<{ record: UnlockRecord; created: boolean }>;
  }
  export const unlockRepository: UnlockRepository;
  ```
- API contracts:
  - `GET /api/partners/unlock` → 200 `{ unlocks: UnlockRecord[] }` (own only), 401 unauthenticated.
  - `POST /api/partners/unlock` body `{ leadId: string }` (zod: non-empty string) → 200 `{ unlock, created }`; idempotent on repeat (created:false, no double charge); 401 / 400 bad JSON / 422 zod / 404 unknown leadId.
  - `GET /api/admin/unlocks` → 200 `{ unlocks: UnlockRecord[] }` (all, newest first). Admin has no auth today; consistent.

**Steps:**
- [ ] Store: in-memory `Map<"partnerId:leadId", UnlockRecord>`, globalThis-stashed in dev like `lead-store.ts:60-67`, cap 1000 FIFO. "Email send" is simulated inside `record()` by setting `emailStatus: "sent"`.
- [ ] POST handler mirrors `api/partners/lanes/route.ts`: `signedInPartner()` → `unauthorised()`; the lead is resolved by regenerating `generateLeadBoard(Date.now(), 18)` server-side and finding `leadId` — the server's fee is authoritative. Partner identity: `DEMO_PARTNER` / `DEMO_PARTNER_ID` / `DEMO_EMAIL` from `partner-session.ts`.
- [ ] `runtime = "nodejs"; dynamic = "force-dynamic"` on both routes.
- [ ] Smoke: `curl -X POST http://localhost:3000/api/partners/unlock` → 401 without cookie; with `-H "Cookie: rotamove.partner=1"` and a real board id → 200; repeat → `created:false`.
- [ ] Commit: `feat: persist pay-per-seen unlocks behind an authenticated API`

### Task 3: Partner dashboard — three plans + real unlock flow

**Files:**
- Modify: `src/components/partners/dashboard/dashboard.tsx` (plan state, PlanSwitch, Billing, unlock seeding)
- Modify: `src/components/partners/dashboard/lead-row.tsx` (plan prop, masked rendering, API unlock)
- Modify: `src/app/[locale]/partners/dashboard/page.tsx` (pass initial unlocks for pay-per-seen)

**Interfaces:**
- Consumes: Task 1 `PlanId`/`generatePartnerMetrics`, Task 2 API.
- Produces: `LeadRow({ item, plan, unlocked, onUnlock, now })`; `PlanSwitch({ plan, onChange })` three-way; `BillingPanel({ plan, walletSpent, metrics })`.

**Steps:**
- [ ] `dashboard.tsx`: `useState<PlanId>("pro_unlimited")` replaces `isPro`; all `isPro` ternaries become plan switches (`:74, :95-104, :123, :184, :200, :216-231, :273, :291`). On mount (or when plan becomes pay_per_seen) `fetch("/api/partners/unlock")` and union the returned lead ids into `unlocked` so unlocks survive refresh. `walletSpent` charges for both non-pro plans.
- [ ] `PlanSwitch` → three pills: Pro (`Infinity`), Per lead (`Ticket`), Per seen (`Eye` from lucide). Same motion pill.
- [ ] `lead-row.tsx`: delete local fake-latency unlock; `unlock()` now: pro/per-lead keep the local 650 ms simulation (unchanged behaviour), pay_per_seen does `POST /api/partners/unlock {leadId}`, on ok → `onUnlock(id)` + success toast mentioning the confirmation email to `DEMO_EMAIL`; on error → `toast.error`, no reveal.
- [ ] Masked rendering when `plan === "pay_per_seen" && !revealed`: keep route (`RouteLine` + cities), m³, and new origin/destination access rows; replace date/service/storage/customs/notes/contact-name with a lock placeholder (reuse the dashed contact box style). Access rows (entrance type + parking, from `lead.origin.access` etc.) are added to the `<dl>` for ALL plans — data already exists.
- [ ] `BillingPanel` by plan: pay_per_seen copy ("charged only when you unlock"), next charge "On unlock", leads consumed = unlocked count.
- [ ] Verify in browser: switch to Per seen → board masks; unlock → reveal + toast; refresh → still revealed; Pro/Per-lead behave exactly as before.
- [ ] Commit: `feat: pay-per-seen masked board and server-backed unlock in the partner dashboard`

### Task 4: Marketing pricing card

**Files:**
- Modify: `src/components/partners/pricing-plans.tsx` (3rd entry, `lg:grid-cols-3`, `max-w-6xl`)
- Modify: `src/i18n/dictionaries/en.ts` `plans` section: `ppsName/ppsSuffix/ppsNote/ppsCta/ppsFeatures[10]` (other locales land in Task 8; until then the build is red, so Tasks 4–8 merge as one commit series finishing green — do NOT push mid-way)

**Steps:**
- [ ] Card: price label `formatUsd(locale, LEAD_FEE_FLOOR_USD)`–cap `/unlock`, note: browse every lead masked (volume, access, route) free; pay only when you unlock. Features from `PPS_FEATURE_INCLUDED`.
- [ ] Commit (after Task 8 makes all locales compile).

### Task 5: Admin Unlocks view

**Files:**
- Create: `src/app/admin/unlocks/page.tsx` (thin wrapper, like `billing/page.tsx`)
- Create: `src/components/admin/views/unlocks-view.tsx`
- Modify: `src/components/admin/shell.tsx:30-38` — nav entry `{ href: "/admin/unlocks", icon: Eye }` between Leads and Companies.

**Interfaces:**
- Consumes: `GET /api/admin/unlocks` (Task 2), `PageHeader`/`EmptyState` from `bits.tsx`, `DELIVERY_META` badge styling pattern.

**Steps:**
- [ ] Client view: `useEffect` fetch + "Refresh" button + 15 s polling; table (partner, lead route + m³, fee, unlocked at, email status badge); error state with retry; empty state explaining rows appear when a pay-per-seen partner clicks Unlock. All strings via dictionary (Task 7 keys).
- [ ] Verify: unlock a lead in the partner dashboard → row appears in `/admin/unlocks`.
- [ ] Commit with Task 8 series.

### Task 6: Admin becomes locale-aware (cookie-driven)

**Files:**
- Modify: `src/app/admin/layout.tsx` — `async`, read `(await cookies()).get(LOCALE_COOKIE)`, `resolveLocale`, `getDictionary(locale)`, `<html lang={locale} dir={dirFor(locale)}>`, script-correct font (copy the 3-font `FONT_FOR_SCRIPT` setup from `[locale]/layout.tsx:40-59`), toaster position by dir.
- Create: `src/components/admin/locale-switcher.tsx` — admin topbar dropdown: writes the cookie via `rememberLocale(next)` (`src/i18n/cookie.ts`) then `router.refresh()` (layout is `force-dynamic`, so refresh re-renders with the new dictionary).
- Modify: `src/components/admin/shell.tsx` — render the switcher in the topbar next to `ThemeToggle`.

**Steps:**
- [ ] Verify: change language on the public site → open `/admin` → admin is in that language; change it in the admin topbar → sticks and also affects the public site (same cookie).
- [ ] Commit with Task 8 series.

### Task 7: De-hardcode admin + partner dashboard strings

**Files:**
- Modify: `src/i18n/dictionaries/en.ts` — new top-level sections `partnerDashboard` (~90 keys incl. lanes panel/dialog/hub picker, unlock toasts, masked-row copy, access type labels if not already in `quote`/`enums`) and `admin` (~250 keys: nav, shell, common table bits, every view incl. unlocks, status label maps for lead/company/invoice/delivery/payment/serviceLevel/propertySize/flexibility/plans).
- Modify: all 16 files in `src/components/admin/**` and 5 files in `src/components/partners/dashboard/**` — replace literals with `dict.*` via `useI18n()`; `lead-row.tsx:9` drops `import { en }` for the provider; `dashboard.tsx:260` uses `regionName(dict, id)`; visible dates/relative times move from `src/lib/format.ts` to the provider's `t.*`.
- Modify: `src/lib/admin/labels.ts` — `*_META` keep `className`/`dotClassName`; label TEXT comes from `dict.admin.*` at the call sites (add a helper `statusLabel(dict, kind, id)` or inline lookups).
- Modify: `src/app/[locale]/partners/dashboard/page.tsx` — `generateMetadata` from dict.

**Steps:**
- [ ] en.ts first; then convert components file by file, keeping rendering identical in English (diff the screens visually).
- [ ] Commit with Task 8 series.

### Task 8: Translations for the 7 remaining locales

**Files:**
- Modify: `src/i18n/dictionaries/{tr,de,fr,it,nl,ru,ar}.ts` — mirror the new `plans.pps*`, `partnerDashboard`, `admin` keys.

**Steps:**
- [ ] Fan out one translation subagent per locale with the exact en block; paste results; `npm run build` green = shapes match.
- [ ] Commit the whole Task 4–8 series: `feat: localize admin and partner dashboards in all eight locales`

### Task 9: Final verification

- [ ] `npm run lint` and `npm run build` pass.
- [ ] Browser drive: (1) pricing page shows 3 cards in de/ar (RTL ok); (2) pay-per-seen flow end-to-end incl. refresh persistence and admin unlocks row; (3) language switch on home, partner dashboard, admin — all copy follows, RTL Arabic renders; (4) Pro + Per-lead unchanged; (5) `/admin` loads, old behaviour (no locale prefix) intact.
- [ ] Update the spec file's §4 to record the cookie-driven admin decision.
- [ ] Final commit.
