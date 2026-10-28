# Pay-per-seen plan + full-app localization — design

Date: 2026-10-28
Status: approved (masked view = m³ + access + route; simulated email; all 8 locales)

## Goal

Two deliverables, shipped together without breaking existing behaviour:

1. A third pricing plan, **Pay per seen** (`pay_per_seen`): the partner sees a
   masked lead board and pays only when they click **Unlock** on a lead. Each
   unlock is persisted server-side, triggers a (simulated) confirmation email,
   counts the lead against the partner, and is visible to the admin.
2. **Language switching applies to every screen**, including the admin
   dashboard and the partner dashboard, which today are hardcoded English.

## 1. Plan model

- Extend `PlanId` (`src/lib/types.ts:117`) to
  `"pro_unlimited" | "pay_per_lead" | "pay_per_seen"`.
- The unlock fee for pay-per-seen reuses the existing `leadFeeUsd(lead)`
  formula (`src/lib/plans.ts:58`) — same $2–7 band. No new economics.
- `PLAN_LABELS` (`src/lib/admin/labels.ts:148`) gains the third entry; every
  `Record<PlanId, …>` and two-plan ternary is extended.
- Marketing: third card in `src/components/partners/pricing-plans.tsx`
  (`lg:grid-cols-3`), fed by new `plans.pps*` dictionary keys. Positioning:
  no monthly fee, see the essentials of every lead free, pay only for the
  leads you choose to open.

## 2. Partner dashboard

- Replace the `isPro: boolean` state (`dashboard.tsx:67`) with
  `plan: PlanId`; `PlanSwitch` becomes a three-way selector
  (Pro Unlimited / Pay per lead / Pay per seen).
  `generatePartnerMetrics(planIsPro)` takes the plan id instead.
- `LeadRow` gets the plan. Rendering on **pay per seen**, pre-unlock:
  - **Visible:** route (cities), payload m³, origin access, destination
    access (entrance type + parking), age, status pill.
  - **Hidden** behind a blurred/masked block: move date, service level,
    storage/customs/special chips, notes, contact name — and, as on other
    plans, phone/email/channel.
  - Access types are added to the lead detail list (they exist on the model
    but are not displayed today); shown for all plans.
- Unlock on pay per seen is a real network call (other plans keep today's
  client-only behaviour):
  - `POST /api/partners/unlock` `{ leadId }` — authenticated via
    `signedInPartner()` like `/api/partners/lanes`. The server regenerates
    the deterministic board, computes the authoritative fee, and records the
    unlock. Repeat unlocks are idempotent (409/no-op → still revealed).
  - `GET /api/partners/unlock` returns the signed-in partner's unlocks; the
    dashboard seeds its unlocked set from it on mount, so pay-per-seen
    unlocks survive a refresh.
- **Email (simulated):** the unlock record stores
  `emailTo = demo partner email`, `emailStatus: "sent"`. The success toast
  says the lead is unlocked and a confirmation email was sent.
- **Billing panel:** driven by the plan id; on pay per seen, "billed this
  cycle" sums the server-recorded unlock fees; each unlock counts as a lead
  consumed in the partner's name.

## 3. Unlock store + admin visibility

- New `src/lib/unlock-store.ts`, following `lane-store.ts`: in-memory Map
  singleton (globalThis-stashed in dev), capacity-capped, keyed
  `partnerId:leadId`. Record:
  `{ id, partnerId, partnerName, companyId, leadId, routeLabel, volumeM3,
     feeUsd, plan, unlockedAt, emailTo, emailStatus }` — a snapshot, so the
  admin never has to re-derive lead data (the admin dataset and the partner
  board intentionally share no ids).
- `GET /api/admin/unlocks` lists all records (admin has no auth today;
  consistent).
- New admin page **Unlocks** (nav entry + route + `UnlocksView`): a live
  table — partner, lead (route + m³), fee, time, email status — fetched from
  the API with a refresh affordance, plus an empty state explaining that
  rows appear when a pay-per-seen partner clicks Unlock. Admin seed data is
  untouched.

## 4. Localization everywhere

- **Admin locale comes from the cookie, not the URL** *(amended during
  implementation)*: the admin keeps its own root layout at `/admin` — nesting
  it under `[locale]` would leak the public site's `LastCallBar` and skip-link
  into the admin chrome and change every `/admin` URL for no user-visible
  gain. Instead `src/app/admin/layout.tsx` reads the same `rotamove.locale`
  cookie the public switcher writes (`resolveLocale` fallback to English),
  renders `<html lang={locale} dir={dirFor(locale)}>` with the
  script-matched font, and feeds `getDictionary(locale)` into the provider.
  The proxy matcher still excludes `/admin`.
- A cookie-writing `AdminLocaleSwitcher` (`rememberLocale` +
  `router.refresh()`) sits in the admin topbar; switching language on the
  public site also switches the admin, and vice versa — one cookie, one
  preference, every surface.
- **Dictionaries:** add `admin` and `partnerDashboard` sections plus the new
  `plans.pps*` keys to `src/i18n/dictionaries/en.ts`; the `Widen` contract
  forces the same shape onto tr/de/fr/it/nl/ru/ar (translations written as
  part of this work, all 8 locales).
- **De-hardcode:** all 16 files under `src/components/admin` and the 5 files
  under `src/components/partners/dashboard` read strings from the
  dictionary. `lead-row.tsx` stops importing the English dictionary
  directly. Label metadata maps in `src/lib/admin/labels.ts` keep
  colour/icon but take their text from the dictionary (label text moves to
  dict keys by status id).
- **Formatters:** dashboard/admin call sites move from the locale-less
  `src/lib/format.ts` helpers to the provider's locale-aware `t.*`
  formatters for user-visible dates, relative times and numbers.
- Page `metadata` for admin and the partner dashboard becomes
  locale-resolved via `generateMetadata`.

## Error handling

- Unlock API: 401 unauthenticated, 404 unknown lead id, zod 422 on bad
  payload; client shows `toast.error` with the server message and does NOT
  reveal the lead. Duplicate unlock returns the existing record (200) so a
  double-click never double-charges.
- Admin unlocks view: fetch failure shows an inline error with retry;
  empty list is a designed empty state, not an error.

## Testing

- `npm run build` and `npm run lint` must pass (the Widen type check makes
  dictionary drift a compile error).
- Manual drive via browser: switch plan to Pay per seen → board masks; click
  Unlock → toast + reveal + survives refresh; admin Unlocks page shows the
  row; switch language on the public site, the partner dashboard and the
  admin — all copy follows; `/admin` still reachable (redirects to
  `/{locale}/admin`).

## Out of scope

- Real email delivery, real payments, admin authentication, a database.
- Localizing the seeded demo *data* (company names, sample notes) — data
  stays as-is; UI chrome is what localizes.
