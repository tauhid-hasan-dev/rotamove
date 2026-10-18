import type { Dictionary } from "@/i18n/dictionaries";

/** Français. */
export const fr = {
  units: {
    days: { one: "{n} jour", other: "{n} jours" },
    weeks: { one: "{n} semaine", other: "{n} semaines" },
    monthsAgo: { one: "il y a {n} mois", other: "il y a {n} mois" },
    movers: { one: "{n} transporteur", other: "{n} transporteurs" },
    countries: { one: "{n} pays", other: "{n} pays" },
    cities: { one: "{n} ville", other: "{n} villes" },
    boxes: { one: "{n} carton", other: "{n} cartons" },
    attempts: { one: "{n} tentative", other: "{n} tentatives" },
    minutesShort: "{n} min",
    hoursShort: "{n} h",
    daysShort: "{n} j",
    perMonth: "{n}/mois",
    cubicMetres: "{n} m³",
    none: "Aucun",
  },

  common: {
    skipToContent: "Aller au contenu",
    search: "Rechercher",
    continue: "Continuer",
    back: "Retour",
    change: "Modifier",
    edit: "Modifier",
    reset: "Réinitialiser",
    undo: "Annuler",
    tryAgain: "Réessayer",
    optional: "(facultatif)",
    any: "Tous",
    free: "Gratuit · sans compte · sans démarchage",
    appearance: "Apparence",
    toggleTheme: "Basculer entre le mode clair et sombre",
    openMenu: "Ouvrir le menu",
    startSearch: "Lancer une recherche",
    newSearch: "Nouvelle recherche",
    startAgain: "Recommencer",
    searchAnyRoute: "Rechercher n’importe quel trajet",
    allCorridors: "Tous les corridors",
    browseCorridors: "Parcourir les corridors",
    partnerLogin: "Espace partenaire",
    ratingLabel: "{rating} sur 5",
    ratingLabelWithCount: "{rating} sur 5 d’après {count} avis",
    verifiedBooking: "réservation vérifiée",
  },

  language: {
    label: "Langue",
    choose: "Choisir une langue",
  },

  nav: {
    howItWorks: "Comment ça marche",
    coverage: "Couverture",
    forMovers: "Pour les transporteurs",
    main: "Navigation principale",
    mobile: "Navigation mobile",
    home: "Accueil Rotamove",
  },

  footer: {
    blurb:
      "Des transporteurs vérifiés en Turquie, en Europe, dans les Balkans, en Scandinavie, dans la CEI, en Asie centrale et au Moyen-Orient.",
    move: "Transport",
    movers: "Transporteurs",
    company: "Société",
    partnerPricing: "Tarifs partenaires",
    dashboardDemo: "Démo du tableau de bord",
    partnerFaq: "FAQ partenaires",
    about: "À propos",
    trust: "Confiance et vérification",
    contact: "Contact",
    rights: "Rotamove · produit de démonstration",
    privacy: "KVKK et RGPD",
    terms: "Conditions",
    offices: "Istanbul · Berlin · Tachkent",
  },

  hero: {
    eyebrow: "Turquie · Europe · Asie centrale · Golfe",
    title: "Trouvez le bon transporteur pour chaque chargement.",
    subtitle:
      "Du déménagement de particuliers au fret commercial, trouvez le prestataire de transport adapté à chaque chargement.",
  },

  scene: {
    alt: "Un camion et deux fourgons roulant du point de chargement au point de livraison.",
    origin: "Enlèvement",
    originHint: "Partout où vous chargez",
    destination: "Livraison",
    destinationHint: "Partout où vous déchargez",
    inTransit: "Porte-à-porte",
  },

  trust: {
    label: "Uniquement des partenaires accrédités",
  },

  how: {
    title: "Trois étapes. Sans jouer au téléphone.",
    steps: [
      { title: "Rechercher", body: "Un seul champ. D’où, vers où." },
      { title: "Associer", body: "Nous trouvons les transporteurs qui font vraiment votre trajet." },
      { title: "Transporter", body: "WhatsApp, appel ou e-mail : ce sont eux qui vous contactent." },
    ],
  },

  testimonials: {
    title: "24 800 chargements transportés, et ça continue.",
    items: [
      {
        quote:
          "Quatre transporteurs m’ont écrit sur WhatsApp le même après-midi. J’avais choisi avant le soir.",
        name: "Aylin K.",
        route: "Istanbul → Berlin",
      },
      {
        quote:
          "Ils ont trouvé des opérateurs qui font réellement la traversée de la Caspienne. Personne d’autre n’y arrivait.",
        name: "Rustam A.",
        route: "Tachkent → Istanbul",
      },
      {
        quote:
          "Pas de formulaires, pas de spam. Une recherche et les bonnes personnes m’ont contactée.",
        name: "Jonas R.",
        route: "Stockholm → Izmir",
      },
    ],
  },

  partnerTeaser: {
    eyebrow: "Pour les entreprises de transport",
    title: "Achetez de la demande, pas des numéros de téléphone.",
    body: "Forfait mensuel, ou paiement à la demande avec un plafond strict. Rien d’autre.",
    pricingCta: "Tarifs partenaires",
    demoCta: "Voir la démo",
    proBody: "Toutes les demandes, en illimité. Placement instantané dans la recherche.",
    proUnit: "/ mois",
    pplBody: "Sans abonnement. Jamais plus de {cap}.",
    pplUnit: "/ demande",
  },

  faq: {
    title: "Questions",
    items: [
      {
        q: "Est-ce gratuit ?",
        a: "Oui, toujours. Les transporteurs nous versent un forfait mensuel ou une petite commission plafonnée par demande — jamais de commission sur votre chargement, donc personne ne peut payer pour être mieux placé.",
      },
      {
        q: "Vais-je recevoir des appels indésirables ?",
        a: "Non. Vous choisissez le canal — WhatsApp, appel ou e-mail — et vos coordonnées ne vont qu’aux transporteurs que vous sélectionnez.",
      },
      {
        q: "Quels trajets couvrez-vous ?",
        a: "La Turquie vers et depuis l’Europe, les Balkans, la Scandinavie, la CEI et le Caucase, l’Asie centrale et le Moyen-Orient — ainsi que le transport national dans les 53 pays partenaires.",
      },
      {
        q: "Comment les transporteurs sont-ils vérifiés ?",
        a: "Licence de transport, assurance, historique des sinistres et un dépôt réel, revérifiés chaque année. En cas d’échec, on quitte le réseau.",
      },
      {
        q: "Répondent-ils rapidement ?",
        a: "Les partenaires en correspondance instantanée répondent généralement en quinze minutes. Les autres reviennent le jour même.",
      },
    ],
  },

  ctaBand: {
    title: "Que transportez-vous ?",
  },

  coverageGrid: {
    title: "Conçu pour les trajets que personne d’autre n’assure correctement.",
    regions: "Régions",
  },

  coveragePage: {
    eyebrow: "Réseau",
    title: "La Turquie est la charnière entre l’Europe, le Caucase et le Golfe.",
    lede: "{corridors} corridors, assurés chaque semaine par des partenaires qui les parcourent vraiment.",
    statCountries: "Pays",
    statCities: "Villes-hubs",
    statCorridors: "Corridors actifs",
    statLeads: "Demandes / mois",
    tableEyebrow: "Chaque ligne",
    tableTitle: "Le tableau complet des corridors.",
    tableLede: "Médianes porte-à-porte, mesurées sur les chargements livrés.",
    thCorridor: "Corridor",
    thFrom: "De",
    thTo: "Vers",
    thTransit: "Transit",
    thModes: "Modes",
    thPartners: "Partenaires",
    thDemand: "Demande",
    notListed:
      "Votre trajet n’est pas dans la liste ? Le réseau étendu couvre une quatre-vingt-dizaine d’autres paires de pays grâce aux relais entre partenaires.",
  },

  howItWorksPage: {
    title: "Une place de marché ne fonctionne que si l’on voit comment elle décide.",
    lede: "Voici donc le classement, et la liste de contrôle que chaque transporteur doit passer.",
    steps: [
      { title: "Rechercher", body: "Un seul champ : d’où, vers où." },
      { title: "Associer", body: "Nous interrogeons le réseau. Environ huit secondes." },
      { title: "Transporter", body: "Choisissez le canal. Seuls vos choix vous contactent." },
    ],
    rankingTitle: "Cinq critères. Pondérations publiées.",
    rankingBody:
      "Aucun transporteur ne peut payer pour être mieux placé. Notre commission est identique quel que soit votre choix.",
    ranking: {
      routeFit: "Adéquation au trajet",
      reviewScore: "Note des avis",
      onTime: "Ponctualité",
      transit: "Rapidité de transit",
      response: "Délai de réponse",
    },
    checksTitle: "Ce que les {count} partenaires ont dû prouver.",
    checks: [
      {
        title: "Licence",
        body: "Licence de transport et immatriculation, vérifiées auprès du registre national.",
      },
      { title: "Assurance", body: "CMR en vigueur et couverture transport tous risques." },
      {
        title: "Historique des sinistres",
        body: "Suivi en continu. Au-dessus du seuil, vous quittez le tableau.",
      },
      { title: "Activité réelle", body: "Un dépôt, une flotte, du personnel identifié. Pas de courtiers." },
    ],
    aboutTitle: "Pourquoi des corridors, et non des pays.",
    aboutBody1:
      "Le fret entre la Turquie et l’Europe est l’un des flux les plus denses au monde, et presque rien n’en est consultable en ligne. Les lignes vers la CEI, l’Asie centrale et le Golfe sont encore moins bien desservies : une poignée d’opérateurs les parcourt réellement.",
    aboutBody2:
      "Rotamove choisit un petit nombre de corridors et les approfondit. Moins de trajets, de vrais partenaires, vérifiés chaque année.",
  },

  partnersPage: {
    eyebrow: "Pour les entreprises de transport",
    title: "Achetez de la demande, pas des numéros de téléphone.",
    lede: "{leads} demandes vérifiées par mois sur {corridors} corridors. Deux façons de les acheter.",
    plansNote:
      "Les deux formules incluent la vérification de la licence et de l’assurance, la médiation des litiges et le retrait du tableau si les standards baissent.",
    chooserTitle: "Laquelle vous convient ?",
    feeTitle: "Jamais plus de {cap}. Quel que soit le chargement.",
    whyItems: [
      { title: "Vos lignes uniquement", body: "Filtrez par corridor, volume et date." },
      { title: "Prêt à partir", body: "Trajet, dates et volume déjà renseignés." },
      { title: "Contacts vérifiés", body: "Validés à la réception. Notés de 0 à 100." },
      { title: "Suivi du taux de réussite", body: "Voyez pourquoi vous avez perdu, par corridor." },
      { title: "API et webhooks", body: "Les demandes arrivent directement dans votre TMS." },
      { title: "Sans commission", body: "Nous ne prenons jamais de part sur la mission." },
    ],
    faqTitle: "FAQ partenaires",
    ctaTitle: "Commencez gratuitement. Passez au niveau supérieur quand ça rapporte.",
    ctaBody: "La vérification prend environ deux jours ouvrés.",
    ctaButton: "Ouvrir le tableau de bord de démo",
    ctaNote: "{pro}/mois en illimité · ou {cap} maximum par demande",
  },

  plans: {
    mostChosen: "Le plus choisi",
    proName: "Pro Illimité",
    proSuffix: "/mois",
    proNote: "Facturation mensuelle en USD. Résiliable à tout moment, sans préavis.",
    proCta: "Démarrer l’essai gratuit de 14 jours",
    proFeatures: [
      "Demandes internationales illimitées",
      "Demandes nationales illimitées",
      "Placement en correspondance instantanée dans la recherche",
      "Contact en un geste depuis la liste de résultats",
      "Coordonnées client complètes, non masquées",
      "Moteur de règles de capacité et de saisonnalité",
      "Analyse de la demande par corridor et suivi du taux de réussite",
      "API de demandes et webhooks",
      "Traitement prioritaire des litiges",
      "Jusqu’à 8 comptes opérateurs",
    ],
    pplName: "Paiement à la demande",
    pplSuffix: "/demande",
    pplNote:
      "Plafond strict de {cap} par demande. Vous voyez le prix exact avant de débloquer.",
    pplCta: "Créer un compte partenaire gratuit",
    pplFeatures: [
      "Aucun frais mensuel, aucun minimum",
      "Parcourir l’ensemble du tableau de demandes",
      "Débloquer une demande pour voir les coordonnées",
      "Remboursement sous 24 h si les coordonnées sont invalides",
      "Filtres par corridor et volume",
      "Placement en correspondance instantanée dans la recherche",
      "Contact en un geste depuis la liste de résultats",
      "API de demandes et webhooks",
      "Analyse de la demande par corridor",
      "1 compte opérateur",
    ],
    faq: [
      {
        q: "Qu’est-ce qui compte exactement comme une demande ?",
        a: "Une demande complète avec trajet vérifié, date, volume et coordonnées joignables. Les demandes qui échouent à notre validation n’atteignent jamais le tableau, et ne vous sont jamais facturées.",
      },
      {
        q: "Pro Illimité est-il vraiment illimité ?",
        a: "Oui. {pro} par mois couvrent toutes les demandes internationales et nationales sur tous les corridors, sans plafond ni dépassement. La seule limite, ce sont vos propres réglages de capacité.",
      },
      {
        q: "Pourquoi payer à la demande plutôt ?",
        a: "Si vous concluez moins de {breakEven} demandes par mois, le paiement à la demande est moins cher. La plupart des partenaires commencent ainsi et passent à Pro en moins de deux mois.",
      },
      {
        q: "Une demande peut-elle dépasser le plafond ?",
        a: "Jamais. {cap} est un plafond strict quel que soit le corridor, le volume ou la valeur de la mission, et le prix exact est affiché avant le déblocage.",
      },
      {
        q: "Les partenaires au paiement à la demande apparaissent-ils dans les résultats ?",
        a: "Vous apparaissez dans la liste de résultats, mais signalé comme répondant plus tard plutôt qu’instantanément. Le placement en correspondance instantanée est une fonction Pro Illimité.",
      },
      {
        q: "Et si les coordonnées sont erronées ?",
        a: "Signalez-le sous 24 heures et le crédit de la demande est remboursé automatiquement. Les partenaires Pro ne sont pas concernés, puisqu’il n’y a aucun frais par demande.",
      },
    ],
  },

  planChooser: {
    label: "Demandes que vous prendriez par mois",
    ariaLeads: "Demandes par mois",
    proNote: "forfait, quel que soit le volume",
    pplNote: "≈ {fee} chacune · plafonné à {cap}",
    cheaperFor: "{plan} est moins cher pour vous",
    proWins:
      "de {saving} par mois — et seul Pro vous place dans les résultats instantanés.",
    pplWins: "de {saving} par mois. Pro devient gagnant à partir de {breakEven} demandes.",
    proCta: "Démarrer l’essai Pro",
    pplCta: "Créer un compte gratuit",
  },

  leadFee: {
    eyebrow: "Ce que coûte une demande",
    body: "Le prix à la demande suit la valeur attendue de la mission, pas un tarif fixe — et s’arrête net à {cap}. Modifiez la mission ci-dessous et observez la commission bouger.",
    destination: "Destination depuis Istanbul",
    volume: "Volume du chargement",
    daysOut: "Jours avant l’enlèvement",
    fullService: "Service complet",
    fullServiceHint: "Emballage et déballage inclus",
    storage: "Stockage nécessaire",
    storageHint: "4 semaines sous douane",
    youPay: "Vous paieriez",
    once: "une seule fois",
    floor: "plancher {amount}",
    cap: "plafond {amount}",
    atCap:
      "Cette mission vaut bien plus que {cap} pour celui qui l’emporte — le plafond s’applique quand même.",
    quality: "Score de qualité de la demande",
    qualityValue: "{score} / 100",
    moveType: "Type de chargement",
    refundWindow: "Délai de remboursement",
    refundValue: "24 heures",
    costOnPro: "Coût avec Pro Illimité",
    costOnProValue: "{amount} — inclus",
    footnote:
      "Les partenaires Pro Illimité ne paient rien par demande, quel que soit ce chiffre. C’est tout l’arbitrage : {pro} par mois achètent le droit de ne plus y penser.",
  },

  search: {
    fromLabel: "De",
    toLabel: "Vers",
    fromPlaceholder: "Départ ?",
    toPlaceholder: "Destination ?",
    swap: "Inverser le départ et la destination",
    popular: "Populaires",
    noMatch: "Aucun résultat pour « {query} »",
  },

  quote: {
    steps: {
      home: "Chargement",
      timing: "Date",
      services: "Aide",
      contact: "Contact",
    },
    headings: {
      home: "Que transportons-nous ?",
      timing: "Quand ?",
      services: "Quel niveau d’aide ?",
      contact: "Où doivent-ils vous joindre ?",
    },
    swapDirection: "Inverser le sens",
    fineTuneVolume: "Ajuster le volume",
    volumeAria: "Volume en mètres cubes",
    approxBoxes: "≈ {boxes}",
    accessPickup: "Accès à l’enlèvement",
    accessDelivery: "Accès à la livraison",
    parkAtDoor: "Le camion peut stationner devant la porte",
    moveDate: "Date d’enlèvement",
    howFlexible: "Quelle flexibilité ?",
    peakSeason:
      "De juin à septembre, c’est la haute saison. Décaler de quinze jours libère beaucoup plus de capacité.",
    addOns: "Options",
    storageLegend: "Stockage",
    storageAria: "Semaines de stockage",
    specialistLegend: "Quelque chose de particulier ?",
    preferredChannel: "Canal préféré",
    name: "Nom",
    namePlaceholder: "Elif Yılmaz",
    email: "E-mail",
    emailPlaceholder: "vous@exemple.fr",
    phone: "Téléphone",
    phonePlaceholder: "+33 6 00 00 00 00",
    notes: "Autre chose ?",
    notesPlaceholder: "Rue étroite, pas d’ascenseur à l’arrivée…",
    consent:
      "Partager ma demande avec les transporteurs correspondants. Vos coordonnées ne vont nulle part ailleurs.",
    matching: "Mise en correspondance…",
    findMovers: "Trouver mes transporteurs",
    moversMatch: "{count} correspondance",
    sendFailed: "Impossible d’envoyer votre demande",
    somethingWrong: "Une erreur est survenue",
    matchCount: {
      legend: "Combien de transporteurs devons-nous contacter ?",
      hint: "Votre demande ne part qu’aux transporteurs que vous choisissez.",
      two: "2 transporteurs",
      twoHint: "Les deux meilleures correspondances",
      five: "5 transporteurs",
      fiveHint: "Une sélection équilibrée",
      all: "Tous les transporteurs",
      allHint: "Toutes les correspondances de votre trajet",
      recommended: "Recommandé",
    },
    extras: {
      packing: "Emballage",
      unpacking: "Déballage",
      dismantling: "Démontage et remontage des meubles",
      insurance: "Assurance transport",
      customsClearance: "Douane prise en charge pour moi",
      cleaning: "Nettoyage de fin de bail",
    },
  },

  verify: {
    verifyAction: "Vérifier",
    verified: "Vérifié",
    sending: "Envoi…",
    checking: "Vérification…",
    codeSentEmail: "Nous avons envoyé un code à 6 chiffres à {target}.",
    codeSentPhone: "Nous avons envoyé un code à 6 chiffres par SMS au {target}.",
    codeLabel: "Code de vérification",
    digitLabel: "Chiffre {n}",
    demoHint: "Code de démo : {code}",
    resend: "Renvoyer le code",
    resendIn: "Renvoyer dans {seconds} s",
    wrongCode: "Ce code ne correspond pas. {attempts} restante(s).",
    locked: "Trop de tentatives. Demandez un nouveau code.",
    emailNeedsVerifying: "Vérifiez votre e-mail pour continuer",
    phoneNeedsVerifying: "Vérifiez votre téléphone pour continuer",
    demoNote:
      "La vérification est simulée dans cette démo — aucun e-mail ni SMS n’est réellement envoyé.",
  },

  results: {
    expiredTitle: "Cette recherche a expiré",
    expiredBody:
      "Les liens restent actifs 30 jours. Recommencez et nous réassocierons en quelques secondes.",
    unreadableTitle: "Nous n’avons pas pu lire cette recherche",
    unreadableBody:
      "Recommencez et nous reconstruirons vos correspondances en quelques secondes.",
    noFiltersTitle: "Aucun résultat pour ces filtres",
    noFiltersBody: "Retirez un critère — il reste des transporteurs sur ce trajet.",
    clearFilters: "Effacer les filtres",
    sortAria: "Trier",
    filtersTitle: "Filtres",
    networkError: "Nous n’avons pas pu joindre le réseau de partenaires.",
    searchFailed: "Échec de la recherche",
    openingSearch: "Ouverture de votre recherche",
    oneMoment: "Un instant",
    canTakeThis: "transporteurs peuvent prendre ce chargement",
    matchedIn: "Associé en {seconds} s · ils vont vous contacter",
    complete: "Demande envoyée",
    rankingNote:
      "Classement indépendant. Les transporteurs nous versent un forfait ou une petite commission plafonnée par demande — jamais de commission sur la mission — donc personne ne peut acheter une meilleure position.",
    sort: {
      best: "Meilleure correspondance",
    },
    stages: {
      secure: { label: "Sécurisation de votre demande", detail: "Chiffrée et vérifiée" },
      corridor: {
        label: "Ouverture du corridor {from} → {to}",
        detailCore: "{corridor} · {days} en général",
        detailExtended: "Acheminement via le réseau étendu par {corridor}",
      },
      partners: {
        label: "Interrogation de {count} transporteurs partenaires",
        detail: "Opérateurs agréés en {from} et {to}",
      },
      capacity: {
        label: "Confirmation de la capacité des véhicules",
        detail: "Recherche d’équipes disponibles autour du {date}",
      },
      route: {
        label: "Vérification de la capacité sur le trajet",
        detail: "Créneaux de ferry, passages de frontière et équipes",
      },
      ranking: {
        label: "Classement de vos correspondances",
        detail: "Couverture, rapidité, fiabilité et avis",
      },
    },
  },

  filters: {
    searching: "Recherche…",
    ofTotal: "{shown} sur {total}",
    instantOnly: "Correspondance instantanée uniquement",
    mode: "Mode",
    rating: "Note",
    mustOffer: "Doit proposer",
    ratingPlus: "{rating}+",
    services: {
      packing: "Emballage",
      storage: "Stockage",
      customs: "Douane",
      vehicle: "Véhicules",
      piano: "Piano",
      cleaning: "Nettoyage",
    },
  },

  moverCard: {
    bestMatch: "Meilleure correspondance",
    fastest: "Le plus rapide",
    instantMatch: "Correspondance instantanée",
    since: "depuis {year}",
    transit: "Transit",
    collection: "Enlèvement",
    delivery: "Livraison",
    onTime: "{pct} à l’heure",
    repliesIn: "Répond en {time}",
    co2: "{amount} kg éq. CO₂",
    requestSent: "Demande envoyée",
    willReply: "{promise} — sous {time}.",
    manualPickup: "Traite les demandes manuellement — répond généralement le jour même.",
    channels: {
      whatsapp: {
        label: "WhatsApp",
        done: "Ils vous écriront sur WhatsApp",
      },
      phone: { label: "Appel", done: "Ils vous appelleront" },
      email: { label: "E-mail", done: "Ils vous écriront par e-mail" },
    },
  },

  moverProfile: {
    notFound: "Transporteur introuvable",
    metaTitle: "{name} — avis et corridors",
    established: "Créé en {year}",
    completedMoves: "{count} chargements livrés",
    instantMatch: "Correspondance instantanée",
    sameDay: "Répond le jour même",
    instantBody: "Confirme sa disponibilité dès que votre recherche s’exécute.",
    manualBody: "Traite les demandes à la main, puis prend contact.",
    repliesIn: "répond en {time}",
    blurbNote: "Description du partenaire reproduite telle que fournie.",
    statOnTime: "Livraison à l’heure",
    statClaims: "Taux de sinistres",
    statTrucks: "Camions en propre",
    statCrew: "Équipes",
    statCover: "Couverture",
    statCoverValue: "Valeur de remplacement intégrale",
    statCancellation: "Annulation gratuite",
    corridorsTitle: "Corridors qu’ils assurent",
    corridorTypical: "{days} en général",
    extendedNetwork: "Couvre {regions} via le réseau étendu.",
    reviewsTitle: "Avis",
    servicesTitle: "Services",
    languagesTitle: "Langues et régions",
    billingTitle: "Comment ce partenaire est facturé",
    billingPro:
      "{name} est en Pro Illimité — un forfait de {pro} par mois pour toutes les demandes du réseau. Le transporteur paie la même chose, que vous le choisissiez ou non.",
    billingPpl:
      "{name} est en Paiement à la demande — jusqu’à {cap} pour débloquer une demande qui l’intéresse. Sans commission dans les deux cas.",
    services: {
      packing: "Emballage professionnel",
      storage: "Stockage sous douane",
      customs: "Dédouanement en interne",
      vehicle: "Transport de voitures et motos",
      piano: "Transport de pianos et d’œuvres d’art",
      cleaning: "Nettoyage de fin de bail",
    },
  },

  login: {
    title: "Connexion partenaire",
    lede: "Gérez votre tableau de demandes, débloquez des enquêtes et suivez votre formule.",
    email: "E-mail professionnel",
    password: "Mot de passe",
    submit: "Se connecter",
    signingIn: "Connexion…",
    demoTitle: "Compte de démonstration",
    demoBody: "Ceci est une démo — seuls ces identifiants fonctionnent.",
    demoFill: "Utiliser les identifiants de démo",
    error: "Ces identifiants ne correspondent pas au compte de démonstration.",
    notPartner: "Pas encore partenaire ?",
    seePlans: "Voir les formules partenaires",
    signOut: "Se déconnecter",
  },

  notFound: {
    eyebrow: "404 · trajet inexistant",
    title: "Ce corridor n’est pas au tableau.",
    body: "La page a été déplacée, ou n’a jamais existé.",
  },

  enums: {
    propertySize: {
      few_items: { label: "Quelques objets", hint: "Cartons, un lit, pas de mobilier complet" },
      studio: { label: "Studio / 1 pièce", hint: "Logement d’environ 45 m²" },
      one_bed: { label: "1 chambre / 2 pièces", hint: "Logement d’environ 65 m²" },
      two_bed: { label: "2 chambres / 3 pièces", hint: "Logement d’environ 95 m²" },
      three_bed: { label: "3 chambres / 4 pièces", hint: "Logement d’environ 130 m²" },
      four_bed: { label: "4 chambres ou plus", hint: "Logement d’environ 170 m²" },
      villa: { label: "Villa / maison individuelle", hint: "À partir de 220 m²" },
      office: { label: "Bureau / fret commercial", hint: "Bureaux, informatique, archives, palettes" },
    },
    access: {
      ground: { label: "Rez-de-chaussée", hint: "Aucun escalier" },
      lift: { label: "Ascenseur disponible", hint: "Ascenseur de charge ou de personnes" },
      stairs_1_2: { label: "Escalier, 1 à 2 étages", hint: "Pas d’ascenseur" },
      stairs_3_plus: { label: "Escalier, 3 étages ou plus", hint: "Pas d’ascenseur, étage élevé" },
    },
    flexibility: {
      exact: "À cette date exactement",
      plus_minus_3: "Sous 3 jours",
      within_2_weeks: "Sous 2 semaines",
      flexible: "Totalement flexible",
    },
    serviceLevel: {
      full_service: {
        label: "Service complet",
        hint: "Ils emballent, chargent, transportent et déballent.",
      },
      door_to_door: {
        label: "Porte-à-porte",
        hint: "Vous faites les cartons, ils s’occupent du reste.",
      },
      transport_only: { label: "Transport seul", hint: "Tout est prêt à être enlevé." },
    },
    specialItems: {
      piano: "Piano",
      vehicle: "Voiture ou moto",
      artwork: "Œuvres d’art ou antiquités",
      safe: "Coffre-fort de plus de 100 kg",
      gym: "Équipement de sport",
      plants: "Grandes plantes",
    },
    moveType: {
      international: "International",
      domestic: "National",
    },
    modes: {
      road: { label: "Route", hint: "Camion porte-à-porte, sans transbordement" },
      sea: { label: "Mer", hint: "Conteneur LCL — le plus économique sur longue distance" },
      air: { label: "Air", hint: "Le plus rapide, idéal pour les petits envois" },
      rail: { label: "Rail", hint: "Train entier — faibles émissions, horaires fixes" },
    },
    badges: {
      instant_quote: {
        label: "Correspondance instantanée",
        hint: "Partenaire Pro Illimité — confirme sa disponibilité immédiatement.",
      },
      top_rated: {
        label: "Les mieux notés",
        hint: "Note de 4,6 ou plus sur au moins 500 avis vérifiés.",
      },
      fast_responder: {
        label: "Réponse rapide",
        hint: "Première réponse médiane en moins de 20 minutes.",
      },
      best_value: {
        label: "Meilleur rapport qualité-prix",
        hint: "Tarifs systématiquement sous la médiane du corridor.",
      },
      eco_fleet: { label: "Faibles émissions", hint: "HVO, électrique ou priorité au rail." },
      customs_expert: { label: "Expert en douane", hint: "Dédouanement interne sur ce corridor." },
      fragile_specialist: {
        label: "Spécialiste du fragile",
        hint: "Caisses sur mesure pour œuvres d’art, antiquités et instruments.",
      },
    },
    regions: {
      TR: "Turquie",
      EU_WEST: "Europe de l’Ouest",
      EU_SOUTH: "Europe du Sud",
      BALKANS: "Balkans",
      NORDICS: "Scandinavie et pays nordiques",
      CIS: "CEI et Caucase",
      CENTRAL_ASIA: "Asie centrale",
      MIDDLE_EAST: "Moyen-Orient",
    },
    corridors: {
      "tr-eu-west": "Turquie → Allemagne, Benelux et France",
      "eu-west-tr": "Europe de l’Ouest → Turquie",
      "tr-eu-south": "Turquie → Italie, Espagne et Grèce",
      "eu-south-tr": "Europe du Sud → Turquie",
      "tr-nordics": "Turquie → Scandinavie",
      "nordics-tr": "Scandinavie → Turquie",
      "tr-balkans": "Turquie → Balkans",
      "balkans-tr": "Balkans → Turquie",
      "tr-middle-east": "Turquie → Golfe et Levant",
      "middle-east-tr": "Moyen-Orient → Turquie",
      "tr-cis": "Turquie → Russie et Caucase",
      "cis-tr": "Russie et Caucase → Turquie",
      "tr-central-asia": "Turquie → Asie centrale",
      "central-asia-tr": "Asie centrale → Turquie",
      "eu-central-asia": "Europe → Asie centrale (via le Corridor médian)",
      "central-asia-eu": "Asie centrale → Europe",
      "me-eu": "Golfe → Europe",
      "eu-me": "Europe → Golfe",
      "tr-domestic": "National Turquie",
    },
    corridorFallback: {
      domestic: "National {region}",
      extended: "{from} → {to}",
    },
  },

  meta: {
    titleDefault: "Rotamove — le bon transporteur pour chaque chargement",
    titleTemplate: "%s · Rotamove",
    description:
      "Une recherche. Des transporteurs vérifiés pour les déménagements et le fret commercial en Turquie, en Europe, dans les Balkans, en Scandinavie, dans la CEI, en Asie centrale et au Moyen-Orient.",
    ogTitle: "Comparez des transporteurs vérifiés dans 53 pays",
    ogDescription:
      "Dites-nous où va votre chargement. Nous vous mettons en relation avec des prestataires de transport vérifiés qui viennent à vous.",
    keywords: [
      "transporteur routier",
      "déménagement international",
      "transport Turquie Europe",
      "uluslararası nakliyat",
      "devis fret commercial",
      "logistique Asie centrale",
    ],
    quoteTitle: "Parlez-nous de votre chargement",
    quoteDescription:
      "Décrivez votre chargement une seule fois. Des transporteurs vérifiés vous contactent sur le canal de votre choix.",
    resultsTitle: "Vos correspondances de transporteurs",
    resultsDescription: "Des transporteurs vérifiés pour un chargement de {volume}.",
    coverageTitle: "Couverture des corridors — 53 pays, 19 lignes actives",
    coverageDescription:
      "Tous les corridors proposés par Rotamove : la Turquie vers et depuis l’Europe de l’Ouest et du Sud, les Balkans, la Scandinavie, la CEI, l’Asie centrale et le Moyen-Orient.",
    howItWorksTitle: "Comment ça marche",
    howItWorksDescription:
      "Comment Rotamove vous met en relation avec des transporteurs, comment le classement est pondéré, et ce que chaque partenaire doit prouver.",
    partnersTitle: "Pour les transporteurs — 100 $/mois en illimité, ou jusqu’à 7 $ par demande",
    partnersDescription:
      "Rejoignez le réseau de partenaires Rotamove. Demandes illimitées pour un forfait mensuel, ou paiement à la demande avec un plafond strict de 7 $.",
  },
} satisfies Dictionary;

export default fr;
