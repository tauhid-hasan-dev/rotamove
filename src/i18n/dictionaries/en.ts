import type { Plural } from "@/i18n/plural";

/**
 * English dictionary — the source of truth for the dictionary *shape*.
 *
 * `Dictionary` is derived from this object with every string widened, so the
 * seven translations must carry exactly these keys or the build fails. Adding
 * a key here is a deliberate act: seven files light up red until it is
 * translated.
 *
 * Counted nouns are `Plural` form sets rather than `${n} thing(s)` templates —
 * see i18n/plural.ts for why.
 */
export const en = {
  /* ------------------------------------------------------------ units -- */
  units: {
    days: { one: "{n} day", other: "{n} days" } as Plural,
    weeks: { one: "{n} week", other: "{n} weeks" } as Plural,
    monthsAgo: { one: "{n} month ago", other: "{n} months ago" } as Plural,
    movers: { one: "{n} carrier", other: "{n} carriers" } as Plural,
    countries: { one: "{n} country", other: "{n} countries" } as Plural,
    cities: { one: "{n} city", other: "{n} cities" } as Plural,
    boxes: { one: "{n} box", other: "{n} boxes" } as Plural,
    attempts: { one: "{n} attempt", other: "{n} attempts" } as Plural,
    minutesShort: "{n} min",
    hoursShort: "{n} h",
    daysShort: "{n} d",
    perMonth: "{n}/mo",
    cubicMetres: "{n} m³",
    none: "None",
  },

  /* ----------------------------------------------------------- common -- */
  common: {
    skipToContent: "Skip to content",
    search: "Search",
    continue: "Continue",
    back: "Back",
    change: "Change",
    edit: "Edit",
    reset: "Reset",
    undo: "Undo",
    tryAgain: "Try again",
    optional: "(optional)",
    any: "Any",
    free: "Free · no account · no cold calls",
    appearance: "Appearance",
    toggleTheme: "Toggle light and dark mode",
    openMenu: "Open menu",
    startSearch: "Start a search",
    newSearch: "New search",
    startAgain: "Start again",
    searchAnyRoute: "Search any route",
    allCorridors: "All corridors",
    browseCorridors: "Browse corridors",
    partnerLogin: "Partner login",
    ratingLabel: "{rating} out of 5",
    ratingLabelWithCount: "{rating} out of 5 from {count} reviews",
    verifiedBooking: "verified booking",
  },

  language: {
    label: "Language",
    choose: "Choose a language",
  },

  /* -------------------------------------------------------------- nav -- */
  nav: {
    howItWorks: "How it works",
    coverage: "Coverage",
    forMovers: "For carriers",
    main: "Main",
    mobile: "Mobile",
    home: "Rotamove home",
  },

  /* ----------------------------------------------------------- footer -- */
  footer: {
    blurb:
      "Verified carriers across Türkiye, Europe, the Balkans, Scandinavia, the CIS, Central Asia and the Middle East.",
    move: "Transport",
    movers: "Carriers",
    company: "Company",
    partnerPricing: "Partner pricing",
    dashboardDemo: "Dashboard demo",
    partnerFaq: "Partner FAQ",
    about: "About",
    trust: "Trust & verification",
    contact: "Contact",
    rights: "Rotamove · Demo product",
    privacy: "KVKK & GDPR",
    terms: "Terms",
    offices: "Istanbul · Berlin · Tashkent",
  },

  /* ------------------------------------------------------------- hero -- */
  hero: {
    eyebrow: "Türkiye · Europe · Central Asia · Gulf",
    title: "Find the Right Carrier for Every Load.",
    subtitle:
      "From home moves to commercial freight, find the right transport provider for every load.",
  },

  /** The illustrated journey under the search box. */
  scene: {
    alt: "A lorry and two vans travelling from a collection point to a delivery point.",
    origin: "Collection",
    originHint: "Anywhere you load",
    destination: "Delivery",
    destinationHint: "Anywhere you unload",
    inTransit: "Door to door",
  },

  /* ------------------------------------------------------ trust strip -- */
  trust: {
    label: "Accredited partners only",
  },

  /* ----------------------------------------------------- how it works -- */
  how: {
    title: "Three steps. No phone tag.",
    steps: [
      { title: "Search", body: "One box. Where from, where to." },
      { title: "Match", body: "We find carriers who actually run your route." },
      { title: "Move", body: "Pick WhatsApp, a call or email. They reach out." },
    ],
  },

  /* ----------------------------------------------------- testimonials -- */
  testimonials: {
    title: "24,800 loads moved, and counting.",
    items: [
      {
        quote:
          "Four carriers messaged me on WhatsApp the same afternoon. I picked one by evening.",
        name: "Aylin K.",
        route: "Istanbul → Berlin",
      },
      {
        quote: "They found operators who genuinely run the Caspian crossing. Nobody else could.",
        name: "Rustam A.",
        route: "Tashkent → Istanbul",
      },
      {
        quote: "No forms, no spam. One search and the right people got in touch.",
        name: "Jonas R.",
        route: "Stockholm → Izmir",
      },
    ],
  },

  /* --------------------------------------------------- partner teaser -- */
  partnerTeaser: {
    eyebrow: "For transport companies",
    title: "Buy demand, not phone numbers.",
    body: "Flat monthly, or pay per lead with a hard ceiling. Nothing else.",
    pricingCta: "Partner pricing",
    demoCta: "See the demo",
    proBody: "Every lead, unlimited. Instant placement in search.",
    proUnit: "/ month",
    pplBody: "No subscription. Never more than {cap}.",
    pplUnit: "/ lead",
  },

  /* -------------------------------------------------------------- faq -- */
  faq: {
    title: "Questions",
    items: [
      {
        q: "Is it free?",
        a: "Yes, always. Carriers pay us a flat monthly fee or a small capped fee per lead — never a commission on your load, so no one can pay for a better position.",
      },
      {
        q: "Will I get spam calls?",
        a: "No. You choose the channel — WhatsApp, a call or email — and your details only go to the carriers you pick.",
      },
      {
        q: "Which routes do you cover?",
        a: "Türkiye to and from Europe, the Balkans, Scandinavia, the CIS and Caucasus, Central Asia and the Middle East — plus domestic transport in all 53 partner countries.",
      },
      {
        q: "How are carriers verified?",
        a: "Transport licence, insurance, claims history and a real depot, re-checked every year. Fail and you leave the network.",
      },
      {
        q: "How fast do they reply?",
        a: "Instant-match partners typically respond within fifteen minutes. The rest come back the same day.",
      },
    ],
  },

  /* --------------------------------------------------------- cta band -- */
  ctaBand: {
    title: "What are you moving?",
  },

  /* --------------------------------------------------------- coverage -- */
  coverageGrid: {
    title: "Built for the routes nobody else runs properly.",
    regions: "Regions",
  },

  coveragePage: {
    eyebrow: "Network",
    title: "Türkiye brings Europe, Asia, and the Middle East closer together",
    lede: "{corridors} corridors, run weekly by partners who actually drive them.",
    statCountries: "Countries",
    statCities: "Hub cities",
    statCorridors: "Live corridors",
    statLeads: "Enquiries / month",
    tableEyebrow: "Every lane",
    tableTitle: "The full corridor table.",
    tableLede: "Door-to-door medians, measured across completed loads.",
    thCorridor: "Corridor",
    thFrom: "From",
    thTo: "To",
    thTransit: "Transit",
    thModes: "Modes",
    thPartners: "Partners",
    thDemand: "Demand",
    notListed:
      "Route not on the list? The extended network covers another 90-odd country pairs through partner handovers.",
  },

  /* ----------------------------------------------------- how it works -- */
  howItWorksPage: {
    title: "A marketplace only works if you can see how it decides.",
    lede: "So here is the ranking, and the checklist every carrier has to pass.",
    steps: [
      { title: "Search", body: "One box: where from, where to." },
      { title: "Match", body: "We poll the network. Takes about eight seconds." },
      { title: "Move", body: "Choose the channel. Only your picks get in touch." },
    ],
    rankingTitle: "Five inputs. Published weights.",
    rankingBody:
      "No carrier can pay for a better position. Our fee is identical whoever you choose.",
    ranking: {
      routeFit: "Route fit",
      reviewScore: "Review score",
      onTime: "On-time record",
      transit: "Transit speed",
      response: "Response time",
    },
    checksTitle: "What all {count} partners had to prove.",
    checks: [
      {
        title: "Licence",
        body: "Transport licence and registration, checked against the national register.",
      },
      { title: "Insurance", body: "Valid CMR and all-risk transit cover." },
      {
        title: "Claims history",
        body: "Tracked continuously. Above threshold and you leave the board.",
      },
      { title: "Real operation", body: "A depot, a fleet, named staff. No brokers." },
    ],
    aboutTitle: "Why corridors, not countries.",
    aboutBody1:
      "Moving freight between Türkiye and Europe is one of the densest flows in the world, and almost none of it is searchable. The lanes into the CIS, Central Asia and the Gulf are worse — a handful of operators really run them.",
    aboutBody2:
      "Rotamove picks a small number of corridors and goes deep. Fewer routes, real partners, verified every year.",
  },

  /* --------------------------------------------------------- partners -- */
  partnersPage: {
    eyebrow: "For transport companies",
    title: "Buy demand, not phone numbers.",
    lede: "{leads} verified enquiries a month across {corridors} corridors. Two ways to buy them.",
    plansNote:
      "Both plans include licence and insurance verification, dispute mediation, and removal from the board if standards slip.",
    chooserTitle: "Which one fits you?",
    feeTitle: "Never more than {cap}. Whatever the load.",
    whyItems: [
      { title: "Your lanes only", body: "Filter by corridor, volume and date." },
      { title: "Ready to move", body: "Route, dates and volume already answered." },
      { title: "Verified contacts", body: "Validated at intake. Scored 0–100." },
      { title: "Win-rate reporting", body: "See why you lost, by corridor." },
      { title: "API & webhooks", body: "Leads land straight in your TMS." },
      { title: "No commission", body: "We never take a cut of the job." },
    ],
    faqTitle: "Partner FAQ",
    ctaTitle: "Start free. Upgrade when it pays.",
    ctaBody: "Verification takes about two working days.",
    ctaButton: "Open the demo dashboard",
    ctaNote: "{pro}/month unlimited · or {cap} max per lead",
  },

  plans: {
    mostChosen: "Most chosen",
    proName: "Pro Unlimited",
    proSuffix: "/month",
    proNote: "Billed monthly in USD. Cancel any time, no notice period.",
    proCta: "Start 14-day free trial",
    proFeatures: [
      "Unlimited international leads",
      "Unlimited domestic leads",
      "Instant-match placement in search",
      "One-tap contact from the results board",
      "Full customer contact details, unmasked",
      "Capacity & seasonality rules engine",
      "Corridor demand analytics & win-rate reporting",
      "Lead API and webhooks",
      "Priority dispute handling",
      "Up to 8 operator seats",
    ],
    pplName: "Pay Per Lead",
    pplSuffix: "/lead",
    pplNote: "Hard cap of {cap} per lead. You see the exact price before you unlock.",
    pplCta: "Create free partner account",
    pplFeatures: [
      "No monthly fee, no minimum spend",
      "Browse the full lead board",
      "Unlock a lead to reveal contact details",
      "Refund within 24 h on invalid contact details",
      "Corridor and volume filters",
      "Instant-match placement in search",
      "One-tap contact from the results board",
      "Lead API and webhooks",
      "Corridor demand analytics",
      "1 operator seat",
    ],
    faq: [
      {
        q: "What exactly counts as a lead?",
        a: "A completed enquiry with a verified route, date, volume and reachable contact details. Enquiries that fail our validation never reach the board, and you are never charged for them.",
      },
      {
        q: "Is Pro Unlimited really unlimited?",
        a: "Yes. {pro} a month covers every international and domestic lead on every corridor, with no cap and no overage. The only limit is your own capacity settings.",
      },
      {
        q: "Why would I pay per lead instead?",
        a: "If you close fewer than {breakEven} leads a month, pay-per-lead is cheaper. Most partners start there and switch to Pro inside two months.",
      },
      {
        q: "Can a lead cost more than the cap?",
        a: "Never. {cap} is a hard ceiling regardless of corridor, volume or job value, and the exact price is shown before you unlock.",
      },
      {
        q: "Do pay-per-lead partners appear in search results?",
        a: "You appear on the results board, but marked as replying later rather than instantly. Instant-match placement is a Pro Unlimited feature.",
      },
      {
        q: "What if the contact details are wrong?",
        a: "Report it within 24 hours and the lead credit is refunded automatically. Pro partners are unaffected since there is no per-lead charge.",
      },
    ],
  },

  planChooser: {
    label: "Leads you'd take per month",
    ariaLeads: "Leads per month",
    proNote: "flat, any volume",
    pplNote: "≈ {fee} each · capped at {cap}",
    cheaperFor: "{plan} is cheaper for you",
    proWins: "by {saving} a month — and only Pro puts you in instant search results.",
    pplWins: "by {saving} a month. Pro wins from {breakEven} leads.",
    proCta: "Start Pro trial",
    pplCta: "Create free account",
  },

  leadFee: {
    eyebrow: "What a lead costs",
    body: "Pay-per-lead pricing follows expected job value, not a flat tariff — and it stops dead at {cap}. Change the job below and watch the fee move.",
    destination: "Destination from Istanbul",
    volume: "Load volume",
    daysOut: "Days until collection",
    fullService: "Full service",
    fullServiceHint: "Packing and unpacking included",
    storage: "Storage needed",
    storageHint: "4 weeks bonded",
    youPay: "You would pay",
    once: "once",
    floor: "{amount} floor",
    cap: "{amount} cap",
    atCap: "This job is worth far more than {cap} to whoever wins it — the cap holds anyway.",
    quality: "Lead quality score",
    qualityValue: "{score} / 100",
    moveType: "Load type",
    refundWindow: "Refund window",
    refundValue: "24 hours",
    costOnPro: "Cost on Pro Unlimited",
    costOnProValue: "{amount} — included",
    footnote:
      "Pro Unlimited partners pay nothing per lead, whatever this number says. That is the whole trade-off: {pro} a month buys the right to stop thinking about it.",
  },

  /* ----------------------------------------------------------- search -- */
  search: {
    fromLabel: "From",
    toLabel: "To",
    fromPlaceholder: "Where from?",
    toPlaceholder: "Where to?",
    swap: "Swap origin and destination",
    popular: "Popular",
    noMatch: "No match for “{query}”",
  },

  /* ------------------------------------------------------------ quote -- */
  dates: {
    label: "When",
    placeholder: "Add dates",
    hint: "Optional — pick a collection window",
    clear: "Clear",
    done: "Done",
    flexibleBy: "Collection window · {days}",
    previousMonth: "Previous month",
    nextMonth: "Next month",
  },

  lastCall: {
    badge: "Last call",
    body: "{count} have space to collect within 24 hours.",
    cta: "Find them",
    dismiss: "Dismiss",
  },

  quote: {
    steps: {
      home: "Load",
      services: "Help",
      contact: "Contact",
    },
    headings: {
      home: "What are we moving?",
      services: "How much help?",
      contact: "Where should they reach you?",
    },
    swapDirection: "Swap direction",
    fineTuneVolume: "Fine-tune the volume",
    volumeAria: "Volume in cubic metres",
    approxBoxes: "≈ {boxes}",
    accessPickup: "Access at collection",
    accessDelivery: "Access at delivery",
    parkAtDoor: "Lorry can park at the door",
    moveDate: "Collection date",
    howFlexible: "How flexible?",
    peakSeason:
      "June to September is peak season. Shifting a fortnight either way opens up a lot more capacity.",
    addOns: "Add-ons",
    storageLegend: "Storage",
    storageAria: "Weeks of storage",
    specialistLegend: "Anything specialist?",
    preferredChannel: "Preferred channel",
    name: "Name",
    namePlaceholder: "Elif Yılmaz",
    email: "Email",
    emailPlaceholder: "you@example.com",
    phone: "Phone",
    phonePlaceholder: "+90 532 000 00 00",
    notes: "Anything else?",
    notesPlaceholder: "Narrow street, no lift at the destination…",
    consent: "Share my enquiry with matching carriers. Your details never go anywhere else.",
    matching: "Matching…",
    findMovers: "Find my carriers",
    moversMatch: "{count} match",
    sendFailed: "Could not send your enquiry",
    somethingWrong: "Something went wrong",
    matchCount: {
      legend: "How many carriers should we contact?",
      hint: "Only the carriers you pick receive your enquiry.",
      two: "2 carriers",
      twoHint: "The two strongest matches",
      five: "5 carriers",
      fiveHint: "A balanced shortlist",
      all: "All carriers",
      allHint: "Every match on your route",
      recommended: "Recommended",
    },
    extras: {
      packing: "Packing",
      unpacking: "Unpacking",
      dismantling: "Dismantle & rebuild furniture",
      insurance: "Transit insurance",
      customsClearance: "Customs handled for me",
      cleaning: "End-of-tenancy cleaning",
    },
  },

  /* ----------------------------------------------------- verification -- */
  verify: {
    verifyAction: "Verify",
    verified: "Verified",
    sending: "Sending…",
    checking: "Checking…",
    codeSentEmail: "We sent a 6-digit code to {target}.",
    codeSentPhone: "We sent a 6-digit code by SMS to {target}.",
    codeLabel: "Verification code",
    digitLabel: "Digit {n}",
    demoHint: "Demo code: {code}",
    resend: "Resend code",
    resendIn: "Resend in {seconds}s",
    wrongCode: "That code doesn't match. {attempts} left.",
    locked: "Too many attempts. Request a new code.",
    emailNeedsVerifying: "Verify your email to continue",
    phoneNeedsVerifying: "Verify your phone to continue",
    demoNote: "Verification is simulated in this demo — no email or SMS is actually sent.",
  },

  /* ---------------------------------------------------------- results -- */
  results: {
    expiredTitle: "That search has expired",
    expiredBody: "Links stay live for 30 days. Start again and we'll rematch in seconds.",
    unreadableTitle: "We couldn't read that search",
    unreadableBody: "Start again and we'll rebuild your matches in a few seconds.",
    noFiltersTitle: "Nothing matches those filters",
    noFiltersBody: "Clear a requirement — there are still carriers on this route.",
    clearFilters: "Clear filters",
    sortAria: "Sort",
    filtersTitle: "Filters",
    networkError: "We could not reach the partner network.",
    searchFailed: "Search failed",
    openingSearch: "Opening your search",
    oneMoment: "One moment",
    canTakeThis: "carriers can take this",
    matchedIn: "Matched in {seconds}s · they will be in touch",
    complete: "Request sent",
    rankingNote:
      "Ranked independently. Carriers pay us a flat fee or a small capped fee per lead — never a commission — so nobody can buy a higher position.",
    sort: {
      best: "Best match",
    },
    /** Keyed by the stage ids the NDJSON stream emits. */
    stages: {
      secure: { label: "Securing your enquiry", detail: "Encrypted and verified" },
      corridor: {
        label: "Opening corridor {from} → {to}",
        detailCore: "{corridor} · {days} typical",
        detailExtended: "Extended network routing via {corridor}",
      },
      partners: {
        label: "Polling {count} partner carriers",
        detail: "{from} and {to} licensed operators",
      },
      capacity: {
        label: "Confirming vehicle capacity",
        detail: "Checking crews free around {date}",
      },
      route: {
        label: "Checking route capacity",
        detail: "Ferry slots, border crossings and crews",
      },
      ranking: {
        label: "Ranking your matches",
        detail: "Coverage, speed, reliability and reviews",
      },
    },
  },

  filters: {
    searching: "Searching…",
    ofTotal: "{shown} of {total}",
    instantOnly: "Instant match only",
    mode: "Mode",
    rating: "Rating",
    mustOffer: "Must offer",
    ratingPlus: "{rating}+",
    services: {
      packing: "Packing",
      storage: "Storage",
      customs: "Customs",
      vehicle: "Vehicles",
      piano: "Piano",
      cleaning: "Cleaning",
    },
  },

  moverCard: {
    bestMatch: "Best match",
    fastest: "Fastest",
    instantMatch: "Instant match",
    since: "since {year}",
    transit: "Transit",
    collection: "Collection",
    delivery: "Delivery",
    onTime: "{pct} on time",
    repliesIn: "Replies in {time}",
    co2: "{amount} kg CO₂e",
    requestSent: "Request sent",
    willReply: "{promise} within {time}.",
    manualPickup: "Picks up enquiries manually — usually replies the same day.",
    channels: {
      whatsapp: {
        label: "WhatsApp",
        done: "They'll message you on WhatsApp",
      },
      phone: { label: "Call", done: "They'll call you" },
      email: { label: "Email", done: "They'll email you" },
    },
  },

  moverProfile: {
    notFound: "Carrier not found",
    metaTitle: "{name} — reviews and corridors",
    established: "Established {year}",
    completedMoves: "{count} completed loads",
    instantMatch: "Instant match",
    sameDay: "Replies the same day",
    instantBody: "Confirms availability as soon as your search runs.",
    manualBody: "Picks up enquiries by hand, then gets in touch.",
    repliesIn: "replies in {time}",
    blurbNote: "Partner description shown as provided.",
    statOnTime: "On-time delivery",
    statClaims: "Claim rate",
    statTrucks: "Own lorries",
    statCrew: "Crew",
    statCover: "Cover",
    statCoverValue: "Full replacement value",
    statCancellation: "Free cancellation",
    corridorsTitle: "Corridors they run",
    corridorTypical: "{days} typical",
    extendedNetwork: "Covers {regions} through the extended network.",
    reviewsTitle: "Reviews",
    servicesTitle: "Services",
    languagesTitle: "Languages & regions",
    billingTitle: "How this partner is billed",
    billingPro:
      "{name} is on Pro Unlimited — a flat {pro} a month for every lead on the network. They pay the same whether you choose them or not.",
    billingPpl:
      "{name} is on Pay Per Lead — they pay up to {cap} to unlock an enquiry they want. No commission either way.",
    services: {
      packing: "Professional packing",
      storage: "Bonded storage",
      customs: "In-house customs brokerage",
      vehicle: "Car & motorbike shipping",
      piano: "Piano and fine-art handling",
      cleaning: "End-of-tenancy cleaning",
    },
  },

  login: {
    title: "Partner sign in",
    lede: "Manage your lead board, unlock enquiries and track your plan.",
    email: "Work email",
    password: "Password",
    submit: "Sign in",
    signingIn: "Signing in…",
    demoTitle: "Demo account",
    demoBody: "This is a demo — these are the only credentials that work.",
    demoFill: "Use demo credentials",
    error: "Those credentials don't match the demo account.",
    notPartner: "Not a partner yet?",
    seePlans: "See partner plans",
    signOut: "Sign out",
  },

  notFound: {
    eyebrow: "404 · no such route",
    title: "This corridor isn't on the board.",
    body: "The page has moved, or never existed.",
  },

  /* ------------------------------------------------------------ enums -- */
  enums: {
    propertySize: {
      few_items: { label: "A few items", hint: "Boxes, a bed, no furniture set" },
      studio: { label: "Studio / 1+0", hint: "~45 m² home" },
      one_bed: { label: "1 bedroom / 1+1", hint: "~65 m² home" },
      two_bed: { label: "2 bedrooms / 2+1", hint: "~95 m² home" },
      three_bed: { label: "3 bedrooms / 3+1", hint: "~130 m² home" },
      four_bed: { label: "4+ bedrooms", hint: "~170 m² home" },
      villa: { label: "Villa / detached", hint: "220 m² and up" },
      office: { label: "Office / commercial freight", hint: "Desks, IT, archive, pallets" },
    },
    access: {
      ground: { label: "Ground floor", hint: "No stairs at all" },
      lift: { label: "Lift available", hint: "Goods lift or passenger lift" },
      stairs_1_2: { label: "Stairs, 1–2 floors", hint: "No lift" },
      stairs_3_plus: { label: "Stairs, 3+ floors", hint: "No lift, high floor" },
    },
    flexibility: {
      exact: "That exact date",
      plus_minus_3: "Within 3 days",
      within_2_weeks: "Within 2 weeks",
      flexible: "Fully flexible",
    },
    serviceLevel: {
      full_service: { label: "Full service", hint: "They pack, load, ship and unpack." },
      door_to_door: { label: "Door to door", hint: "You pack boxes, they do the rest." },
      transport_only: { label: "Transport only", hint: "Everything is ready to collect." },
    },
    specialItems: {
      piano: "Piano",
      vehicle: "Car or motorbike",
      artwork: "Art or antiques",
      safe: "Safe over 100 kg",
      gym: "Gym equipment",
      plants: "Large plants",
    },
    moveType: {
      international: "International",
      domestic: "Domestic",
    },
    modes: {
      road: { label: "Road", hint: "Door-to-door lorry, no transhipment" },
      sea: { label: "Sea", hint: "LCL container — cheapest for long hauls" },
      air: { label: "Air", hint: "Fastest, best for small consignments" },
      rail: { label: "Rail", hint: "Block train — low emission, fixed schedule" },
    },
    badges: {
      instant_quote: {
        label: "Instant match",
        hint: "Pro Unlimited partner — confirms availability straight away.",
      },
      top_rated: { label: "Top rated", hint: "4.6+ rating across 500 or more verified reviews." },
      fast_responder: { label: "Fast responder", hint: "Median first reply under 20 minutes." },
      best_value: { label: "Best value", hint: "Consistently prices below the corridor median." },
      eco_fleet: { label: "Low emission", hint: "HVO, electric or rail-first routings." },
      customs_expert: { label: "Customs expert", hint: "In-house brokerage on this corridor." },
      fragile_specialist: {
        label: "Fragile specialist",
        hint: "Custom crating for art, antiques and instruments.",
      },
    },
    regions: {
      TR: "Türkiye",
      EU_WEST: "Western Europe",
      EU_SOUTH: "Southern Europe",
      BALKANS: "Balkans",
      NORDICS: "Scandinavia & Nordics",
      CIS: "CIS & Caucasus",
      CENTRAL_ASIA: "Central Asia",
      MIDDLE_EAST: "Middle East",
    },
    corridors: {
      "tr-eu-west": "Türkiye → Germany, Benelux & France",
      "eu-west-tr": "Western Europe → Türkiye",
      "tr-eu-south": "Türkiye → Italy, Spain & Greece",
      "eu-south-tr": "Southern Europe → Türkiye",
      "tr-nordics": "Türkiye → Scandinavia",
      "nordics-tr": "Scandinavia → Türkiye",
      "tr-balkans": "Türkiye → Balkans",
      "balkans-tr": "Balkans → Türkiye",
      "tr-middle-east": "Türkiye → Gulf & Levant",
      "middle-east-tr": "Middle East → Türkiye",
      "tr-cis": "Türkiye → Russia & Caucasus",
      "cis-tr": "Russia & Caucasus → Türkiye",
      "tr-central-asia": "Türkiye → Central Asia",
      "central-asia-tr": "Central Asia → Türkiye",
      "eu-central-asia": "Europe → Central Asia (via Middle Corridor)",
      "central-asia-eu": "Central Asia → Europe",
      "me-eu": "Gulf → Europe",
      "eu-me": "Europe → Gulf",
      "tr-domestic": "Domestic Türkiye",
    },
    /** Patterns for lanes outside the sold corridor set. */
    corridorFallback: {
      domestic: "Domestic {region}",
      extended: "{from} → {to}",
    },
  },

  /* --------------------------------------------------------- metadata -- */
  meta: {
    titleDefault: "Rotamove — find the right carrier for every load",
    titleTemplate: "%s · Rotamove",
    description:
      "One search. Verified carriers for home moves and commercial freight across Türkiye, Europe, the Balkans, Scandinavia, the CIS, Central Asia and the Middle East.",
    ogTitle: "Compare verified carriers across 53 countries",
    ogDescription:
      "Tell us where your load is going. We match you with verified transport providers who come to you.",
    keywords: [
      "freight carriers",
      "international movers",
      "Turkey to Europe transport",
      "uluslararası nakliyat",
      "commercial freight quotes",
      "Central Asia logistics",
    ],
    quoteTitle: "Tell us about your load",
    quoteDescription:
      "Tell us about your load once. Verified carriers get in touch on the channel you choose.",
    resultsTitle: "Your carrier matches",
    resultsDescription: "Verified carriers for a {volume} load.",
    coverageTitle: "Corridor coverage — 53 countries, 19 live lanes",
    coverageDescription:
      "Every corridor Rotamove sells: Türkiye to and from Western and Southern Europe, the Balkans, Scandinavia, the CIS, Central Asia and the Middle East.",
    howItWorksTitle: "How it works",
    howItWorksDescription:
      "How Rotamove matches you with carriers, how the ranking is weighted, and what every partner has to prove.",
    partnersTitle: "For carriers — $100/month unlimited, or up to $7 per lead",
    partnersDescription:
      "Join the Rotamove partner network. Unlimited leads for a flat monthly fee, or pay per lead with a hard $7 cap.",
  },
} as const;

export default en;
