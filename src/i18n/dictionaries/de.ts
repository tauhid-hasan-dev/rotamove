import type { Dictionary } from "@/i18n/dictionaries";

/** Deutsch. */
export const de = {
  units: {
    days: { one: "{n} Tag", other: "{n} Tage" },
    weeks: { one: "{n} Woche", other: "{n} Wochen" },
    monthsAgo: { one: "vor {n} Monat", other: "vor {n} Monaten" },
    movers: { one: "{n} Spedition", other: "{n} Speditionen" },
    countries: { one: "{n} Land", other: "{n} Länder" },
    cities: { one: "{n} Stadt", other: "{n} Städte" },
    boxes: { one: "{n} Karton", other: "{n} Kartons" },
    attempts: { one: "{n} Versuch", other: "{n} Versuche" },
    minutesShort: "{n} Min.",
    hoursShort: "{n} Std.",
    daysShort: "{n} T.",
    perMonth: "{n}/Mon.",
    cubicMetres: "{n} m³",
    none: "Keine",
  },

  common: {
    skipToContent: "Zum Inhalt springen",
    search: "Suchen",
    continue: "Weiter",
    back: "Zurück",
    change: "Ändern",
    edit: "Bearbeiten",
    reset: "Zurücksetzen",
    undo: "Rückgängig",
    tryAgain: "Erneut versuchen",
    optional: "(optional)",
    any: "Alle",
    free: "Kostenlos · kein Konto · keine Kaltakquise",
    appearance: "Darstellung",
    toggleTheme: "Zwischen hellem und dunklem Modus wechseln",
    openMenu: "Menü öffnen",
    startSearch: "Suche starten",
    newSearch: "Neue Suche",
    startAgain: "Neu beginnen",
    searchAnyRoute: "Beliebige Route suchen",
    allCorridors: "Alle Korridore",
    browseCorridors: "Korridore ansehen",
    partnerLogin: "Partner-Login",
    ratingLabel: "{rating} von 5",
    ratingLabelWithCount: "{rating} von 5 aus {count} Bewertungen",
    verifiedBooking: "verifizierte Buchung",
  },

  language: {
    label: "Sprache",
    choose: "Sprache wählen",
  },

  nav: {
    howItWorks: "So funktioniert’s",
    coverage: "Abdeckung",
    forMovers: "Für Speditionen",
    main: "Hauptnavigation",
    mobile: "Mobile Navigation",
    home: "Rotamove Startseite",
  },

  footer: {
    blurb:
      "Geprüfte Speditionen in der Türkei, Europa, auf dem Balkan, in Skandinavien, der GUS, Zentralasien und im Nahen Osten.",
    move: "Transport",
    movers: "Speditionen",
    company: "Unternehmen",
    partnerPricing: "Partner-Preise",
    dashboardDemo: "Dashboard-Demo",
    partnerFaq: "Partner-FAQ",
    about: "Über uns",
    trust: "Vertrauen & Prüfung",
    contact: "Kontakt",
    rights: "Rotamove · Demo-Produkt",
    privacy: "KVKK & DSGVO",
    terms: "AGB",
    offices: "Istanbul · Berlin · Taschkent",
  },

  hero: {
    eyebrow: "Türkei · Europa · Zentralasien · Golfregion",
    title: "Die passende Spedition für jede Ladung.",
    subtitle:
      "Von der Wohnungsauflösung bis zur gewerblichen Fracht: Finden Sie für jede Ladung den richtigen Transportdienstleister.",
  },

  scene: {
    alt: "Ein Lkw und zwei Transporter fahren von der Ladestelle zur Entladestelle.",
    origin: "Abholung",
    originHint: "Überall, wo Sie laden",
    destination: "Zustellung",
    destinationHint: "Überall, wo Sie entladen",
    inTransit: "Von Tür zu Tür",
  },

  trust: {
    label: "Nur akkreditierte Partner",
  },

  how: {
    title: "Drei Schritte. Kein Telefon-Pingpong.",
    steps: [
      { title: "Suchen", body: "Ein Feld. Von wo, nach wo." },
      { title: "Matchen", body: "Wir finden Speditionen, die Ihre Route wirklich fahren." },
      { title: "Transportieren", body: "WhatsApp, Anruf oder E-Mail — sie melden sich bei Ihnen." },
    ],
  },

  testimonials: {
    title: "24.800 transportierte Ladungen, und es werden mehr.",
    items: [
      {
        quote:
          "Vier Speditionen haben mir noch am selben Nachmittag auf WhatsApp geschrieben. Abends hatte ich mich entschieden.",
        name: "Aylin K.",
        route: "Istanbul → Berlin",
      },
      {
        quote:
          "Sie haben Unternehmen gefunden, die die Kaspi-Querung tatsächlich fahren. Sonst konnte das niemand.",
        name: "Rustam A.",
        route: "Taschkent → Istanbul",
      },
      {
        quote: "Keine Formulare, kein Spam. Eine Suche, und die richtigen Leute haben sich gemeldet.",
        name: "Jonas R.",
        route: "Stockholm → Izmir",
      },
    ],
  },

  partnerTeaser: {
    eyebrow: "Für Transportunternehmen",
    title: "Kaufen Sie Nachfrage, nicht Telefonnummern.",
    body: "Monatspauschale oder Zahlung pro Anfrage mit harter Obergrenze. Nichts weiter.",
    pricingCta: "Partner-Preise",
    demoCta: "Demo ansehen",
    proBody: "Alle Anfragen, unbegrenzt. Sofortplatzierung in der Suche.",
    proUnit: "/ Monat",
    pplBody: "Kein Abo. Niemals mehr als {cap}.",
    pplUnit: "/ Anfrage",
  },

  faq: {
    title: "Fragen",
    items: [
      {
        q: "Ist es kostenlos?",
        a: "Ja, immer. Speditionen zahlen uns eine monatliche Pauschale oder eine kleine, gedeckelte Gebühr pro Anfrage — niemals eine Provision auf Ihre Ladung. Niemand kann sich also eine bessere Position kaufen.",
      },
      {
        q: "Bekomme ich Werbeanrufe?",
        a: "Nein. Sie wählen den Kanal — WhatsApp, Anruf oder E-Mail — und Ihre Daten gehen ausschließlich an die Speditionen, die Sie auswählen.",
      },
      {
        q: "Welche Routen deckt Rotamove ab?",
        a: "Von und in die Türkei nach Europa, auf den Balkan, nach Skandinavien, in die GUS und den Kaukasus, nach Zentralasien und in den Nahen Osten — dazu Inlandstransporte in allen 53 Partnerländern.",
      },
      {
        q: "Wie werden Speditionen geprüft?",
        a: "Transportlizenz, Versicherung, Schadenhistorie und ein echtes Depot, jährlich neu geprüft. Wer durchfällt, verlässt das Netzwerk.",
      },
      {
        q: "Wie schnell antworten sie?",
        a: "Sofort-Match-Partner antworten in der Regel innerhalb von fünfzehn Minuten. Alle anderen melden sich am selben Tag.",
      },
    ],
  },

  ctaBand: {
    title: "Was transportieren Sie?",
  },

  coverageGrid: {
    title: "Gebaut für die Routen, die sonst niemand richtig fährt.",
    regions: "Regionen",
  },

  coveragePage: {
    eyebrow: "Netzwerk",
    title: "Die Türkei rückt Europa, Asien und den Nahen Osten näher zusammen",
    lede: "{corridors} Korridore, wöchentlich gefahren von Partnern, die sie wirklich kennen.",
    statCountries: "Länder",
    statCities: "Hub-Städte",
    statCorridors: "Aktive Korridore",
    statLeads: "Anfragen / Monat",
    tableEyebrow: "Jede Relation",
    tableTitle: "Die vollständige Korridortabelle.",
    tableLede: "Medianwerte von Tür zu Tür, gemessen über abgeschlossene Ladungen.",
    thCorridor: "Korridor",
    thFrom: "Von",
    thTo: "Nach",
    thTransit: "Laufzeit",
    thModes: "Verkehrsträger",
    thPartners: "Partner",
    thDemand: "Nachfrage",
    notListed:
      "Route nicht dabei? Das erweiterte Netzwerk deckt über Partnerübergaben rund 90 weitere Länderpaare ab.",
  },

  howItWorksPage: {
    title: "Ein Marktplatz funktioniert nur, wenn man sieht, wie er entscheidet.",
    lede: "Hier sind das Ranking und die Prüfliste, die jede Spedition bestehen muss.",
    steps: [
      { title: "Suchen", body: "Ein Feld: von wo, nach wo." },
      { title: "Matchen", body: "Wir fragen das Netzwerk ab. Dauert etwa acht Sekunden." },
      { title: "Transportieren", body: "Kanal wählen. Nur Ihre Auswahl meldet sich." },
    ],
    rankingTitle: "Fünf Faktoren. Offengelegte Gewichtung.",
    rankingBody:
      "Keine Spedition kann sich eine bessere Position kaufen. Unsere Gebühr ist dieselbe, wen Sie auch wählen.",
    ranking: {
      routeFit: "Routen-Passung",
      reviewScore: "Bewertungsnote",
      onTime: "Pünktlichkeit",
      transit: "Laufzeit",
      response: "Antwortzeit",
    },
    checksTitle: "Was alle {count} Partner nachweisen mussten.",
    checks: [
      {
        title: "Lizenz",
        body: "Transportlizenz und Registrierung, geprüft gegen das nationale Register.",
      },
      { title: "Versicherung", body: "Gültige CMR- und Allrisk-Transportdeckung." },
      {
        title: "Schadenhistorie",
        body: "Laufend überwacht. Über dem Schwellenwert verlassen Sie das Board.",
      },
      { title: "Echter Betrieb", body: "Depot, Flotte, namentliche Mitarbeiter. Keine Makler." },
    ],
    aboutTitle: "Warum Korridore statt Länder.",
    aboutBody1:
      "Frachtverkehr zwischen der Türkei und Europa ist einer der dichtesten Ströme weltweit — und fast nichts davon ist durchsuchbar. Die Relationen in die GUS, nach Zentralasien und in die Golfregion sind noch schlechter erschlossen: Nur eine Handvoll Unternehmen fährt sie wirklich.",
    aboutBody2:
      "Rotamove wählt wenige Korridore und geht dort in die Tiefe. Weniger Routen, echte Partner, jährlich geprüft.",
  },

  partnersPage: {
    eyebrow: "Für Transportunternehmen",
    title: "Kaufen Sie Nachfrage, nicht Telefonnummern.",
    lede: "{leads} geprüfte Anfragen pro Monat auf {corridors} Korridoren. Zwei Wege, sie zu kaufen.",
    plansNote:
      "Beide Tarife umfassen Lizenz- und Versicherungsprüfung, Streitschlichtung und den Ausschluss vom Board, wenn die Standards nachlassen.",
    chooserTitle: "Welcher passt zu Ihnen?",
    feeTitle: "Niemals mehr als {cap}. Egal welche Ladung.",
    whyItems: [
      { title: "Nur Ihre Relationen", body: "Filtern nach Korridor, Volumen und Datum." },
      { title: "Transportbereit", body: "Route, Termine und Volumen sind bereits beantwortet." },
      { title: "Geprüfte Kontakte", body: "Beim Eingang validiert. Bewertet von 0–100." },
      { title: "Gewinnquoten-Reporting", body: "Sehen Sie pro Korridor, warum Sie verloren haben." },
      { title: "API & Webhooks", body: "Anfragen landen direkt in Ihrem TMS." },
      { title: "Keine Provision", body: "Wir nehmen niemals einen Anteil am Auftrag." },
    ],
    faqTitle: "Partner-FAQ",
    ctaTitle: "Kostenlos starten. Upgraden, wenn es sich rechnet.",
    ctaBody: "Die Prüfung dauert etwa zwei Werktage.",
    ctaButton: "Demo-Dashboard öffnen",
    ctaNote: "{pro}/Monat unbegrenzt · oder max. {cap} pro Anfrage",
  },

  plans: {
    mostChosen: "Am häufigsten gewählt",
    proName: "Pro Unlimited",
    proSuffix: "/Monat",
    proNote: "Monatliche Abrechnung in USD. Jederzeit kündbar, keine Kündigungsfrist.",
    proCta: "14 Tage kostenlos testen",
    proFeatures: [
      "Unbegrenzt internationale Anfragen",
      "Unbegrenzt Inlandsanfragen",
      "Sofort-Match-Platzierung in der Suche",
      "Kontakt per Tipp direkt aus der Ergebnisliste",
      "Vollständige Kundenkontaktdaten, unmaskiert",
      "Regelwerk für Kapazität und Saisonalität",
      "Korridor-Nachfrageanalyse & Gewinnquoten-Reporting",
      "Anfragen-API und Webhooks",
      "Priorisierte Streitbearbeitung",
      "Bis zu 8 Nutzerplätze",
    ],
    pplName: "Pay per Lead",
    pplSuffix: "/Anfrage",
    pplNote:
      "Harte Obergrenze von {cap} pro Anfrage. Sie sehen den genauen Preis vor dem Freischalten.",
    pplCta: "Kostenloses Partnerkonto erstellen",
    pplFeatures: [
      "Keine Monatsgebühr, kein Mindestumsatz",
      "Das komplette Anfragen-Board durchsehen",
      "Anfrage freischalten, um Kontaktdaten zu sehen",
      "Rückerstattung innerhalb von 24 Std. bei ungültigen Kontaktdaten",
      "Korridor- und Volumenfilter",
      "Sofort-Match-Platzierung in der Suche",
      "Kontakt per Tipp direkt aus der Ergebnisliste",
      "Anfragen-API und Webhooks",
      "Korridor-Nachfrageanalyse",
      "1 Nutzerplatz",
    ],
    faq: [
      {
        q: "Was genau zählt als Anfrage?",
        a: "Eine vollständige Anfrage mit geprüfter Route, Datum, Volumen und erreichbaren Kontaktdaten. Anfragen, die unsere Validierung nicht bestehen, erreichen das Board nie — und werden Ihnen nie berechnet.",
      },
      {
        q: "Ist Pro Unlimited wirklich unbegrenzt?",
        a: "Ja. {pro} pro Monat deckt jede internationale und nationale Anfrage auf jedem Korridor ab, ohne Limit und ohne Mehrkosten. Die einzige Grenze sind Ihre eigenen Kapazitätseinstellungen.",
      },
      {
        q: "Warum sollte ich stattdessen pro Anfrage zahlen?",
        a: "Wenn Sie weniger als {breakEven} Anfragen im Monat abschließen, ist Pay per Lead günstiger. Die meisten Partner starten dort und wechseln innerhalb von zwei Monaten zu Pro.",
      },
      {
        q: "Kann eine Anfrage mehr als die Obergrenze kosten?",
        a: "Nie. {cap} ist eine harte Decke, unabhängig von Korridor, Volumen oder Auftragswert — und der genaue Preis wird vor dem Freischalten angezeigt.",
      },
      {
        q: "Erscheinen Pay-per-Lead-Partner in den Suchergebnissen?",
        a: "Sie erscheinen in der Ergebnisliste, allerdings als später antwortend statt sofort. Die Sofort-Match-Platzierung ist eine Pro-Unlimited-Funktion.",
      },
      {
        q: "Was, wenn die Kontaktdaten falsch sind?",
        a: "Melden Sie es innerhalb von 24 Stunden, dann wird das Anfragen-Guthaben automatisch erstattet. Pro-Partner sind nicht betroffen, da keine Gebühr pro Anfrage anfällt.",
      },
    ],
  },

  planChooser: {
    label: "Anfragen, die Sie pro Monat annehmen würden",
    ariaLeads: "Anfragen pro Monat",
    proNote: "pauschal, bei jedem Volumen",
    pplNote: "je ≈ {fee} · gedeckelt bei {cap}",
    cheaperFor: "{plan} ist für Sie günstiger",
    proWins:
      "um {saving} im Monat — und nur Pro bringt Sie in die Sofort-Suchergebnisse.",
    pplWins: "um {saving} im Monat. Ab {breakEven} Anfragen gewinnt Pro.",
    proCta: "Pro-Test starten",
    pplCta: "Kostenloses Konto erstellen",
  },

  leadFee: {
    eyebrow: "Was eine Anfrage kostet",
    body: "Der Preis pro Anfrage folgt dem erwarteten Auftragswert, nicht einem Pauschaltarif — und stoppt hart bei {cap}. Ändern Sie unten den Auftrag und sehen Sie die Gebühr wandern.",
    destination: "Ziel ab Istanbul",
    volume: "Ladevolumen",
    daysOut: "Tage bis zur Abholung",
    fullService: "Full Service",
    fullServiceHint: "Ein- und Auspacken inklusive",
    storage: "Lagerung erforderlich",
    storageHint: "4 Wochen Zolllager",
    youPay: "Sie würden zahlen",
    once: "einmalig",
    floor: "{amount} Minimum",
    cap: "{amount} Maximum",
    atCap:
      "Dieser Auftrag ist für den Gewinner weit mehr als {cap} wert — die Obergrenze gilt trotzdem.",
    quality: "Qualitätsscore der Anfrage",
    qualityValue: "{score} / 100",
    moveType: "Ladungsart",
    refundWindow: "Rückerstattungsfrist",
    refundValue: "24 Stunden",
    costOnPro: "Kosten bei Pro Unlimited",
    costOnProValue: "{amount} — inklusive",
    footnote:
      "Pro-Unlimited-Partner zahlen pro Anfrage nichts, egal was diese Zahl sagt. Genau das ist der Deal: {pro} im Monat kaufen das Recht, nicht mehr darüber nachzudenken.",
  },

  search: {
    fromLabel: "Von",
    toLabel: "Nach",
    fromPlaceholder: "Von wo?",
    toPlaceholder: "Nach wo?",
    swap: "Start und Ziel tauschen",
    popular: "Beliebt",
    noMatch: "Kein Treffer für „{query}“",
  },

  dates: {
    label: "Wann",
    placeholder: "Zeitraum wählen",
    hint: "Optional — wählen Sie ein Abholfenster",
    clear: "Löschen",
    done: "Fertig",
    flexibleBy: "Abholfenster · {days}",
    previousMonth: "Voriger Monat",
    nextMonth: "Nächster Monat",
  },

  lastCall: {
    badge: "Kurzfristig frei",
    body: "{count} können innerhalb von 24 Stunden abholen.",
    cta: "Jetzt finden",
    dismiss: "Schließen",
  },

  quote: {
    steps: {
      home: "Ladung",
      services: "Hilfe",
      contact: "Kontakt",
    },
    headings: {
      home: "Was transportieren wir?",
      services: "Wie viel Hilfe?",
      contact: "Wie sollen sie Sie erreichen?",
    },
    swapDirection: "Richtung tauschen",
    fineTuneVolume: "Volumen feinjustieren",
    volumeAria: "Volumen in Kubikmetern",
    approxBoxes: "≈ {boxes}",
    accessPickup: "Zugang bei der Abholung",
    accessDelivery: "Zugang bei der Zustellung",
    parkAtDoor: "Lkw kann direkt an der Tür parken",
    moveDate: "Abholdatum",
    howFlexible: "Wie flexibel?",
    peakSeason:
      "Juni bis September ist Hochsaison. Zwei Wochen früher oder später eröffnet deutlich mehr Kapazität.",
    addOns: "Zusatzleistungen",
    storageLegend: "Lagerung",
    storageAria: "Wochen Lagerung",
    specialistLegend: "Etwas Besonderes dabei?",
    preferredChannel: "Bevorzugter Kanal",
    name: "Name",
    namePlaceholder: "Elif Yılmaz",
    email: "E-Mail",
    emailPlaceholder: "sie@beispiel.de",
    phone: "Telefon",
    phonePlaceholder: "+49 151 000 000 00",
    notes: "Noch etwas?",
    notesPlaceholder: "Enge Straße, am Ziel kein Aufzug …",
    consent:
      "Meine Anfrage mit passenden Speditionen teilen. Ihre Daten gehen nirgendwo sonst hin.",
    matching: "Wird abgeglichen …",
    findMovers: "Meine Speditionen finden",
    moversMatch: "{count} passend",
    sendFailed: "Ihre Anfrage konnte nicht gesendet werden",
    somethingWrong: "Etwas ist schiefgelaufen",
    matchCount: {
      legend: "Wie viele Speditionen sollen wir kontaktieren?",
      hint: "Ihre Anfrage geht nur an die Speditionen, die Sie auswählen.",
      two: "2 Speditionen",
      twoHint: "Die zwei stärksten Treffer",
      five: "5 Speditionen",
      fiveHint: "Eine ausgewogene Auswahl",
      all: "Alle Speditionen",
      allHint: "Jeder Treffer auf Ihrer Route",
      recommended: "Empfohlen",
    },
    extras: {
      packing: "Einpacken",
      unpacking: "Auspacken",
      dismantling: "Möbel ab- und aufbauen",
      insurance: "Transportversicherung",
      customsClearance: "Zoll für mich erledigen",
      cleaning: "Endreinigung",
    },
  },

  verify: {
    verifyAction: "Bestätigen",
    verified: "Bestätigt",
    sending: "Wird gesendet …",
    checking: "Wird geprüft …",
    codeSentEmail: "Wir haben einen 6-stelligen Code an {target} gesendet.",
    codeSentPhone: "Wir haben einen 6-stelligen Code per SMS an {target} gesendet.",
    codeLabel: "Bestätigungscode",
    digitLabel: "Stelle {n}",
    demoHint: "Demo-Code: {code}",
    resend: "Code erneut senden",
    resendIn: "Erneut senden in {seconds} s",
    wrongCode: "Dieser Code passt nicht. {attempts} übrig.",
    locked: "Zu viele Versuche. Fordern Sie einen neuen Code an.",
    emailNeedsVerifying: "Bestätigen Sie Ihre E-Mail, um fortzufahren",
    phoneNeedsVerifying: "Bestätigen Sie Ihre Telefonnummer, um fortzufahren",
    demoNote:
      "Die Bestätigung ist in dieser Demo simuliert — es wird keine E-Mail und keine SMS versendet.",
  },

  results: {
    expiredTitle: "Diese Suche ist abgelaufen",
    expiredBody:
      "Links bleiben 30 Tage aktiv. Beginnen Sie neu — wir matchen in Sekunden erneut.",
    unreadableTitle: "Wir konnten diese Suche nicht lesen",
    unreadableBody:
      "Beginnen Sie neu, dann bauen wir Ihre Treffer in wenigen Sekunden wieder auf.",
    noFiltersTitle: "Keine Treffer für diese Filter",
    noFiltersBody:
      "Lassen Sie eine Anforderung weg — auf dieser Route gibt es weiterhin Speditionen.",
    clearFilters: "Filter zurücksetzen",
    sortAria: "Sortieren",
    filtersTitle: "Filter",
    networkError: "Wir konnten das Partnernetzwerk nicht erreichen.",
    searchFailed: "Suche fehlgeschlagen",
    openingSearch: "Ihre Suche wird geöffnet",
    oneMoment: "Einen Moment",
    canTakeThis: "Speditionen können das übernehmen",
    matchedIn: "In {seconds} s gematcht · sie melden sich bei Ihnen",
    complete: "Anfrage gesendet",
    rankingNote:
      "Unabhängig gerankt. Speditionen zahlen uns eine Pauschale oder eine kleine, gedeckelte Gebühr pro Anfrage — niemals eine Provision. Niemand kann sich also eine höhere Position kaufen.",
    sort: {
      best: "Beste Übereinstimmung",
    },
    stages: {
      secure: { label: "Ihre Anfrage wird gesichert", detail: "Verschlüsselt und verifiziert" },
      corridor: {
        label: "Korridor {from} → {to} wird geöffnet",
        detailCore: "{corridor} · typisch {days}",
        detailExtended: "Routing über erweitertes Netzwerk via {corridor}",
      },
      partners: {
        label: "{count} Partnerspeditionen werden abgefragt",
        detail: "Lizenzierte Unternehmen in {from} und {to}",
      },
      capacity: {
        label: "Fahrzeugkapazität wird bestätigt",
        detail: "Freie Teams rund um {date} werden geprüft",
      },
      route: {
        label: "Streckenkapazität wird geprüft",
        detail: "Fährslots, Grenzübergänge und Teams",
      },
      ranking: {
        label: "Ihre Treffer werden gerankt",
        detail: "Abdeckung, Geschwindigkeit, Zuverlässigkeit und Bewertungen",
      },
    },
  },

  filters: {
    searching: "Wird gesucht …",
    ofTotal: "{shown} von {total}",
    instantOnly: "Nur Sofort-Match",
    mode: "Verkehrsträger",
    rating: "Bewertung",
    mustOffer: "Muss anbieten",
    ratingPlus: "{rating}+",
    services: {
      packing: "Verpackung",
      storage: "Lagerung",
      customs: "Zoll",
      vehicle: "Fahrzeuge",
      piano: "Klavier",
      cleaning: "Reinigung",
    },
  },

  moverCard: {
    bestMatch: "Beste Übereinstimmung",
    fastest: "Schnellste",
    instantMatch: "Sofort-Match",
    since: "seit {year}",
    transit: "Laufzeit",
    collection: "Abholung",
    delivery: "Zustellung",
    onTime: "{pct} pünktlich",
    repliesIn: "Antwortet in {time}",
    co2: "{amount} kg CO₂e",
    requestSent: "Anfrage gesendet",
    willReply: "{promise} — innerhalb von {time}.",
    manualPickup: "Nimmt Anfragen manuell auf — antwortet meist am selben Tag.",
    channels: {
      whatsapp: {
        label: "WhatsApp",
        done: "Sie schreiben Ihnen auf WhatsApp",
      },
      phone: { label: "Anruf", done: "Sie rufen Sie an" },
      email: { label: "E-Mail", done: "Sie schreiben Ihnen eine E-Mail" },
    },
  },

  moverProfile: {
    notFound: "Spedition nicht gefunden",
    metaTitle: "{name} — Bewertungen und Korridore",
    established: "Gegründet {year}",
    completedMoves: "{count} abgeschlossene Ladungen",
    instantMatch: "Sofort-Match",
    sameDay: "Antwortet am selben Tag",
    instantBody: "Bestätigt die Verfügbarkeit, sobald Ihre Suche läuft.",
    manualBody: "Nimmt Anfragen von Hand auf und meldet sich dann.",
    repliesIn: "antwortet in {time}",
    blurbNote: "Partnerbeschreibung wie bereitgestellt wiedergegeben.",
    statOnTime: "Pünktliche Zustellung",
    statClaims: "Schadenquote",
    statTrucks: "Eigene Lkw",
    statCrew: "Personal",
    statCover: "Deckung",
    statCoverValue: "Vollständiger Wiederbeschaffungswert",
    statCancellation: "Kostenlose Stornierung",
    corridorsTitle: "Korridore, die sie fahren",
    corridorTypical: "typisch {days}",
    extendedNetwork: "Deckt {regions} über das erweiterte Netzwerk ab.",
    reviewsTitle: "Bewertungen",
    servicesTitle: "Leistungen",
    languagesTitle: "Sprachen & Regionen",
    billingTitle: "Wie dieser Partner abgerechnet wird",
    billingPro:
      "{name} nutzt Pro Unlimited — pauschal {pro} im Monat für jede Anfrage im Netzwerk. Die Spedition zahlt dasselbe, ob Sie sie wählen oder nicht.",
    billingPpl:
      "{name} nutzt Pay per Lead — bis zu {cap}, um eine gewünschte Anfrage freizuschalten. In beiden Fällen ohne Provision.",
    services: {
      packing: "Professionelle Verpackung",
      storage: "Zolllager",
      customs: "Zollabwicklung im Haus",
      vehicle: "Auto- und Motorradtransport",
      piano: "Klavier- und Kunsttransport",
      cleaning: "Endreinigung",
    },
  },

  login: {
    title: "Partner-Anmeldung",
    lede: "Verwalten Sie Ihr Anfragen-Board, schalten Sie Anfragen frei und behalten Sie Ihren Tarif im Blick.",
    email: "Geschäftliche E-Mail",
    password: "Passwort",
    submit: "Anmelden",
    signingIn: "Anmeldung läuft …",
    demoTitle: "Demo-Konto",
    demoBody: "Dies ist eine Demo — nur diese Zugangsdaten funktionieren.",
    demoFill: "Demo-Zugangsdaten einsetzen",
    error: "Diese Zugangsdaten passen nicht zum Demo-Konto.",
    notPartner: "Noch kein Partner?",
    seePlans: "Partner-Tarife ansehen",
    signOut: "Abmelden",
  },

  notFound: {
    eyebrow: "404 · keine solche Route",
    title: "Dieser Korridor steht nicht auf dem Board.",
    body: "Die Seite ist umgezogen oder hat nie existiert.",
  },

  enums: {
    propertySize: {
      few_items: { label: "Ein paar Teile", hint: "Kartons, ein Bett, keine Möbelgarnitur" },
      studio: { label: "Studio / 1 Zimmer", hint: "Wohnung ca. 45 m²" },
      one_bed: { label: "1 Schlafzimmer / 2 Zimmer", hint: "Wohnung ca. 65 m²" },
      two_bed: { label: "2 Schlafzimmer / 3 Zimmer", hint: "Wohnung ca. 95 m²" },
      three_bed: { label: "3 Schlafzimmer / 4 Zimmer", hint: "Wohnung ca. 130 m²" },
      four_bed: { label: "4+ Schlafzimmer", hint: "Wohnung ca. 170 m²" },
      villa: { label: "Villa / Einfamilienhaus", hint: "Ab 220 m²" },
      office: { label: "Büro / gewerbliche Fracht", hint: "Schreibtische, IT, Archiv, Paletten" },
    },
    access: {
      ground: { label: "Erdgeschoss", hint: "Überhaupt keine Treppen" },
      lift: { label: "Aufzug vorhanden", hint: "Lasten- oder Personenaufzug" },
      stairs_1_2: { label: "Treppe, 1–2 Etagen", hint: "Kein Aufzug" },
      stairs_3_plus: { label: "Treppe, 3+ Etagen", hint: "Kein Aufzug, hohe Etage" },
    },
    flexibility: {
      exact: "Genau an diesem Datum",
      plus_minus_3: "Innerhalb von 3 Tagen",
      within_2_weeks: "Innerhalb von 2 Wochen",
      flexible: "Völlig flexibel",
    },
    serviceLevel: {
      full_service: {
        label: "Full Service",
        hint: "Sie packen ein, laden, transportieren und packen aus.",
      },
      door_to_door: {
        label: "Von Tür zu Tür",
        hint: "Sie packen die Kartons, den Rest machen sie.",
      },
      transport_only: { label: "Nur Transport", hint: "Alles ist abholbereit." },
    },
    specialItems: {
      piano: "Klavier",
      vehicle: "Auto oder Motorrad",
      artwork: "Kunst oder Antiquitäten",
      safe: "Safe über 100 kg",
      gym: "Fitnessgeräte",
      plants: "Große Pflanzen",
    },
    moveType: {
      international: "International",
      domestic: "Inland",
    },
    modes: {
      road: { label: "Straße", hint: "Lkw von Tür zu Tür, kein Umschlag" },
      sea: { label: "See", hint: "LCL-Container — am günstigsten auf langen Strecken" },
      air: { label: "Luft", hint: "Am schnellsten, ideal für kleine Sendungen" },
      rail: { label: "Schiene", hint: "Ganzzug — emissionsarm, fester Fahrplan" },
    },
    badges: {
      instant_quote: {
        label: "Sofort-Match",
        hint: "Pro-Unlimited-Partner — bestätigt die Verfügbarkeit sofort.",
      },
      top_rated: {
        label: "Bestbewertet",
        hint: "Note 4,6+ über 500 oder mehr verifizierte Bewertungen.",
      },
      fast_responder: {
        label: "Antwortet schnell",
        hint: "Median der ersten Antwort unter 20 Minuten.",
      },
      best_value: {
        label: "Bestes Preis-Leistungs-Verhältnis",
        hint: "Liegt durchgehend unter dem Korridormedian.",
      },
      eco_fleet: { label: "Emissionsarm", hint: "HVO, elektrisch oder Schiene zuerst." },
      customs_expert: { label: "Zollexperte", hint: "Eigene Zollabwicklung auf diesem Korridor." },
      fragile_specialist: {
        label: "Spezialist für Zerbrechliches",
        hint: "Maßgefertigte Verschläge für Kunst, Antiquitäten und Instrumente.",
      },
    },
    regions: {
      TR: "Türkei",
      EU_WEST: "Westeuropa",
      EU_SOUTH: "Südeuropa",
      BALKANS: "Balkan",
      NORDICS: "Skandinavien & Nordeuropa",
      CIS: "GUS & Kaukasus",
      CENTRAL_ASIA: "Zentralasien",
      MIDDLE_EAST: "Naher Osten",
    },
    corridors: {
      "tr-eu-west": "Türkei → Deutschland, Benelux & Frankreich",
      "eu-west-tr": "Westeuropa → Türkei",
      "tr-eu-south": "Türkei → Italien, Spanien & Griechenland",
      "eu-south-tr": "Südeuropa → Türkei",
      "tr-nordics": "Türkei → Skandinavien",
      "nordics-tr": "Skandinavien → Türkei",
      "tr-balkans": "Türkei → Balkan",
      "balkans-tr": "Balkan → Türkei",
      "tr-middle-east": "Türkei → Golfregion & Levante",
      "middle-east-tr": "Naher Osten → Türkei",
      "tr-cis": "Türkei → Russland & Kaukasus",
      "cis-tr": "Russland & Kaukasus → Türkei",
      "tr-central-asia": "Türkei → Zentralasien",
      "central-asia-tr": "Zentralasien → Türkei",
      "eu-central-asia": "Europa → Zentralasien (über den Mittleren Korridor)",
      "central-asia-eu": "Zentralasien → Europa",
      "me-eu": "Golfregion → Europa",
      "eu-me": "Europa → Golfregion",
      "tr-domestic": "Inland Türkei",
    },
    corridorFallback: {
      domestic: "Inland {region}",
      extended: "{from} → {to}",
    },
  },

  meta: {
    titleDefault: "Rotamove — die passende Spedition für jede Ladung",
    titleTemplate: "%s · Rotamove",
    description:
      "Eine Suche. Geprüfte Speditionen für Umzüge und gewerbliche Fracht in der Türkei, Europa, auf dem Balkan, in Skandinavien, der GUS, Zentralasien und im Nahen Osten.",
    ogTitle: "Geprüfte Speditionen in 53 Ländern vergleichen",
    ogDescription:
      "Sagen Sie uns, wohin Ihre Ladung geht. Wir matchen Sie mit geprüften Transportdienstleistern, die auf Sie zukommen.",
    keywords: [
      "Spedition",
      "internationaler Umzug",
      "Transport Türkei Europa",
      "uluslararası nakliyat",
      "gewerbliche Fracht Angebot",
      "Logistik Zentralasien",
    ],
    quoteTitle: "Erzählen Sie uns von Ihrer Ladung",
    quoteDescription:
      "Beschreiben Sie Ihre Ladung einmal. Geprüfte Speditionen melden sich auf dem Kanal, den Sie wählen.",
    resultsTitle: "Ihre Speditions-Treffer",
    resultsDescription: "Geprüfte Speditionen für eine Ladung von {volume}.",
    coverageTitle: "Korridorabdeckung — 53 Länder, 19 aktive Relationen",
    coverageDescription:
      "Jeder Korridor, den Rotamove anbietet: von und in die Türkei nach West- und Südeuropa, auf den Balkan, nach Skandinavien, in die GUS, nach Zentralasien und in den Nahen Osten.",
    howItWorksTitle: "So funktioniert’s",
    howItWorksDescription:
      "Wie Rotamove Sie mit Speditionen zusammenbringt, wie das Ranking gewichtet ist und was jeder Partner nachweisen muss.",
    partnersTitle: "Für Speditionen — 100 $/Monat unbegrenzt oder bis zu 7 $ pro Anfrage",
    partnersDescription:
      "Werden Sie Teil des Rotamove-Partnernetzwerks. Unbegrenzt Anfragen für eine Monatspauschale oder Zahlung pro Anfrage mit harter Obergrenze von 7 $.",
  },
} satisfies Dictionary;

export default de;
