# Rotamove

Find a mover for anywhere between Türkiye, Europe, the Balkans, Scandinavia,
the CIS, Central Asia and the Middle East.

One search box in, a board of verified movers out. No prices — you pick who gets
in touch, and on which channel.

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

**Four short steps.** Home size, date, how much help, contact. Minimal copy, one
question per screen.

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

## Routes

| Route | What it is |
|---|---|
| `/` | Hero, one search box, three steps, coverage, FAQ |
| `/quote` | Four-step enquiry, route pre-filled from the search |
| `/results/[leadId]` | Streaming mover board with contact selectors |
| `/coverage` | Region explorer and the full corridor table |
| `/how-it-works` | Ranking weights and the verification checklist |
| `/partners` | Two plans, plan chooser, lead-fee explainer |
| `/partners/dashboard` | Interactive partner demo, both plans |
| `/movers/[slug]` | Partner profile (28 prerendered) |
| `POST /api/leads` | Validated intake → `{ id, token, expectedMatches }` |
| `POST /api/search` | NDJSON stream of price-free matches |
| `GET /api/movers` | Public partner directory |

---

## Design

One colour, one typeface, no patterned backgrounds.

- **`#FFEA5C`** on warm paper white. Yellow carries the actions; near-black
  (`#15150F`) carries the words. Dark mode is a first-class theme.
- **Instrument Sans** everywhere — quiet at body size, elegant set large and
  tight. A second family would be decoration, not information.
- The only decorative background in the system is a soft brand wash behind the
  fold (`.glow-brand`). No grids, no noise, no texture.
- Generous air, large radii, pill buttons.

Motion is used where it carries meaning: chips springing into the search box,
cards sliding in as they arrive, the channel selector's sliding highlight, the
request-sent confirmation. Everything respects `prefers-reduced-motion`.

---

## Architecture

```
src/
  app/                      routes + API handlers
  components/
    search/route-search     the single search box
    quote/                  wizard, steps, route editor, city picker
    results/                search HUD, mover card, filters, stream hook
    partners/               plans, plan chooser, lead-fee explainer, dashboard
    marketing/              hero, sections, coverage grid
    site/                   header, footer, logo, theme
    ui/                     shadcn primitives
  lib/
    geo.ts                  53 countries, 89 hub cities, 19 corridors
    pricing.ts              internal cost model (server-only)
    matching.ts             eligibility, ranking, filters, sorting
    movers.ts               28-partner seed directory
    plans.ts                subscription tiers, lead-fee formula
    lead-schema.ts          one zod schema: wizard + API
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
