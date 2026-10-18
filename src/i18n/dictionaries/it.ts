import type { Dictionary } from "@/i18n/dictionaries";

/** Italiano. */
export const it = {
  units: {
    days: { one: "{n} giorno", other: "{n} giorni" },
    weeks: { one: "{n} settimana", other: "{n} settimane" },
    monthsAgo: { one: "{n} mese fa", other: "{n} mesi fa" },
    movers: { one: "{n} trasportatore", other: "{n} trasportatori" },
    countries: { one: "{n} paese", other: "{n} paesi" },
    cities: { one: "{n} città", other: "{n} città" },
    boxes: { one: "{n} scatolone", other: "{n} scatoloni" },
    attempts: { one: "{n} tentativo", other: "{n} tentativi" },
    minutesShort: "{n} min",
    hoursShort: "{n} h",
    daysShort: "{n} g",
    perMonth: "{n}/mese",
    cubicMetres: "{n} m³",
    none: "Nessuno",
  },

  common: {
    skipToContent: "Vai al contenuto",
    search: "Cerca",
    continue: "Continua",
    back: "Indietro",
    change: "Modifica",
    edit: "Modifica",
    reset: "Reimposta",
    undo: "Annulla",
    tryAgain: "Riprova",
    optional: "(facoltativo)",
    any: "Tutti",
    free: "Gratuito · senza account · senza telefonate a freddo",
    appearance: "Aspetto",
    toggleTheme: "Alterna tema chiaro e scuro",
    openMenu: "Apri il menu",
    startSearch: "Avvia una ricerca",
    newSearch: "Nuova ricerca",
    startAgain: "Ricomincia",
    searchAnyRoute: "Cerca qualsiasi tratta",
    allCorridors: "Tutti i corridoi",
    browseCorridors: "Sfoglia i corridoi",
    partnerLogin: "Area partner",
    ratingLabel: "{rating} su 5",
    ratingLabelWithCount: "{rating} su 5 da {count} recensioni",
    verifiedBooking: "prenotazione verificata",
  },

  language: {
    label: "Lingua",
    choose: "Scegli una lingua",
  },

  nav: {
    howItWorks: "Come funziona",
    coverage: "Copertura",
    forMovers: "Per i trasportatori",
    main: "Navigazione principale",
    mobile: "Navigazione mobile",
    home: "Home di Rotamove",
  },

  footer: {
    blurb:
      "Trasportatori verificati in Turchia, Europa, Balcani, Scandinavia, CSI, Asia centrale e Medio Oriente.",
    move: "Trasporto",
    movers: "Trasportatori",
    company: "Azienda",
    partnerPricing: "Prezzi partner",
    dashboardDemo: "Demo della dashboard",
    partnerFaq: "FAQ partner",
    about: "Chi siamo",
    trust: "Fiducia e verifica",
    contact: "Contatti",
    rights: "Rotamove · prodotto dimostrativo",
    privacy: "KVKK e GDPR",
    terms: "Condizioni",
    offices: "Istanbul · Berlino · Tashkent",
  },

  hero: {
    eyebrow: "Turchia · Europa · Asia centrale · Golfo",
    title: "Trova il trasportatore giusto per ogni carico.",
    subtitle:
      "Dai traslochi domestici al trasporto merci commerciale, trova il fornitore di trasporto giusto per ogni carico.",
  },

  scene: {
    alt: "Un camion e due furgoni viaggiano dal punto di carico al punto di consegna.",
    origin: "Ritiro",
    originHint: "Dove carichi tu",
    destination: "Consegna",
    destinationHint: "Dove scarichi tu",
    inTransit: "Porta a porta",
  },

  trust: {
    label: "Solo partner accreditati",
  },

  how: {
    title: "Tre passaggi. Niente rimpalli telefonici.",
    steps: [
      { title: "Cerca", body: "Un campo solo. Da dove, a dove." },
      { title: "Abbina", body: "Troviamo i trasportatori che fanno davvero la tua tratta." },
      { title: "Trasporta", body: "Scegli WhatsApp, una chiamata o l’e-mail. Ti contattano loro." },
    ],
  },

  testimonials: {
    title: "24.800 carichi trasportati, e si continua.",
    items: [
      {
        quote:
          "Quattro trasportatori mi hanno scritto su WhatsApp lo stesso pomeriggio. Entro sera avevo scelto.",
        name: "Aylin K.",
        route: "Istanbul → Berlino",
      },
      {
        quote:
          "Hanno trovato operatori che fanno davvero la traversata del Caspio. Nessun altro ci riusciva.",
        name: "Rustam A.",
        route: "Tashkent → Istanbul",
      },
      {
        quote: "Niente moduli, niente spam. Una ricerca e mi hanno contattato le persone giuste.",
        name: "Jonas R.",
        route: "Stoccolma → Smirne",
      },
    ],
  },

  partnerTeaser: {
    eyebrow: "Per le aziende di trasporto",
    title: "Compra domanda, non numeri di telefono.",
    body: "Quota mensile fissa, o pagamento per contatto con un tetto massimo. Nient’altro.",
    pricingCta: "Prezzi partner",
    demoCta: "Guarda la demo",
    proBody: "Tutti i contatti, illimitati. Posizionamento immediato nella ricerca.",
    proUnit: "/ mese",
    pplBody: "Nessun abbonamento. Mai più di {cap}.",
    pplUnit: "/ contatto",
  },

  faq: {
    title: "Domande",
    items: [
      {
        q: "È gratuito?",
        a: "Sì, sempre. I trasportatori ci pagano una quota mensile fissa o una piccola commissione per contatto con un tetto massimo — mai una provvigione sul tuo carico, quindi nessuno può pagare per una posizione migliore.",
      },
      {
        q: "Riceverò telefonate indesiderate?",
        a: "No. Il canale lo scegli tu — WhatsApp, una chiamata o l’e-mail — e i tuoi dati vanno solo ai trasportatori che selezioni.",
      },
      {
        q: "Quali tratte coprite?",
        a: "Dalla Turchia verso e da Europa, Balcani, Scandinavia, CSI e Caucaso, Asia centrale e Medio Oriente — più il trasporto nazionale in tutti i 53 paesi partner.",
      },
      {
        q: "Come vengono verificati i trasportatori?",
        a: "Licenza di trasporto, assicurazione, storico sinistri e un deposito reale, ricontrollati ogni anno. Chi non supera la verifica esce dalla rete.",
      },
      {
        q: "Quanto velocemente rispondono?",
        a: "I partner con abbinamento immediato rispondono di norma entro quindici minuti. Gli altri si fanno sentire lo stesso giorno.",
      },
    ],
  },

  ctaBand: {
    title: "Cosa devi trasportare?",
  },

  coverageGrid: {
    title: "Costruito per le tratte che nessun altro gestisce davvero bene.",
    regions: "Regioni",
  },

  coveragePage: {
    eyebrow: "Rete",
    title: "La Turchia avvicina Europa, Asia e Medio Oriente",
    lede: "{corridors} corridoi, serviti ogni settimana da partner che li percorrono davvero.",
    statCountries: "Paesi",
    statCities: "Città hub",
    statCorridors: "Corridoi attivi",
    statLeads: "Richieste / mese",
    tableEyebrow: "Ogni tratta",
    tableTitle: "La tabella completa dei corridoi.",
    tableLede: "Mediane porta a porta, misurate sui carichi consegnati.",
    thCorridor: "Corridoio",
    thFrom: "Da",
    thTo: "A",
    thTransit: "Transito",
    thModes: "Modalità",
    thPartners: "Partner",
    thDemand: "Domanda",
    notListed:
      "La tua tratta non è in elenco? La rete estesa copre un’altra novantina di coppie di paesi grazie ai passaggi fra partner.",
  },

  howItWorksPage: {
    title: "Un marketplace funziona solo se si vede come decide.",
    lede: "Ecco quindi il ranking e la lista di controllo che ogni trasportatore deve superare.",
    steps: [
      { title: "Cerca", body: "Un campo solo: da dove, a dove." },
      { title: "Abbina", body: "Interroghiamo la rete. Ci vogliono circa otto secondi." },
      { title: "Trasporta", body: "Scegli il canale. Ti contattano solo quelli che hai scelto." },
    ],
    rankingTitle: "Cinque criteri. Pesi pubblicati.",
    rankingBody:
      "Nessun trasportatore può pagare per una posizione migliore. La nostra commissione è identica chiunque tu scelga.",
    ranking: {
      routeFit: "Aderenza alla tratta",
      reviewScore: "Punteggio recensioni",
      onTime: "Puntualità",
      transit: "Velocità di transito",
      response: "Tempo di risposta",
    },
    checksTitle: "Cosa hanno dovuto dimostrare tutti i {count} partner.",
    checks: [
      {
        title: "Licenza",
        body: "Licenza di trasporto e iscrizione, verificate sul registro nazionale.",
      },
      { title: "Assicurazione", body: "CMR valida e copertura trasporto all-risk." },
      {
        title: "Storico sinistri",
        body: "Monitorato in continuo. Sopra la soglia si esce dalla bacheca.",
      },
      { title: "Operatività reale", body: "Un deposito, una flotta, personale con nome. Nessun intermediario." },
    ],
    aboutTitle: "Perché i corridoi e non i paesi.",
    aboutBody1:
      "Il trasporto merci fra Turchia ed Europa è uno dei flussi più densi al mondo, e quasi nulla è consultabile online. Le tratte verso CSI, Asia centrale e Golfo sono ancora meno servite: le percorre davvero solo una manciata di operatori.",
    aboutBody2:
      "Rotamove sceglie pochi corridoi e li approfondisce. Meno tratte, partner reali, verificati ogni anno.",
  },

  partnersPage: {
    eyebrow: "Per le aziende di trasporto",
    title: "Compra domanda, non numeri di telefono.",
    lede: "{leads} richieste verificate al mese su {corridors} corridoi. Due modi per acquistarle.",
    plansNote:
      "Entrambi i piani includono la verifica di licenza e assicurazione, la mediazione delle controversie e la rimozione dalla bacheca se gli standard calano.",
    chooserTitle: "Quale fa per te?",
    feeTitle: "Mai più di {cap}. Qualunque sia il carico.",
    whyItems: [
      { title: "Solo le tue tratte", body: "Filtra per corridoio, volume e data." },
      { title: "Pronti a partire", body: "Tratta, date e volume già indicati." },
      { title: "Contatti verificati", body: "Validati all’ingresso. Punteggio da 0 a 100." },
      { title: "Report sul tasso di successo", body: "Scopri perché hai perso, per corridoio." },
      { title: "API e webhook", body: "Le richieste arrivano direttamente nel tuo TMS." },
      { title: "Nessuna provvigione", body: "Non tratteniamo mai una quota del lavoro." },
    ],
    faqTitle: "FAQ partner",
    ctaTitle: "Inizia gratis. Passa al piano superiore quando conviene.",
    ctaBody: "La verifica richiede circa due giorni lavorativi.",
    ctaButton: "Apri la dashboard dimostrativa",
    ctaNote: "{pro}/mese illimitato · oppure massimo {cap} per contatto",
  },

  plans: {
    mostChosen: "Il più scelto",
    proName: "Pro Illimitato",
    proSuffix: "/mese",
    proNote: "Fatturazione mensile in USD. Disdetta in qualsiasi momento, senza preavviso.",
    proCta: "Inizia la prova gratuita di 14 giorni",
    proFeatures: [
      "Richieste internazionali illimitate",
      "Richieste nazionali illimitate",
      "Posizionamento con abbinamento immediato nella ricerca",
      "Contatto con un tocco dalla bacheca dei risultati",
      "Dati di contatto completi del cliente, non mascherati",
      "Motore di regole per capacità e stagionalità",
      "Analisi della domanda per corridoio e report sul tasso di successo",
      "API delle richieste e webhook",
      "Gestione prioritaria delle controversie",
      "Fino a 8 postazioni operatore",
    ],
    pplName: "Pagamento per contatto",
    pplSuffix: "/contatto",
    pplNote: "Tetto massimo di {cap} per contatto. Vedi il prezzo esatto prima di sbloccare.",
    pplCta: "Crea un account partner gratuito",
    pplFeatures: [
      "Nessun costo mensile, nessuna spesa minima",
      "Sfoglia tutta la bacheca delle richieste",
      "Sblocca una richiesta per vedere i dati di contatto",
      "Rimborso entro 24 h se i dati di contatto non sono validi",
      "Filtri per corridoio e volume",
      "Posizionamento con abbinamento immediato nella ricerca",
      "Contatto con un tocco dalla bacheca dei risultati",
      "API delle richieste e webhook",
      "Analisi della domanda per corridoio",
      "1 postazione operatore",
    ],
    faq: [
      {
        q: "Cosa conta esattamente come richiesta?",
        a: "Una richiesta completa con tratta verificata, data, volume e dati di contatto raggiungibili. Le richieste che non superano la nostra validazione non arrivano mai sulla bacheca e non ti vengono mai addebitate.",
      },
      {
        q: "Pro Illimitato è davvero illimitato?",
        a: "Sì. {pro} al mese coprono ogni richiesta internazionale e nazionale su ogni corridoio, senza tetti né eccedenze. L’unico limite sono le tue impostazioni di capacità.",
      },
      {
        q: "Perché dovrei pagare per contatto?",
        a: "Se chiudi meno di {breakEven} richieste al mese, il pagamento per contatto costa meno. La maggior parte dei partner inizia così e passa a Pro entro due mesi.",
      },
      {
        q: "Una richiesta può costare più del tetto massimo?",
        a: "Mai. {cap} è un limite rigido, indipendentemente da corridoio, volume o valore del lavoro, e il prezzo esatto è mostrato prima dello sblocco.",
      },
      {
        q: "I partner a pagamento per contatto compaiono nei risultati di ricerca?",
        a: "Compari sulla bacheca dei risultati, ma segnalato come «risponde più tardi» invece che immediatamente. Il posizionamento con abbinamento immediato è una funzione di Pro Illimitato.",
      },
      {
        q: "E se i dati di contatto sono sbagliati?",
        a: "Segnalalo entro 24 ore e il credito della richiesta viene rimborsato automaticamente. I partner Pro non sono interessati, dato che non c’è alcun addebito per contatto.",
      },
    ],
  },

  planChooser: {
    label: "Richieste che prenderesti al mese",
    ariaLeads: "Richieste al mese",
    proNote: "fisso, a qualsiasi volume",
    pplNote: "≈ {fee} ciascuna · con tetto a {cap}",
    cheaperFor: "{plan} ti conviene di più",
    proWins:
      "di {saving} al mese — e solo Pro ti mette nei risultati di ricerca immediati.",
    pplWins: "di {saving} al mese. Pro conviene da {breakEven} richieste.",
    proCta: "Inizia la prova Pro",
    pplCta: "Crea un account gratuito",
  },

  leadFee: {
    eyebrow: "Quanto costa una richiesta",
    body: "Il prezzo per contatto segue il valore atteso del lavoro, non una tariffa fissa — e si ferma di netto a {cap}. Modifica il lavoro qui sotto e guarda come si muove la commissione.",
    destination: "Destinazione da Istanbul",
    volume: "Volume del carico",
    daysOut: "Giorni al ritiro",
    fullService: "Servizio completo",
    fullServiceHint: "Imballaggio e disimballaggio inclusi",
    storage: "Serve deposito",
    storageHint: "4 settimane in deposito doganale",
    youPay: "Pagheresti",
    once: "una volta sola",
    floor: "minimo {amount}",
    cap: "massimo {amount}",
    atCap:
      "Questo lavoro vale molto più di {cap} per chi lo vince — il tetto massimo resta comunque valido.",
    quality: "Punteggio di qualità della richiesta",
    qualityValue: "{score} / 100",
    moveType: "Tipo di carico",
    refundWindow: "Finestra di rimborso",
    refundValue: "24 ore",
    costOnPro: "Costo con Pro Illimitato",
    costOnProValue: "{amount} — incluso",
    footnote:
      "I partner Pro Illimitato non pagano nulla per contatto, qualunque cifra compaia qui. Il compromesso è tutto qui: {pro} al mese comprano il diritto di non pensarci più.",
  },

  search: {
    fromLabel: "Da",
    toLabel: "A",
    fromPlaceholder: "Da dove?",
    toPlaceholder: "Verso dove?",
    swap: "Scambia partenza e destinazione",
    popular: "Popolari",
    noMatch: "Nessun risultato per «{query}»",
  },

  dates: {
    label: "Quando",
    placeholder: "Aggiungi le date",
    hint: "Facoltativo: scegli una finestra di ritiro",
    clear: "Cancella",
    done: "Fatto",
    flexibleBy: "Finestra di ritiro · {days}",
    previousMonth: "Mese precedente",
    nextMonth: "Mese successivo",
  },

  lastCall: {
    badge: "Ultimo minuto",
    body: "{count} possono ritirare entro 24 ore.",
    cta: "Trovali",
    dismiss: "Chiudi",
  },

  quote: {
    steps: {
      home: "Carico",
      services: "Aiuto",
      contact: "Contatti",
    },
    headings: {
      home: "Cosa trasportiamo?",
      services: "Quanto aiuto serve?",
      contact: "Dove devono contattarti?",
    },
    swapDirection: "Inverti la direzione",
    fineTuneVolume: "Regola il volume",
    volumeAria: "Volume in metri cubi",
    approxBoxes: "≈ {boxes}",
    accessPickup: "Accesso al ritiro",
    accessDelivery: "Accesso alla consegna",
    parkAtDoor: "Il camion può parcheggiare davanti alla porta",
    moveDate: "Data di ritiro",
    howFlexible: "Quanto sei flessibile?",
    peakSeason:
      "Da giugno a settembre è alta stagione. Spostarsi di due settimane in un verso o nell’altro libera molta più capacità.",
    addOns: "Servizi aggiuntivi",
    storageLegend: "Deposito",
    storageAria: "Settimane di deposito",
    specialistLegend: "Qualcosa di particolare?",
    preferredChannel: "Canale preferito",
    name: "Nome",
    namePlaceholder: "Elif Yılmaz",
    email: "E-mail",
    emailPlaceholder: "tu@esempio.it",
    phone: "Telefono",
    phonePlaceholder: "+39 320 000 0000",
    notes: "Altro da segnalare?",
    notesPlaceholder: "Strada stretta, a destinazione non c’è ascensore…",
    consent:
      "Condividi la mia richiesta con i trasportatori idonei. I tuoi dati non vanno da nessun’altra parte.",
    matching: "Abbinamento in corso…",
    findMovers: "Trova i miei trasportatori",
    moversMatch: "{count} idonei",
    sendFailed: "Non è stato possibile inviare la richiesta",
    somethingWrong: "Qualcosa è andato storto",
    matchCount: {
      legend: "Quanti trasportatori dobbiamo contattare?",
      hint: "La tua richiesta arriva solo ai trasportatori che scegli.",
      two: "2 trasportatori",
      twoHint: "I due abbinamenti migliori",
      five: "5 trasportatori",
      fiveHint: "Una rosa equilibrata",
      all: "Tutti i trasportatori",
      allHint: "Ogni abbinamento sulla tua tratta",
      recommended: "Consigliato",
    },
    extras: {
      packing: "Imballaggio",
      unpacking: "Disimballaggio",
      dismantling: "Smontaggio e rimontaggio mobili",
      insurance: "Assicurazione trasporto",
      customsClearance: "Dogana gestita per me",
      cleaning: "Pulizia di fine locazione",
    },
  },

  verify: {
    verifyAction: "Verifica",
    verified: "Verificato",
    sending: "Invio in corso…",
    checking: "Controllo in corso…",
    codeSentEmail: "Abbiamo inviato un codice di 6 cifre a {target}.",
    codeSentPhone: "Abbiamo inviato un codice di 6 cifre via SMS al {target}.",
    codeLabel: "Codice di verifica",
    digitLabel: "Cifra {n}",
    demoHint: "Codice demo: {code}",
    resend: "Invia di nuovo il codice",
    resendIn: "Nuovo invio tra {seconds} s",
    wrongCode: "Questo codice non corrisponde. {attempts} rimasti.",
    locked: "Troppi tentativi. Richiedi un nuovo codice.",
    emailNeedsVerifying: "Verifica la tua e-mail per continuare",
    phoneNeedsVerifying: "Verifica il tuo telefono per continuare",
    demoNote:
      "In questa demo la verifica è simulata: non viene inviata nessuna e-mail né alcun SMS.",
  },

  results: {
    expiredTitle: "Questa ricerca è scaduta",
    expiredBody:
      "I link restano attivi per 30 giorni. Ricomincia e rifacciamo l’abbinamento in pochi secondi.",
    unreadableTitle: "Non abbiamo potuto leggere questa ricerca",
    unreadableBody: "Ricomincia e ricostruiremo i tuoi abbinamenti in pochi secondi.",
    noFiltersTitle: "Nessun risultato con questi filtri",
    noFiltersBody: "Togli un requisito: su questa tratta ci sono ancora trasportatori.",
    clearFilters: "Cancella i filtri",
    sortAria: "Ordina",
    filtersTitle: "Filtri",
    networkError: "Non siamo riusciti a raggiungere la rete dei partner.",
    searchFailed: "Ricerca non riuscita",
    openingSearch: "Apertura della tua ricerca",
    oneMoment: "Un attimo",
    canTakeThis: "trasportatori possono prenderlo in carico",
    matchedIn: "Abbinati in {seconds} s · ti contatteranno loro",
    complete: "Richiesta inviata",
    rankingNote:
      "Classifica indipendente. I trasportatori ci pagano una quota fissa o una piccola commissione per contatto con un tetto massimo — mai una provvigione — quindi nessuno può comprarsi una posizione più alta.",
    sort: {
      best: "Miglior abbinamento",
    },
    stages: {
      secure: { label: "Stiamo mettendo in sicurezza la richiesta", detail: "Cifrata e verificata" },
      corridor: {
        label: "Apertura del corridoio {from} → {to}",
        detailCore: "{corridor} · di norma {days}",
        detailExtended: "Instradamento sulla rete estesa via {corridor}",
      },
      partners: {
        label: "Interrogazione di {count} trasportatori partner",
        detail: "Operatori autorizzati in {from} e {to}",
      },
      capacity: {
        label: "Conferma della capacità dei mezzi",
        detail: "Verifica delle squadre libere intorno al {date}",
      },
      route: {
        label: "Verifica della capacità sulla tratta",
        detail: "Slot dei traghetti, valichi di frontiera e squadre",
      },
      ranking: {
        label: "Classifica dei tuoi abbinamenti",
        detail: "Copertura, velocità, affidabilità e recensioni",
      },
    },
  },

  filters: {
    searching: "Ricerca in corso…",
    ofTotal: "{shown} di {total}",
    instantOnly: "Solo abbinamento immediato",
    mode: "Modalità",
    rating: "Valutazione",
    mustOffer: "Deve offrire",
    ratingPlus: "{rating}+",
    services: {
      packing: "Imballaggio",
      storage: "Deposito",
      customs: "Dogana",
      vehicle: "Veicoli",
      piano: "Pianoforte",
      cleaning: "Pulizia",
    },
  },

  moverCard: {
    bestMatch: "Miglior abbinamento",
    fastest: "Più rapido",
    instantMatch: "Abbinamento immediato",
    since: "dal {year}",
    transit: "Transito",
    collection: "Ritiro",
    delivery: "Consegna",
    onTime: "{pct} puntuale",
    repliesIn: "Risponde in {time}",
    co2: "{amount} kg CO₂e",
    requestSent: "Richiesta inviata",
    willReply: "{promise} — entro {time}.",
    manualPickup: "Prende le richieste manualmente: di norma risponde lo stesso giorno.",
    channels: {
      whatsapp: {
        label: "WhatsApp",
        done: "Ti scriveranno su WhatsApp",
      },
      phone: { label: "Chiamata", done: "Ti chiameranno" },
      email: { label: "E-mail", done: "Ti scriveranno un’e-mail" },
    },
  },

  moverProfile: {
    notFound: "Trasportatore non trovato",
    metaTitle: "{name} — recensioni e corridoi",
    established: "Fondata nel {year}",
    completedMoves: "{count} carichi consegnati",
    instantMatch: "Abbinamento immediato",
    sameDay: "Risponde lo stesso giorno",
    instantBody: "Conferma la disponibilità appena la tua ricerca parte.",
    manualBody: "Prende le richieste a mano, poi si fa sentire.",
    repliesIn: "risponde in {time}",
    blurbNote: "Descrizione del partner riportata così come fornita.",
    statOnTime: "Consegne puntuali",
    statClaims: "Tasso di sinistri",
    statTrucks: "Camion di proprietà",
    statCrew: "Personale",
    statCover: "Copertura",
    statCoverValue: "Pieno valore di rimpiazzo",
    statCancellation: "Cancellazione gratuita",
    corridorsTitle: "Corridoi che servono",
    corridorTypical: "di norma {days}",
    extendedNetwork: "Copre {regions} tramite la rete estesa.",
    reviewsTitle: "Recensioni",
    servicesTitle: "Servizi",
    languagesTitle: "Lingue e regioni",
    billingTitle: "Come viene fatturato questo partner",
    billingPro:
      "{name} è su Pro Illimitato: {pro} fissi al mese per ogni richiesta sulla rete. Paga la stessa cifra sia che tu lo scelga o no.",
    billingPpl:
      "{name} è su Pagamento per contatto: paga fino a {cap} per sbloccare una richiesta che gli interessa. In entrambi i casi senza provvigioni.",
    services: {
      packing: "Imballaggio professionale",
      storage: "Deposito doganale",
      customs: "Sdoganamento interno",
      vehicle: "Trasporto auto e moto",
      piano: "Trasporto pianoforti e opere d’arte",
      cleaning: "Pulizia di fine locazione",
    },
  },

  login: {
    title: "Accesso partner",
    lede: "Gestisci la bacheca richieste, sblocca le richieste e tieni d’occhio il tuo piano.",
    email: "E-mail aziendale",
    password: "Password",
    submit: "Accedi",
    signingIn: "Accesso in corso…",
    demoTitle: "Account dimostrativo",
    demoBody: "Questa è una demo: funzionano solo queste credenziali.",
    demoFill: "Usa le credenziali demo",
    error: "Queste credenziali non corrispondono all’account dimostrativo.",
    notPartner: "Non sei ancora partner?",
    seePlans: "Guarda i piani partner",
    signOut: "Esci",
  },

  notFound: {
    eyebrow: "404 · tratta inesistente",
    title: "Questo corridoio non è in bacheca.",
    body: "La pagina è stata spostata, o non è mai esistita.",
  },

  enums: {
    propertySize: {
      few_items: { label: "Pochi pezzi", hint: "Scatoloni, un letto, nessun set di mobili" },
      studio: { label: "Monolocale", hint: "Casa di circa 45 m²" },
      one_bed: { label: "1 camera / bilocale", hint: "Casa di circa 65 m²" },
      two_bed: { label: "2 camere / trilocale", hint: "Casa di circa 95 m²" },
      three_bed: { label: "3 camere / quadrilocale", hint: "Casa di circa 130 m²" },
      four_bed: { label: "4 o più camere", hint: "Casa di circa 170 m²" },
      villa: { label: "Villa / indipendente", hint: "Da 220 m² in su" },
      office: { label: "Ufficio / merce commerciale", hint: "Scrivanie, IT, archivio, pallet" },
    },
    access: {
      ground: { label: "Piano terra", hint: "Nessuna scala" },
      lift: { label: "Ascensore disponibile", hint: "Montacarichi o ascensore" },
      stairs_1_2: { label: "Scale, 1–2 piani", hint: "Senza ascensore" },
      stairs_3_plus: { label: "Scale, 3 o più piani", hint: "Senza ascensore, piano alto" },
    },
    flexibility: {
      exact: "Esattamente quella data",
      plus_minus_3: "Entro 3 giorni",
      within_2_weeks: "Entro 2 settimane",
      flexible: "Completamente flessibile",
    },
    serviceLevel: {
      full_service: {
        label: "Servizio completo",
        hint: "Imballano, caricano, trasportano e disimballano.",
      },
      door_to_door: {
        label: "Porta a porta",
        hint: "Gli scatoloni li fai tu, al resto pensano loro.",
      },
      transport_only: { label: "Solo trasporto", hint: "Tutto è pronto per il ritiro." },
    },
    specialItems: {
      piano: "Pianoforte",
      vehicle: "Auto o moto",
      artwork: "Opere d’arte o antiquariato",
      safe: "Cassaforte oltre 100 kg",
      gym: "Attrezzatura da palestra",
      plants: "Piante grandi",
    },
    moveType: {
      international: "Internazionale",
      domestic: "Nazionale",
    },
    modes: {
      road: { label: "Strada", hint: "Camion porta a porta, senza trasbordo" },
      sea: { label: "Mare", hint: "Container LCL — il più economico sulle lunghe distanze" },
      air: { label: "Aereo", hint: "Il più rapido, ideale per spedizioni piccole" },
      rail: { label: "Ferrovia", hint: "Treno completo — basse emissioni, orari fissi" },
    },
    badges: {
      instant_quote: {
        label: "Abbinamento immediato",
        hint: "Partner Pro Illimitato: conferma subito la disponibilità.",
      },
      top_rated: {
        label: "Più votati",
        hint: "Valutazione 4,6 o superiore su almeno 500 recensioni verificate.",
      },
      fast_responder: {
        label: "Risponde rapidamente",
        hint: "Prima risposta mediana sotto i 20 minuti.",
      },
      best_value: {
        label: "Miglior rapporto qualità-prezzo",
        hint: "Prezzi costantemente sotto la mediana del corridoio.",
      },
      eco_fleet: { label: "Basse emissioni", hint: "HVO, elettrico o priorità alla ferrovia." },
      customs_expert: { label: "Esperto di dogana", hint: "Sdoganamento interno su questo corridoio." },
      fragile_specialist: {
        label: "Specialista del fragile",
        hint: "Casse su misura per opere d’arte, antiquariato e strumenti.",
      },
    },
    regions: {
      TR: "Turchia",
      EU_WEST: "Europa occidentale",
      EU_SOUTH: "Europa meridionale",
      BALKANS: "Balcani",
      NORDICS: "Scandinavia e paesi nordici",
      CIS: "CSI e Caucaso",
      CENTRAL_ASIA: "Asia centrale",
      MIDDLE_EAST: "Medio Oriente",
    },
    corridors: {
      "tr-eu-west": "Turchia → Germania, Benelux e Francia",
      "eu-west-tr": "Europa occidentale → Turchia",
      "tr-eu-south": "Turchia → Italia, Spagna e Grecia",
      "eu-south-tr": "Europa meridionale → Turchia",
      "tr-nordics": "Turchia → Scandinavia",
      "nordics-tr": "Scandinavia → Turchia",
      "tr-balkans": "Turchia → Balcani",
      "balkans-tr": "Balcani → Turchia",
      "tr-middle-east": "Turchia → Golfo e Levante",
      "middle-east-tr": "Medio Oriente → Turchia",
      "tr-cis": "Turchia → Russia e Caucaso",
      "cis-tr": "Russia e Caucaso → Turchia",
      "tr-central-asia": "Turchia → Asia centrale",
      "central-asia-tr": "Asia centrale → Turchia",
      "eu-central-asia": "Europa → Asia centrale (via Corridoio centrale)",
      "central-asia-eu": "Asia centrale → Europa",
      "me-eu": "Golfo → Europa",
      "eu-me": "Europa → Golfo",
      "tr-domestic": "Turchia nazionale",
    },
    corridorFallback: {
      domestic: "{region} nazionale",
      extended: "{from} → {to}",
    },
  },

  meta: {
    titleDefault: "Rotamove — il trasportatore giusto per ogni carico",
    titleTemplate: "%s · Rotamove",
    description:
      "Una sola ricerca. Trasportatori verificati per traslochi e merce commerciale in Turchia, Europa, Balcani, Scandinavia, CSI, Asia centrale e Medio Oriente.",
    ogTitle: "Confronta trasportatori verificati in 53 paesi",
    ogDescription:
      "Dicci dove deve andare il tuo carico. Ti mettiamo in contatto con fornitori di trasporto verificati che si fanno avanti loro.",
    keywords: [
      "trasportatori merci",
      "trasloco internazionale",
      "trasporto Turchia Europa",
      "uluslararası nakliyat",
      "preventivo merce commerciale",
      "logistica Asia centrale",
    ],
    quoteTitle: "Parlaci del tuo carico",
    quoteDescription:
      "Descrivi il tuo carico una volta sola. I trasportatori verificati ti contattano sul canale che scegli.",
    resultsTitle: "I tuoi trasportatori abbinati",
    resultsDescription: "Trasportatori verificati per un carico di {volume}.",
    coverageTitle: "Copertura dei corridoi — 53 paesi, 19 tratte attive",
    coverageDescription:
      "Tutti i corridoi offerti da Rotamove: dalla Turchia verso e da Europa occidentale e meridionale, Balcani, Scandinavia, CSI, Asia centrale e Medio Oriente.",
    howItWorksTitle: "Come funziona",
    howItWorksDescription:
      "Come Rotamove ti abbina ai trasportatori, come è pesato il ranking e cosa deve dimostrare ogni partner.",
    partnersTitle: "Per i trasportatori — 100 $/mese illimitato, o fino a 7 $ per contatto",
    partnersDescription:
      "Entra nella rete di partner Rotamove. Richieste illimitate con una quota mensile fissa, oppure pagamento per contatto con tetto massimo di 7 $.",
  },
} satisfies Dictionary;

export default it;
