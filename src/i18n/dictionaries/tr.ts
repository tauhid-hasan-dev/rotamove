import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Türkçe.
 *
 * Note on plurals: Turkish takes no plural suffix after a numeral — "1 gün",
 * "5 gün", never "5 günler". So `one` and `other` are deliberately identical.
 */
export const tr = {
  units: {
    days: { one: "{n} gün", other: "{n} gün" },
    weeks: { one: "{n} hafta", other: "{n} hafta" },
    monthsAgo: { one: "{n} ay önce", other: "{n} ay önce" },
    movers: { one: "{n} taşıyıcı", other: "{n} taşıyıcı" },
    countries: { one: "{n} ülke", other: "{n} ülke" },
    cities: { one: "{n} şehir", other: "{n} şehir" },
    boxes: { one: "{n} koli", other: "{n} koli" },
    attempts: { one: "{n} deneme", other: "{n} deneme" },
    minutesShort: "{n} dk",
    hoursShort: "{n} sa",
    daysShort: "{n} g",
    perMonth: "{n}/ay",
    cubicMetres: "{n} m³",
    none: "Yok",
  },

  common: {
    skipToContent: "İçeriğe geç",
    search: "Ara",
    continue: "Devam",
    back: "Geri",
    change: "Değiştir",
    edit: "Düzenle",
    reset: "Sıfırla",
    undo: "Geri al",
    tryAgain: "Tekrar dene",
    optional: "(isteğe bağlı)",
    any: "Hepsi",
    free: "Ücretsiz · üyelik yok · rahatsız edici arama yok",
    appearance: "Görünüm",
    toggleTheme: "Açık ve koyu temayı değiştir",
    openMenu: "Menüyü aç",
    startSearch: "Arama başlat",
    newSearch: "Yeni arama",
    startAgain: "Yeniden başla",
    searchAnyRoute: "Herhangi bir güzergâh ara",
    allCorridors: "Tüm koridorlar",
    browseCorridors: "Koridorlara göz at",
    partnerLogin: "Partner girişi",
    ratingLabel: "5 üzerinden {rating}",
    ratingLabelWithCount: "{count} değerlendirmede 5 üzerinden {rating}",
    verifiedBooking: "doğrulanmış rezervasyon",
  },

  language: {
    label: "Dil",
    choose: "Bir dil seçin",
  },

  nav: {
    howItWorks: "Nasıl çalışır",
    coverage: "Kapsama",
    forMovers: "Taşıyıcılar için",
    main: "Ana menü",
    mobile: "Mobil menü",
    home: "Rotamove ana sayfa",
  },

  footer: {
    blurb:
      "Türkiye, Avrupa, Balkanlar, İskandinavya, BDT, Orta Asya ve Orta Doğu genelinde doğrulanmış taşıyıcılar.",
    move: "Taşıma",
    movers: "Taşıyıcılar",
    company: "Şirket",
    partnerPricing: "Partner fiyatlandırması",
    dashboardDemo: "Panel demosu",
    partnerFaq: "Partner SSS",
    about: "Hakkımızda",
    trust: "Güven ve doğrulama",
    contact: "İletişim",
    rights: "Rotamove · Demo ürün",
    privacy: "KVKK ve GDPR",
    terms: "Şartlar",
    offices: "İstanbul · Berlin · Taşkent",
  },

  hero: {
    eyebrow: "Türkiye · Avrupa · Orta Asya · Körfez",
    title: "Her yük için doğru taşıyıcıyı bulun.",
    subtitle:
      "Evden eve nakliyattan ticari yük taşımacılığına kadar, her yük için doğru nakliye firmasını bulun.",
  },

  scene: {
    alt: "Bir kamyon ve iki minivan, yükleme noktasından teslim noktasına doğru yol alıyor.",
    origin: "Yükleme",
    originHint: "Yüklediğiniz her yerden",
    destination: "Teslim",
    destinationHint: "Boşalttığınız her yere",
    inTransit: "Kapıdan kapıya",
  },

  trust: {
    label: "Yalnızca akredite partnerler",
  },

  how: {
    title: "Üç adım. Telefon trafiği yok.",
    steps: [
      { title: "Ara", body: "Tek kutu. Nereden, nereye." },
      { title: "Eşleş", body: "Güzergâhınızı gerçekten işleten taşıyıcıları buluyoruz." },
      { title: "Taşı", body: "WhatsApp, telefon veya e-posta seçin. Onlar size ulaşır." },
    ],
  },

  testimonials: {
    title: "24.800 yük taşındı, sayı artıyor.",
    items: [
      {
        quote:
          "Aynı öğleden sonra dört taşıyıcı WhatsApp'tan yazdı. Akşama kadar birini seçtim.",
        name: "Aylin K.",
        route: "İstanbul → Berlin",
      },
      {
        quote: "Hazar geçişini gerçekten yapan operatörleri buldular. Başka kimse bulamadı.",
        name: "Rustam A.",
        route: "Taşkent → İstanbul",
      },
      {
        quote: "Form yok, spam yok. Tek arama ve doğru kişiler bana ulaştı.",
        name: "Jonas R.",
        route: "Stockholm → İzmir",
      },
    ],
  },

  partnerTeaser: {
    eyebrow: "Nakliye firmaları için",
    title: "Telefon numarası değil, talep satın alın.",
    body: "Sabit aylık ücret ya da üst sınırı olan müşteri başı ödeme. Başka hiçbir şey.",
    pricingCta: "Partner fiyatlandırması",
    demoCta: "Demoyu görün",
    proBody: "Sınırsız müşteri talebi. Aramada anında yerleşim.",
    proUnit: "/ ay",
    pplBody: "Abonelik yok. Asla {cap} üzeri değil.",
    pplUnit: "/ talep",
  },

  faq: {
    title: "Sorular",
    items: [
      {
        q: "Ücretsiz mi?",
        a: "Evet, her zaman. Taşıyıcılar bize sabit aylık ücret ya da talep başına üst sınırlı küçük bir ücret öder — yükünüzden asla komisyon alınmaz, dolayısıyla kimse daha iyi bir sıra satın alamaz.",
      },
      {
        q: "Rahatsız edici aramalar alır mıyım?",
        a: "Hayır. Kanalı siz seçersiniz — WhatsApp, telefon veya e-posta — ve bilgileriniz yalnızca sizin seçtiğiniz taşıyıcılara gider.",
      },
      {
        q: "Hangi güzergâhları kapsıyorsunuz?",
        a: "Türkiye'den Avrupa, Balkanlar, İskandinavya, BDT ve Kafkasya, Orta Asya ve Orta Doğu'ya ve bu bölgelerden Türkiye'ye — ayrıca 53 partner ülkenin tamamında yurt içi taşımacılık.",
      },
      {
        q: "Taşıyıcılar nasıl doğrulanıyor?",
        a: "Taşıma lisansı, sigorta, hasar geçmişi ve gerçek bir depo; her yıl yeniden kontrol edilir. Geçemeyen ağdan çıkar.",
      },
      {
        q: "Ne kadar hızlı yanıt veriyorlar?",
        a: "Anında eşleşen partnerler genellikle on beş dakika içinde yanıt verir. Diğerleri aynı gün döner.",
      },
    ],
  },

  ctaBand: {
    title: "Ne taşıyorsunuz?",
  },

  coverageGrid: {
    title: "Başka kimsenin doğru işletmediği güzergâhlar için kurulmuş.",
    regions: "Bölgeler",
  },

  coveragePage: {
    eyebrow: "Ağ",
    title: "Türkiye, Avrupa, Asya ve Orta Doğu'yu birbirine yaklaştırıyor",
    lede: "{corridors} koridor, bu yolları gerçekten süren partnerler tarafından haftalık işletiliyor.",
    statCountries: "Ülke",
    statCities: "Merkez şehir",
    statCorridors: "Aktif koridor",
    statLeads: "Talep / ay",
    tableEyebrow: "Her hat",
    tableTitle: "Tam koridor tablosu.",
    tableLede: "Tamamlanan yükler üzerinden ölçülen kapıdan kapıya medyan süreler.",
    thCorridor: "Koridor",
    thFrom: "Nereden",
    thTo: "Nereye",
    thTransit: "Transit",
    thModes: "Mod",
    thPartners: "Partner",
    thDemand: "Talep",
    notListed:
      "Güzergâhınız listede yok mu? Genişletilmiş ağ, partner devirleriyle 90 civarında ülke çiftini daha kapsıyor.",
  },

  howItWorksPage: {
    title: "Bir pazar yeri, nasıl karar verdiğini görebildiğiniz sürece işler.",
    lede: "İşte sıralama ve her taşıyıcının geçmesi gereken kontrol listesi.",
    steps: [
      { title: "Ara", body: "Tek kutu: nereden, nereye." },
      { title: "Eşleş", body: "Ağı tarıyoruz. Yaklaşık sekiz saniye sürer." },
      { title: "Taşı", body: "Kanalı seçin. Yalnızca seçtikleriniz sizinle iletişime geçer." },
    ],
    rankingTitle: "Beş girdi. Yayınlanmış ağırlıklar.",
    rankingBody:
      "Hiçbir taşıyıcı daha iyi bir sıra için ödeme yapamaz. Kimi seçerseniz seçin ücretimiz aynıdır.",
    ranking: {
      routeFit: "Güzergâh uyumu",
      reviewScore: "Değerlendirme puanı",
      onTime: "Zamanında teslim geçmişi",
      transit: "Transit hızı",
      response: "Yanıt süresi",
    },
    checksTitle: "{count} partnerin tamamının kanıtlaması gerekenler.",
    checks: [
      {
        title: "Lisans",
        body: "Taşıma lisansı ve tescil, ulusal sicile karşı kontrol edilir.",
      },
      { title: "Sigorta", body: "Geçerli CMR ve tüm riskler transit teminatı." },
      {
        title: "Hasar geçmişi",
        body: "Sürekli izlenir. Eşiğin üzerine çıkan panodan çıkar.",
      },
      { title: "Gerçek operasyon", body: "Depo, filo, isim isim personel. Aracı yok." },
    ],
    aboutTitle: "Neden ülkeler değil, koridorlar.",
    aboutBody1:
      "Türkiye ile Avrupa arasındaki yük taşımacılığı dünyanın en yoğun akışlarından biri ve neredeyse tamamı aranabilir değil. BDT, Orta Asya ve Körfez hatları daha da kötü — bu yolları gerçekten işleten bir avuç operatör var.",
    aboutBody2:
      "Rotamove az sayıda koridor seçiyor ve derine iniyor. Daha az güzergâh, gerçek partnerler, her yıl doğrulanıyor.",
  },

  partnersPage: {
    eyebrow: "Nakliye firmaları için",
    title: "Telefon numarası değil, talep satın alın.",
    lede: "{corridors} koridorda ayda {leads} doğrulanmış talep. Satın almanın iki yolu.",
    plansNote:
      "Her iki plan da lisans ve sigorta doğrulamasını, uyuşmazlık arabuluculuğunu ve standartlar düşerse panodan çıkarılmayı içerir.",
    chooserTitle: "Hangisi size uygun?",
    feeTitle: "Asla {cap} üzeri değil. Yük ne olursa olsun.",
    whyItems: [
      { title: "Yalnızca sizin hatlarınız", body: "Koridora, hacme ve tarihe göre filtreleyin." },
      { title: "Taşımaya hazır", body: "Güzergâh, tarih ve hacim zaten yanıtlanmış." },
      { title: "Doğrulanmış iletişim", body: "Girişte doğrulanır. 0–100 arası puanlanır." },
      { title: "Kazanma oranı raporu", body: "Koridor bazında neden kaybettiğinizi görün." },
      { title: "API ve webhook", body: "Talepler doğrudan TMS'inize düşer." },
      { title: "Komisyon yok", body: "İşten asla pay almıyoruz." },
    ],
    faqTitle: "Partner SSS",
    ctaTitle: "Ücretsiz başlayın. Kazandırdığında yükseltin.",
    ctaBody: "Doğrulama yaklaşık iki iş günü sürer.",
    ctaButton: "Demo panelini açın",
    ctaNote: "Sınırsız için {pro}/ay · veya talep başına en fazla {cap}",
  },

  plans: {
    mostChosen: "En çok seçilen",
    proName: "Pro Sınırsız",
    proSuffix: "/ay",
    proNote: "USD olarak aylık faturalanır. Dilediğiniz zaman iptal, ihbar süresi yok.",
    proCta: "14 günlük ücretsiz denemeyi başlat",
    proFeatures: [
      "Sınırsız uluslararası talep",
      "Sınırsız yurt içi talep",
      "Aramada anında eşleşme yerleşimi",
      "Sonuç panosundan tek dokunuşla iletişim",
      "Maskelenmemiş, tam müşteri iletişim bilgileri",
      "Kapasite ve sezon kuralları motoru",
      "Koridor talep analitiği ve kazanma oranı raporu",
      "Talep API'si ve webhook'lar",
      "Öncelikli uyuşmazlık yönetimi",
      "8 operatör koltuğuna kadar",
    ],
    pplName: "Talep Başına Ödeme",
    pplSuffix: "/talep",
    pplNote: "Talep başına kesin {cap} üst sınırı. Kilidi açmadan önce tam fiyatı görürsünüz.",
    pplCta: "Ücretsiz partner hesabı oluştur",
    pplFeatures: [
      "Aylık ücret yok, minimum harcama yok",
      "Tüm talep panosuna göz atın",
      "İletişim bilgilerini görmek için talebin kilidini açın",
      "Hatalı iletişim bilgisinde 24 saat içinde iade",
      "Koridor ve hacim filtreleri",
      "Aramada anında eşleşme yerleşimi",
      "Sonuç panosundan tek dokunuşla iletişim",
      "Talep API'si ve webhook'lar",
      "Koridor talep analitiği",
      "1 operatör koltuğu",
    ],
    faq: [
      {
        q: "Talep tam olarak neyi kapsıyor?",
        a: "Doğrulanmış güzergâh, tarih, hacim ve ulaşılabilir iletişim bilgileriyle tamamlanmış bir başvuru. Doğrulamamızı geçemeyen başvurular panoya hiç ulaşmaz ve bunlar için sizden hiç ücret alınmaz.",
      },
      {
        q: "Pro Sınırsız gerçekten sınırsız mı?",
        a: "Evet. Ayda {pro}, her koridordaki her uluslararası ve yurt içi talebi kapsar; üst sınır ve aşım ücreti yok. Tek sınır kendi kapasite ayarlarınız.",
      },
      {
        q: "Neden talep başına ödemeyi seçeyim?",
        a: "Ayda {breakEven} talepten az kapatıyorsanız talep başına ödeme daha ucuz. Partnerlerin çoğu orada başlar ve iki ay içinde Pro'ya geçer.",
      },
      {
        q: "Bir talep üst sınırdan fazlaya gelebilir mi?",
        a: "Asla. {cap}, koridor, hacim veya iş değeri ne olursa olsun kesin bir tavandır ve tam fiyat kilidi açmadan önce gösterilir.",
      },
      {
        q: "Talep başına ödeyen partnerler arama sonuçlarında görünüyor mu?",
        a: "Sonuç panosunda görünürsünüz, ancak anında değil daha sonra yanıt verecek olarak işaretlenirsiniz. Anında eşleşme yerleşimi bir Pro Sınırsız özelliğidir.",
      },
      {
        q: "İletişim bilgileri hatalıysa ne olur?",
        a: "24 saat içinde bildirin, talep kredisi otomatik iade edilir. Talep başına ücret olmadığı için Pro partnerler bundan etkilenmez.",
      },
    ],
  },

  planChooser: {
    label: "Ayda alacağınız talep sayısı",
    ariaLeads: "Ayda talep sayısı",
    proNote: "sabit, hacim ne olursa olsun",
    pplNote: "her biri ≈ {fee} · {cap} ile sınırlı",
    cheaperFor: "{plan} sizin için daha ucuz",
    proWins: "ayda {saving} daha az — ve yalnızca Pro sizi anında arama sonuçlarına koyar.",
    pplWins: "ayda {saving} daha az. Pro, {breakEven} talepten sonra kazanır.",
    proCta: "Pro denemesini başlat",
    pplCta: "Ücretsiz hesap oluştur",
  },

  leadFee: {
    eyebrow: "Bir talebin maliyeti",
    body: "Talep başına fiyat, sabit bir tarife değil beklenen iş değerini izler — ve {cap} seviyesinde durur. Aşağıdaki işi değiştirin ve ücretin nasıl hareket ettiğini görün.",
    destination: "İstanbul'dan varış noktası",
    volume: "Yük hacmi",
    daysOut: "Yüklemeye kalan gün",
    fullService: "Tam hizmet",
    fullServiceHint: "Paketleme ve kurulum dahil",
    storage: "Depolama gerekli",
    storageHint: "4 hafta antrepo",
    youPay: "Ödeyeceğiniz",
    once: "tek seferlik",
    floor: "{amount} taban",
    cap: "{amount} tavan",
    atCap: "Bu iş, kazanan için {cap} değerinin çok üzerinde — tavan yine de geçerli.",
    quality: "Talep kalite puanı",
    qualityValue: "{score} / 100",
    moveType: "Yük tipi",
    refundWindow: "İade süresi",
    refundValue: "24 saat",
    costOnPro: "Pro Sınırsız'da maliyet",
    costOnProValue: "{amount} — dahil",
    footnote:
      "Pro Sınırsız partnerleri, bu sayı ne derse desin talep başına hiçbir şey ödemez. Takas tam olarak bu: ayda {pro}, bunu düşünmeyi bırakma hakkını satın alır.",
  },

  search: {
    fromLabel: "Nereden",
    toLabel: "Nereye",
    fromPlaceholder: "Nereden?",
    toPlaceholder: "Nereye?",
    swap: "Çıkış ve varış noktasını değiştir",
    popular: "Popüler",
    noMatch: "“{query}” için sonuç yok",
  },

  dates: {
    label: "Ne zaman",
    placeholder: "Tarih ekleyin",
    hint: "İsteğe bağlı — bir yükleme aralığı seçin",
    clear: "Temizle",
    done: "Tamam",
    flexibleBy: "Yükleme aralığı · {days}",
    previousMonth: "Önceki ay",
    nextMonth: "Sonraki ay",
  },

  lastCall: {
    badge: "Son çağrı",
    body: "{count} 24 saat içinde yükleme yapabilir.",
    cta: "Hemen bul",
    dismiss: "Kapat",
  },

  quote: {
    steps: {
      home: "Yük",
      timing: "Tarih",
      services: "Yardım",
      contact: "İletişim",
    },
    headings: {
      home: "Ne taşıyoruz?",
      timing: "Ne zaman?",
      services: "Ne kadar yardım?",
      contact: "Size nereden ulaşsınlar?",
    },
    swapDirection: "Yönü değiştir",
    fineTuneVolume: "Hacmi ince ayarlayın",
    volumeAria: "Metreküp cinsinden hacim",
    approxBoxes: "≈ {boxes}",
    accessPickup: "Yüklemede erişim",
    accessDelivery: "Teslimde erişim",
    parkAtDoor: "Kamyon kapıya park edebilir",
    moveDate: "Yükleme tarihi",
    howFlexible: "Ne kadar esnek?",
    peakSeason:
      "Haziran–Eylül yoğun sezon. Tarihi iki hafta öne veya arkaya almak çok daha fazla kapasite açıyor.",
    addOns: "Ek hizmetler",
    storageLegend: "Depolama",
    storageAria: "Depolama haftası",
    specialistLegend: "Özel bir şey var mı?",
    preferredChannel: "Tercih edilen kanal",
    name: "Ad soyad",
    namePlaceholder: "Elif Yılmaz",
    email: "E-posta",
    emailPlaceholder: "siz@ornek.com",
    phone: "Telefon",
    phonePlaceholder: "+90 532 000 00 00",
    notes: "Eklemek istediğiniz bir şey var mı?",
    notesPlaceholder: "Sokak dar, varış noktasında asansör yok…",
    consent:
      "Talebimi uygun taşıyıcılarla paylaşın. Bilgileriniz başka hiçbir yere gitmez.",
    matching: "Eşleştiriliyor…",
    findMovers: "Taşıyıcılarımı bul",
    moversMatch: "{count} uygun",
    sendFailed: "Talebiniz gönderilemedi",
    somethingWrong: "Bir şeyler ters gitti",
    matchCount: {
      legend: "Kaç taşıyıcıyla iletişime geçelim?",
      hint: "Talebiniz yalnızca seçtiğiniz taşıyıcılara ulaşır.",
      two: "2 taşıyıcı",
      twoHint: "En güçlü iki eşleşme",
      five: "5 taşıyıcı",
      fiveHint: "Dengeli bir kısa liste",
      all: "Tüm taşıyıcılar",
      allHint: "Güzergâhınızdaki her eşleşme",
      recommended: "Önerilen",
    },
    extras: {
      packing: "Paketleme",
      unpacking: "Kurulum",
      dismantling: "Mobilya söküp kurma",
      insurance: "Transit sigortası",
      customsClearance: "Gümrük benim için halledilsin",
      cleaning: "Çıkış temizliği",
    },
  },

  verify: {
    verifyAction: "Doğrula",
    verified: "Doğrulandı",
    sending: "Gönderiliyor…",
    checking: "Kontrol ediliyor…",
    codeSentEmail: "{target} adresine 6 haneli bir kod gönderdik.",
    codeSentPhone: "{target} numarasına SMS ile 6 haneli bir kod gönderdik.",
    codeLabel: "Doğrulama kodu",
    digitLabel: "{n}. hane",
    demoHint: "Demo kodu: {code}",
    resend: "Kodu yeniden gönder",
    resendIn: "{seconds} sn içinde yeniden gönder",
    wrongCode: "Bu kod eşleşmiyor. {attempts} kaldı.",
    locked: "Çok fazla deneme. Yeni bir kod isteyin.",
    emailNeedsVerifying: "Devam etmek için e-postanızı doğrulayın",
    phoneNeedsVerifying: "Devam etmek için telefonunuzu doğrulayın",
    demoNote:
      "Bu demoda doğrulama simüle edilir — gerçekte e-posta veya SMS gönderilmez.",
  },

  results: {
    expiredTitle: "Bu aramanın süresi doldu",
    expiredBody:
      "Bağlantılar 30 gün açık kalır. Yeniden başlayın, saniyeler içinde tekrar eşleştiririz.",
    unreadableTitle: "Bu aramayı okuyamadık",
    unreadableBody: "Yeniden başlayın, eşleşmelerinizi birkaç saniyede yeniden kurarız.",
    noFiltersTitle: "Bu filtrelere uyan sonuç yok",
    noFiltersBody: "Bir koşulu kaldırın — bu güzergâhta hâlâ taşıyıcılar var.",
    clearFilters: "Filtreleri temizle",
    sortAria: "Sırala",
    filtersTitle: "Filtreler",
    networkError: "Partner ağına ulaşamadık.",
    searchFailed: "Arama başarısız",
    openingSearch: "Aramanız açılıyor",
    oneMoment: "Bir saniye",
    canTakeThis: "taşıyıcı bu işi alabilir",
    matchedIn: "{seconds} sn'de eşleşti · sizinle iletişime geçecekler",
    complete: "Talep gönderildi",
    rankingNote:
      "Bağımsız olarak sıralanır. Taşıyıcılar bize sabit bir ücret ya da talep başına üst sınırlı küçük bir ücret öder — asla komisyon değil — bu yüzden kimse daha yüksek bir sıra satın alamaz.",
    sort: {
      best: "En iyi eşleşme",
    },
    stages: {
      secure: { label: "Talebiniz güvene alınıyor", detail: "Şifrelendi ve doğrulandı" },
      corridor: {
        label: "{from} → {to} koridoru açılıyor",
        detailCore: "{corridor} · tipik {days}",
        detailExtended: "{corridor} üzerinden genişletilmiş ağ yönlendirmesi",
      },
      partners: {
        label: "{count} partner taşıyıcı taranıyor",
        detail: "{from} ve {to} lisanslı operatörleri",
      },
      capacity: {
        label: "Araç kapasitesi doğrulanıyor",
        detail: "{date} civarında boş ekipler kontrol ediliyor",
      },
      route: {
        label: "Güzergâh kapasitesi kontrol ediliyor",
        detail: "Feribot slotları, sınır geçişleri ve ekipler",
      },
      ranking: {
        label: "Eşleşmeleriniz sıralanıyor",
        detail: "Kapsama, hız, güvenilirlik ve değerlendirmeler",
      },
    },
  },

  filters: {
    searching: "Aranıyor…",
    ofTotal: "{total} içinden {shown}",
    instantOnly: "Yalnızca anında eşleşme",
    mode: "Mod",
    rating: "Puan",
    mustOffer: "Sunması gerekenler",
    ratingPlus: "{rating}+",
    services: {
      packing: "Paketleme",
      storage: "Depolama",
      customs: "Gümrük",
      vehicle: "Araç",
      piano: "Piyano",
      cleaning: "Temizlik",
    },
  },

  moverCard: {
    bestMatch: "En iyi eşleşme",
    fastest: "En hızlı",
    instantMatch: "Anında eşleşme",
    since: "{year}'den beri",
    transit: "Transit",
    collection: "Yükleme",
    delivery: "Teslim",
    onTime: "{pct} zamanında",
    repliesIn: "{time} içinde yanıtlar",
    co2: "{amount} kg CO₂e",
    requestSent: "Talep gönderildi",
    willReply: "{promise} — {time} içinde.",
    manualPickup: "Talepleri elle alır — genellikle aynı gün yanıtlar.",
    channels: {
      whatsapp: {
        label: "WhatsApp",
        done: "Size WhatsApp'tan yazacaklar",
      },
      phone: { label: "Telefon", done: "Sizi arayacaklar" },
      email: { label: "E-posta", done: "Size e-posta gönderecekler" },
    },
  },

  moverProfile: {
    notFound: "Taşıyıcı bulunamadı",
    metaTitle: "{name} — değerlendirmeler ve koridorlar",
    established: "{year} kuruluş",
    completedMoves: "{count} tamamlanmış yük",
    instantMatch: "Anında eşleşme",
    sameDay: "Aynı gün yanıtlar",
    instantBody: "Aramanız çalıştığı anda uygunluğunu teyit eder.",
    manualBody: "Talepleri elle alır, sonra iletişime geçer.",
    repliesIn: "{time} içinde yanıtlar",
    blurbNote: "Partner açıklaması verildiği şekliyle gösterilmektedir.",
    statOnTime: "Zamanında teslim",
    statClaims: "Hasar oranı",
    statTrucks: "Öz mal kamyon",
    statCrew: "Ekip",
    statCover: "Teminat",
    statCoverValue: "Tam yenileme değeri",
    statCancellation: "Ücretsiz iptal",
    corridorsTitle: "İşlettikleri koridorlar",
    corridorTypical: "tipik {days}",
    extendedNetwork: "Genişletilmiş ağ üzerinden {regions} bölgelerini kapsıyor.",
    reviewsTitle: "Değerlendirmeler",
    servicesTitle: "Hizmetler",
    languagesTitle: "Diller ve bölgeler",
    billingTitle: "Bu partner nasıl faturalandırılıyor",
    billingPro:
      "{name}, Pro Sınırsız planında — ağdaki her talep için ayda sabit {pro}. Onları seçseniz de seçmeseniz de aynı ücreti öderler.",
    billingPpl:
      "{name}, Talep Başına Ödeme planında — istedikleri bir talebin kilidini açmak için en fazla {cap} öderler. Her iki durumda da komisyon yok.",
    services: {
      packing: "Profesyonel paketleme",
      storage: "Antrepo depolama",
      customs: "Kurum içi gümrük müşavirliği",
      vehicle: "Otomobil ve motosiklet taşıma",
      piano: "Piyano ve sanat eseri taşıma",
      cleaning: "Çıkış temizliği",
    },
  },

  login: {
    title: "Partner girişi",
    lede: "Talep panonuzu yönetin, talepleri açın ve planınızı takip edin.",
    email: "Kurumsal e-posta",
    password: "Parola",
    submit: "Giriş yap",
    signingIn: "Giriş yapılıyor…",
    demoTitle: "Demo hesabı",
    demoBody: "Bu bir demodur — yalnızca bu bilgiler çalışır.",
    demoFill: "Demo bilgilerini kullan",
    error: "Bu bilgiler demo hesabıyla eşleşmiyor.",
    notPartner: "Henüz partner değil misiniz?",
    seePlans: "Partner planlarına bakın",
    signOut: "Çıkış yap",
  },

  notFound: {
    eyebrow: "404 · böyle bir güzergâh yok",
    title: "Bu koridor panoda değil.",
    body: "Sayfa taşındı ya da hiç var olmadı.",
  },

  enums: {
    propertySize: {
      few_items: { label: "Birkaç parça", hint: "Koliler, bir yatak, mobilya takımı yok" },
      studio: { label: "Stüdyo / 1+0", hint: "~45 m² ev" },
      one_bed: { label: "1 yatak odası / 1+1", hint: "~65 m² ev" },
      two_bed: { label: "2 yatak odası / 2+1", hint: "~95 m² ev" },
      three_bed: { label: "3 yatak odası / 3+1", hint: "~130 m² ev" },
      four_bed: { label: "4+ yatak odası", hint: "~170 m² ev" },
      villa: { label: "Villa / müstakil", hint: "220 m² ve üzeri" },
      office: { label: "Ofis / ticari yük", hint: "Masalar, BT, arşiv, palet" },
    },
    access: {
      ground: { label: "Zemin kat", hint: "Hiç merdiven yok" },
      lift: { label: "Asansör var", hint: "Yük veya insan asansörü" },
      stairs_1_2: { label: "Merdiven, 1–2 kat", hint: "Asansör yok" },
      stairs_3_plus: { label: "Merdiven, 3+ kat", hint: "Asansör yok, yüksek kat" },
    },
    flexibility: {
      exact: "Tam o tarihte",
      plus_minus_3: "3 gün içinde",
      within_2_weeks: "2 hafta içinde",
      flexible: "Tamamen esnek",
    },
    serviceLevel: {
      full_service: {
        label: "Tam hizmet",
        hint: "Paketler, yükler, taşır ve kurulumunu yapar.",
      },
      door_to_door: { label: "Kapıdan kapıya", hint: "Kolileri siz paketlersiniz, gerisi onlarda." },
      transport_only: { label: "Yalnızca taşıma", hint: "Her şey alınmaya hazır." },
    },
    specialItems: {
      piano: "Piyano",
      vehicle: "Otomobil veya motosiklet",
      artwork: "Sanat eseri veya antika",
      safe: "100 kg üzeri kasa",
      gym: "Spor ekipmanı",
      plants: "Büyük bitki",
    },
    moveType: {
      international: "Uluslararası",
      domestic: "Yurt içi",
    },
    modes: {
      road: { label: "Karayolu", hint: "Kapıdan kapıya kamyon, aktarma yok" },
      sea: { label: "Denizyolu", hint: "LCL konteyner — uzun mesafede en ekonomik" },
      air: { label: "Havayolu", hint: "En hızlısı, küçük gönderiler için ideal" },
      rail: { label: "Demiryolu", hint: "Blok tren — düşük emisyon, sabit tarife" },
    },
    badges: {
      instant_quote: {
        label: "Anında eşleşme",
        hint: "Pro Sınırsız partner — uygunluğunu hemen teyit eder.",
      },
      top_rated: {
        label: "En yüksek puanlı",
        hint: "500 veya daha fazla doğrulanmış değerlendirmede 4,6+ puan.",
      },
      fast_responder: { label: "Hızlı yanıt veren", hint: "İlk yanıt medyanı 20 dakikanın altında." },
      best_value: {
        label: "En iyi değer",
        hint: "Sürekli olarak koridor medyanının altında fiyatlandırır.",
      },
      eco_fleet: { label: "Düşük emisyon", hint: "HVO, elektrik veya demiryolu öncelikli rotalar." },
      customs_expert: { label: "Gümrük uzmanı", hint: "Bu koridorda kurum içi müşavirlik." },
      fragile_specialist: {
        label: "Kırılgan eşya uzmanı",
        hint: "Sanat eseri, antika ve enstrümanlar için özel sandıklama.",
      },
    },
    regions: {
      TR: "Türkiye",
      EU_WEST: "Batı Avrupa",
      EU_SOUTH: "Güney Avrupa",
      BALKANS: "Balkanlar",
      NORDICS: "İskandinavya ve Kuzey Ülkeleri",
      CIS: "BDT ve Kafkasya",
      CENTRAL_ASIA: "Orta Asya",
      MIDDLE_EAST: "Orta Doğu",
    },
    corridors: {
      "tr-eu-west": "Türkiye → Almanya, Benelüks ve Fransa",
      "eu-west-tr": "Batı Avrupa → Türkiye",
      "tr-eu-south": "Türkiye → İtalya, İspanya ve Yunanistan",
      "eu-south-tr": "Güney Avrupa → Türkiye",
      "tr-nordics": "Türkiye → İskandinavya",
      "nordics-tr": "İskandinavya → Türkiye",
      "tr-balkans": "Türkiye → Balkanlar",
      "balkans-tr": "Balkanlar → Türkiye",
      "tr-middle-east": "Türkiye → Körfez ve Levant",
      "middle-east-tr": "Orta Doğu → Türkiye",
      "tr-cis": "Türkiye → Rusya ve Kafkasya",
      "cis-tr": "Rusya ve Kafkasya → Türkiye",
      "tr-central-asia": "Türkiye → Orta Asya",
      "central-asia-tr": "Orta Asya → Türkiye",
      "eu-central-asia": "Avrupa → Orta Asya (Orta Koridor üzerinden)",
      "central-asia-eu": "Orta Asya → Avrupa",
      "me-eu": "Körfez → Avrupa",
      "eu-me": "Avrupa → Körfez",
      "tr-domestic": "Türkiye yurt içi",
    },
    corridorFallback: {
      domestic: "{region} yurt içi",
      extended: "{from} → {to}",
    },
  },

  meta: {
    titleDefault: "Rotamove — her yük için doğru taşıyıcıyı bulun",
    titleTemplate: "%s · Rotamove",
    description:
      "Tek arama. Türkiye, Avrupa, Balkanlar, İskandinavya, BDT, Orta Asya ve Orta Doğu genelinde evden eve nakliyat ve ticari yük için doğrulanmış taşıyıcılar.",
    ogTitle: "53 ülkede doğrulanmış taşıyıcıları karşılaştırın",
    ogDescription:
      "Yükünüzün nereye gittiğini söyleyin. Size gelen doğrulanmış nakliye firmalarıyla eşleştiririz.",
    keywords: [
      "yük taşımacılığı",
      "uluslararası nakliyat",
      "Türkiye Avrupa nakliye",
      "evden eve nakliyat",
      "ticari yük teklifi",
      "Orta Asya lojistik",
    ],
    quoteTitle: "Yükünüzü anlatın",
    quoteDescription:
      "Yükünüzü bir kez anlatın. Doğrulanmış taşıyıcılar seçtiğiniz kanaldan size ulaşır.",
    resultsTitle: "Taşıyıcı eşleşmeleriniz",
    resultsDescription: "{volume} yük için doğrulanmış taşıyıcılar.",
    coverageTitle: "Koridor kapsaması — 53 ülke, 19 aktif hat",
    coverageDescription:
      "Rotamove'un sattığı her koridor: Türkiye'den Batı ve Güney Avrupa, Balkanlar, İskandinavya, BDT, Orta Asya ve Orta Doğu'ya ve bu bölgelerden Türkiye'ye.",
    howItWorksTitle: "Nasıl çalışır",
    howItWorksDescription:
      "Rotamove sizi taşıyıcılarla nasıl eşleştirir, sıralama nasıl ağırlıklandırılır ve her partnerin neyi kanıtlaması gerekir.",
    partnersTitle: "Taşıyıcılar için — sınırsız 100 $/ay veya talep başına 7 $'a kadar",
    partnersDescription:
      "Rotamove partner ağına katılın. Sabit aylık ücretle sınırsız talep ya da kesin 7 $ üst sınırıyla talep başına ödeme.",
  },
} satisfies Dictionary;

export default tr;
