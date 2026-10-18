# Rotamove

Find the right carrier for every load, anywhere between Türkiye, Europe, the
Balkans, Scandinavia, the CIS, Central Asia and the Middle East — from home
moves to commercial freight.

One search box in, a board of verified carriers out. No prices — you pick who
gets in touch, and on which channel.

Available in eight languages, defaulting to the visitor's own.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

---

## How it works

**One search box.** The whole route goes into a single field: type a city, it
becomes a chip, the field keeps going for the destination. Backspace removes the
last one. No form, no dropdown pair.

**Four short steps.** Load size, date, how much help, contact. Minimal copy, one
question per screen. Email and phone are confirmed by a one-time code before the
enquiry can be sent.

**A streaming results board.** Matches arrive one at a time over NDJSON while a
single line of text narrates the search. Sort by match, speed, rating or reply
time; filter by mode, rating and services.

**Contact on your terms.** Every mover card has a WhatsApp / Call / Email
selector. Pick one, hit the button, and that mover gets your enquiry — nobody
else does.

### No prices, anywhere

Not in the UI, and not in the payload. The engine still prices every job because
ranking depends on it, but `toPublicQuote()` strips every money field at the API
boundary. Open the network tab on `/api/search` and there is no currency, no
amount, no breakdown.

The only money in the product is partner-side: what movers pay us.

| | Pro Unlimited | Pay Per Lead |
|---|---|---|
| | **$100 / month** | **$2–$7 per lead** (hard cap) |
| International + domestic leads | Unlimited | Pay per unlock |
| Instant-match placement in search | ✅ | ❌ |
| One-tap contact from the board | ✅ | ❌ |
| Lead API & webhooks | ✅ | ❌ |

That split is visible in the product: Pro partners show as **Instant match** and
can be contacted immediately; pay-per-lead partners pick the enquiry up by hand
and reply the same day. Flip between both views on `/partners/dashboard`.

---

## Eight languages

English, Turkish, German, French, Italian, Dutch, Russian and Arabic. Every
public page, not just the front door.

**The visitor's language, by default.** `proxy.ts` resolves a locale before any
route renders, strongest signal first:

```
?lang=tr          explicit, shareable, and the only way to test geo locally
cookie            a choice the visitor made themselves
geo header        country from the edge (Vercel / Cloudflare / Netlify)
Accept-Language   the browser's stated preference, q-weighted
en                fallback
```

Geo sits above `Accept-Language` deliberately: browsing from Türkiye gets you
Turkish. The trade is that a German-browser visitor in Istanbul also gets
Turkish — one click on the switcher fixes it, and the cookie makes it stick.
Swap the two lines in `proxy.ts` to reverse the policy.

**One dictionary shape, enforced by the compiler.** `dictionaries/en.ts` is the
source of truth; `Dictionary` is derived from it with every string widened, so
the other seven are checked structurally. A missing or misspelled key is a build
error naming the file and line — never a blank space in production.

**What is not in the dictionary.** Country names come from `Intl.DisplayNames`
(53 countries × 8 languages the platform already knows, correctly). Counted
nouns are CLDR plural form sets resolved through `Intl.PluralRules` — Russian
needs four forms, Arabic six. Dates, numbers, percentages and date ranges go
through `Intl`. Quotation marks follow each locale's own convention (`„…“`,
`«…»`). Partner-written blurbs and reviews are shown as supplied and labelled
as such, the way any marketplace handles partner copy.

**Arabic is right-to-left for real.** `dir="rtl"`, logical properties
throughout, the mobile drawer opens from the other edge, and the hero convoy
drives the other way. Digits stay Western — Gulf and Levant business
convention, and it keeps tabular figures aligned.

**Three typefaces, one per visitor.** Instrument Sans covers `latin` and
`latin-ext` only, so Russian and Arabic would otherwise fall back to whatever
the OS supplies. Cyrillic gets Inter, Arabic gets IBM Plex Sans Arabic, and only
the active locale's font is loaded.

**Server-rendered narration stays language-free.** The quote stream runs in a
route handler, which has no locale. It emits a stage `id` plus the values the
sentence is built from, and the client assembles the text — so `/api/search`
ships no English prose.

---

## Routes

Every page is locale-prefixed, so each language is separately indexable and a
shared link carries its language with it.

| Route | What it is |
|---|---|
| `/[locale]` | Hero, one search box, the journey band, coverage, FAQ |
| `/[locale]/quote` | Four-step enquiry, route pre-filled from the search |
| `/[locale]/results/[leadId]` | Streaming carrier board with contact selectors |
| `/[locale]/coverage` | Region explorer and the full corridor table |
| `/[locale]/how-it-works` | Ranking weights and the verification checklist |
| `/[locale]/partners` | Two plans, plan chooser, lead-fee explainer |
| `/[locale]/partners/dashboard` | Interactive partner demo (English only — internal tool) |
| `/[locale]/movers/[slug]` | Partner profile (28 partners × 8 locales prerendered) |
| `POST /api/leads` | Validated intake → `{ id, token, expectedMatches }` |
| `POST /api/search` | NDJSON stream of price-free matches |
| `GET /api/movers` | Public partner directory |

---

## Design

One colour, one typeface, no patterned backgrounds.

- **`#9FE870`** on paper white. The green carries the actions; near-black
  (`#10140E`) carries the words. Dark mode is a first-class theme.
- **Instrument Sans** for Latin scripts — quiet at body size, elegant set large
  and tight. Cyrillic and Arabic get a family that actually covers them; that is
  information, not decoration. Never more than one per visitor.
- The only decorative background in the system is a soft brand wash behind the
  fold (`.glow-brand`). No grids, no noise, no texture.
- Generous air, large radii, pill buttons.

Motion is used where it carries meaning: the hero convoy crossing between two
abstract destinations, cards sliding in as they arrive, the channel selector's
sliding highlight, the request-sent confirmation. Everything respects
`prefers-reduced-motion` — the convoy parks along the road rather than
disappearing.

---

## Architecture

```
src/
  proxy.ts                  locale detection and redirect (Next 16 convention)
  app/
    [locale]/               every page; the root layout lives here
    api/                    route handlers, locale-free by design
  components/
    search/route-search     the single search box
    quote/                  wizard, steps, route editor, city picker
    results/                search HUD, mover card, filters, stream hook
    partners/               plans, plan chooser, lead-fee explainer, dashboard
    marketing/              hero, sections, coverage grid
    site/                   header, footer, logo, theme
    ui/                     shadcn primitives
  i18n/
    config.ts               8 locales, RTL set, country → locale map
    dictionaries/           en.ts is the contract; 7 translations checked against it
    provider.tsx            locale + formatters for client components
    format.ts               Intl number, date, range, percent, country
    plural.ts               CLDR plural categories
    geo-labels.ts           translated region and corridor names
    paths.ts                locale-prefixed links and hreflang
  lib/
    geo.ts                  53 countries, 89 hub cities, 19 corridors
    pricing.ts              internal cost model (server-only)
    matching.ts             eligibility, ranking, filters, sorting
    movers.ts               28-partner seed directory
    plans.ts                subscription tiers, lead-fee formula
    lead-schema.ts          one zod schema: wizard + API (verification included)
    lead-codec.ts           PII-free results-URL token
    lead-store.ts           repository interface + in-memory impl
    rand.ts                 seeded PRNG — results must be reproducible
```

**Deterministic results.** Everything "random" derives from
`hash(leadId + moverId)`. Refresh, re-sort or share the link: same order.

**No personal data in the URL.** The results token encodes the move spec only.
Name, email and phone stay server-side.

**Storage behind an interface.** `leadRepository` is a `LeadRepository`; the
demo binds it to an in-memory Map. Swapping in Postgres is one file.

---

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui (Radix) · Motion · Zod

## Demo scope

No payment is taken, no mover is contacted, and the partner directory is seed
data. Validation, streaming, matching, ranking, filtering and the plan logic are
real code.
