/**
 * Geography layer.
 *
 * Rotamove operates a corridor network rather than a global catalogue: every
 * lane we sell has Türkiye, Europe, the Balkans, Scandinavia, the CIS/Caucasus,
 * Central Asia or the Middle East on at least one end. Keeping the network
 * explicit (instead of "any city to any city") is what makes pricing,
 * partner matching and lead pricing tractable.
 *
 * Data here is static and tree-shakeable; in production it would be served from
 * a `geo` service with the same shape, so nothing downstream needs to change.
 */

export type RegionId =
  | "TR"
  | "EU_WEST"
  | "EU_SOUTH"
  | "BALKANS"
  | "NORDICS"
  | "CIS"
  | "CENTRAL_ASIA"
  | "MIDDLE_EAST";

export interface Region {
  id: RegionId;
  name: string;
  short: string;
  blurb: string;
}

export const REGIONS: Record<RegionId, Region> = {
  TR: {
    id: "TR",
    name: "Türkiye",
    short: "TR",
    blurb: "Istanbul, Ankara, Izmir and 9 more origin hubs.",
  },
  EU_WEST: {
    id: "EU_WEST",
    name: "Western Europe",
    short: "EU-W",
    blurb: "Germany, Netherlands, Belgium, France, Austria, Switzerland, UK, Ireland.",
  },
  EU_SOUTH: {
    id: "EU_SOUTH",
    name: "Southern Europe",
    short: "EU-S",
    blurb: "Italy, Spain, Portugal, Greece, Malta, Cyprus.",
  },
  BALKANS: {
    id: "BALKANS",
    name: "Balkans",
    short: "BLK",
    blurb:
      "Serbia, Bulgaria, Romania, Croatia, Slovenia, Bosnia, North Macedonia, Albania, Hungary, Slovakia.",
  },
  NORDICS: {
    id: "NORDICS",
    name: "Scandinavia & Nordics",
    short: "NOR",
    blurb: "Sweden, Norway, Denmark, Finland, Iceland.",
  },
  CIS: {
    id: "CIS",
    name: "CIS & Caucasus",
    short: "CIS",
    blurb: "Russia, Belarus, Ukraine, Azerbaijan, Georgia, Armenia.",
  },
  CENTRAL_ASIA: {
    id: "CENTRAL_ASIA",
    name: "Central Asia",
    short: "C-AS",
    blurb: "Uzbekistan, Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan.",
  },
  MIDDLE_EAST: {
    id: "MIDDLE_EAST",
    name: "Middle East",
    short: "ME",
    blurb: "UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman, Jordan, Lebanon, Israel, Egypt, Iraq.",
  },
};

export const REGION_ORDER: RegionId[] = [
  "TR",
  "EU_WEST",
  "EU_SOUTH",
  "BALKANS",
  "NORDICS",
  "CIS",
  "CENTRAL_ASIA",
  "MIDDLE_EAST",
];

export interface Country {
  iso: string;
  name: string;
  flag: string;
  region: RegionId;
  /** Customs friction 0 (free movement) - 3 (heavy paperwork). Feeds pricing. */
  customs: 0 | 1 | 2 | 3;
  eu: boolean;
}

const C = (
  iso: string,
  name: string,
  flag: string,
  region: RegionId,
  customs: 0 | 1 | 2 | 3,
  eu = false,
): Country => ({ iso, name, flag, region, customs, eu });

export const COUNTRIES: Country[] = [
  C("TR", "Türkiye", "🇹🇷", "TR", 2),

  C("DE", "Germany", "🇩🇪", "EU_WEST", 0, true),
  C("NL", "Netherlands", "🇳🇱", "EU_WEST", 0, true),
  C("BE", "Belgium", "🇧🇪", "EU_WEST", 0, true),
  C("FR", "France", "🇫🇷", "EU_WEST", 0, true),
  C("AT", "Austria", "🇦🇹", "EU_WEST", 0, true),
  C("CH", "Switzerland", "🇨🇭", "EU_WEST", 1),
  C("GB", "United Kingdom", "🇬🇧", "EU_WEST", 2),
  C("IE", "Ireland", "🇮🇪", "EU_WEST", 0, true),
  C("LU", "Luxembourg", "🇱🇺", "EU_WEST", 0, true),

  C("IT", "Italy", "🇮🇹", "EU_SOUTH", 0, true),
  C("ES", "Spain", "🇪🇸", "EU_SOUTH", 0, true),
  C("PT", "Portugal", "🇵🇹", "EU_SOUTH", 0, true),
  C("GR", "Greece", "🇬🇷", "EU_SOUTH", 0, true),
  C("MT", "Malta", "🇲🇹", "EU_SOUTH", 1, true),
  C("CY", "Cyprus", "🇨🇾", "EU_SOUTH", 1, true),

  C("RS", "Serbia", "🇷🇸", "BALKANS", 2),
  C("BG", "Bulgaria", "🇧🇬", "BALKANS", 0, true),
  C("RO", "Romania", "🇷🇴", "BALKANS", 0, true),
  C("HR", "Croatia", "🇭🇷", "BALKANS", 0, true),
  C("SI", "Slovenia", "🇸🇮", "BALKANS", 0, true),
  C("BA", "Bosnia & Herzegovina", "🇧🇦", "BALKANS", 2),
  C("MK", "North Macedonia", "🇲🇰", "BALKANS", 2),
  C("AL", "Albania", "🇦🇱", "BALKANS", 2),
  C("ME", "Montenegro", "🇲🇪", "BALKANS", 2),
  C("XK", "Kosovo", "🇽🇰", "BALKANS", 2),
  C("HU", "Hungary", "🇭🇺", "BALKANS", 0, true),
  C("SK", "Slovakia", "🇸🇰", "BALKANS", 0, true),

  C("SE", "Sweden", "🇸🇪", "NORDICS", 0, true),
  C("NO", "Norway", "🇳🇴", "NORDICS", 1),
  C("DK", "Denmark", "🇩🇰", "NORDICS", 0, true),
  C("FI", "Finland", "🇫🇮", "NORDICS", 0, true),
  C("IS", "Iceland", "🇮🇸", "NORDICS", 2),

  C("RU", "Russia", "🇷🇺", "CIS", 3),
  C("BY", "Belarus", "🇧🇾", "CIS", 3),
  C("UA", "Ukraine", "🇺🇦", "CIS", 3),
  C("AZ", "Azerbaijan", "🇦🇿", "CIS", 2),
  C("GE", "Georgia", "🇬🇪", "CIS", 1),
  C("AM", "Armenia", "🇦🇲", "CIS", 2),

  C("UZ", "Uzbekistan", "🇺🇿", "CENTRAL_ASIA", 3),
  C("KZ", "Kazakhstan", "🇰🇿", "CENTRAL_ASIA", 2),
  C("KG", "Kyrgyzstan", "🇰🇬", "CENTRAL_ASIA", 3),
  C("TJ", "Tajikistan", "🇹🇯", "CENTRAL_ASIA", 3),
  C("TM", "Turkmenistan", "🇹🇲", "CENTRAL_ASIA", 3),

  C("AE", "United Arab Emirates", "🇦🇪", "MIDDLE_EAST", 1),
  C("SA", "Saudi Arabia", "🇸🇦", "MIDDLE_EAST", 2),
  C("QA", "Qatar", "🇶🇦", "MIDDLE_EAST", 1),
  C("KW", "Kuwait", "🇰🇼", "MIDDLE_EAST", 2),
  C("BH", "Bahrain", "🇧🇭", "MIDDLE_EAST", 1),
  C("OM", "Oman", "🇴🇲", "MIDDLE_EAST", 2),
  C("JO", "Jordan", "🇯🇴", "MIDDLE_EAST", 2),
  C("LB", "Lebanon", "🇱🇧", "MIDDLE_EAST", 3),
  C("IL", "Israel", "🇮🇱", "MIDDLE_EAST", 2),
  C("EG", "Egypt", "🇪🇬", "MIDDLE_EAST", 3),
  C("IQ", "Iraq", "🇮🇶", "MIDDLE_EAST", 3),
];

export const COUNTRY_BY_ISO = new Map(COUNTRIES.map((c) => [c.iso, c]));

export interface City {
  /** Airline-style 3-letter hub code. Used everywhere as the visual shorthand. */
  code: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  /** 1 = primary hub (daily departures), 2 = regional, 3 = on-request. */
  tier: 1 | 2 | 3;
}

type RawCity = [code: string, name: string, iso: string, lat: number, lon: number, tier?: 1 | 2 | 3];

const RAW_CITIES: RawCity[] = [
  // Türkiye
  ["IST", "Istanbul", "TR", 41.0082, 28.9784, 1],
  ["ESB", "Ankara", "TR", 39.9334, 32.8597, 1],
  ["ADB", "Izmir", "TR", 38.4237, 27.1428, 1],
  ["AYT", "Antalya", "TR", 36.8969, 30.7133, 1],
  ["BTZ", "Bursa", "TR", 40.1885, 29.061, 2],
  ["MER", "Mersin", "TR", 36.8121, 34.6415, 2],
  ["ADA", "Adana", "TR", 37.0, 35.3213, 2],
  ["GZT", "Gaziantep", "TR", 37.0662, 37.3833, 2],
  ["TZX", "Trabzon", "TR", 41.0015, 39.7178, 3],
  ["KYA", "Konya", "TR", 37.8746, 32.4932, 3],
  ["BJV", "Bodrum", "TR", 37.0344, 27.4305, 3],
  ["ASR", "Kayseri", "TR", 38.7312, 35.4787, 3],

  // Western Europe
  ["BER", "Berlin", "DE", 52.52, 13.405, 1],
  ["MUC", "Munich", "DE", 48.1351, 11.582, 1],
  ["FRA", "Frankfurt", "DE", 50.1109, 8.6821, 1],
  ["CGN", "Cologne", "DE", 50.9375, 6.9603, 2],
  ["HAM", "Hamburg", "DE", 53.5511, 9.9937, 1],
  ["DUS", "Düsseldorf", "DE", 51.2277, 6.7735, 2],
  ["STR", "Stuttgart", "DE", 48.7758, 9.1829, 2],
  ["AMS", "Amsterdam", "NL", 52.3676, 4.9041, 1],
  ["RTM", "Rotterdam", "NL", 51.9244, 4.4777, 1],
  ["BRU", "Brussels", "BE", 50.8503, 4.3517, 1],
  ["ANR", "Antwerp", "BE", 51.2194, 4.4025, 2],
  ["PAR", "Paris", "FR", 48.8566, 2.3522, 1],
  ["LYS", "Lyon", "FR", 45.764, 4.8357, 2],
  ["MRS", "Marseille", "FR", 43.2965, 5.3698, 2],
  ["VIE", "Vienna", "AT", 48.2082, 16.3738, 1],
  ["ZRH", "Zurich", "CH", 47.3769, 8.5417, 1],
  ["GVA", "Geneva", "CH", 46.2044, 6.1432, 2],
  ["LON", "London", "GB", 51.5074, -0.1278, 1],
  ["MAN", "Manchester", "GB", 53.4808, -2.2426, 2],
  ["DUB", "Dublin", "IE", 53.3498, -6.2603, 2],
  ["LUX", "Luxembourg", "LU", 49.6116, 6.1319, 3],

  // Southern Europe
  ["MIL", "Milan", "IT", 45.4642, 9.19, 1],
  ["ROM", "Rome", "IT", 41.9028, 12.4964, 1],
  ["MAD", "Madrid", "ES", 40.4168, -3.7038, 1],
  ["BCN", "Barcelona", "ES", 41.3874, 2.1686, 1],
  ["LIS", "Lisbon", "PT", 38.7223, -9.1393, 2],
  ["ATH", "Athens", "GR", 37.9838, 23.7275, 1],
  ["SKG", "Thessaloniki", "GR", 40.6401, 22.9444, 2],
  ["MLA", "Valletta", "MT", 35.8989, 14.5146, 3],
  ["NIC", "Nicosia", "CY", 35.1856, 33.3823, 3],

  // Balkans
  ["BEG", "Belgrade", "RS", 44.7866, 20.4489, 1],
  ["SOF", "Sofia", "BG", 42.6977, 23.3219, 1],
  ["BUH", "Bucharest", "RO", 44.4268, 26.1025, 1],
  ["ZAG", "Zagreb", "HR", 45.815, 15.9819, 2],
  ["LJU", "Ljubljana", "SI", 46.0569, 14.5058, 2],
  ["BUD", "Budapest", "HU", 47.4979, 19.0402, 1],
  ["BTS", "Bratislava", "SK", 48.1486, 17.1077, 2],
  ["SJJ", "Sarajevo", "BA", 43.8563, 18.4131, 3],
  ["SKP", "Skopje", "MK", 41.9981, 21.4254, 3],
  ["TIA", "Tirana", "AL", 41.3275, 19.8187, 3],
  ["TGD", "Podgorica", "ME", 42.4304, 19.2594, 3],
  ["PRN", "Pristina", "XK", 42.6629, 21.1655, 3],

  // Nordics
  ["STO", "Stockholm", "SE", 59.3293, 18.0686, 1],
  ["GOT", "Gothenburg", "SE", 57.7089, 11.9746, 2],
  ["MMX", "Malmö", "SE", 55.605, 13.0038, 2],
  ["OSL", "Oslo", "NO", 59.9139, 10.7522, 1],
  ["CPH", "Copenhagen", "DK", 55.6761, 12.5683, 1],
  ["AAR", "Aarhus", "DK", 56.1629, 10.2039, 3],
  ["HEL", "Helsinki", "FI", 60.1699, 24.9384, 1],
  ["REK", "Reykjavik", "IS", 64.1466, -21.9426, 3],

  // CIS & Caucasus
  ["MOW", "Moscow", "RU", 55.7558, 37.6173, 1],
  ["LED", "St Petersburg", "RU", 59.9343, 30.3351, 1],
  ["KZN", "Kazan", "RU", 55.7963, 49.1088, 3],
  ["OVB", "Novosibirsk", "RU", 55.0084, 82.9357, 3],
  ["MSQ", "Minsk", "BY", 53.9006, 27.559, 3],
  ["IEV", "Kyiv", "UA", 50.4501, 30.5234, 3],
  ["GYD", "Baku", "AZ", 40.4093, 49.8671, 1],
  ["TBS", "Tbilisi", "GE", 41.7151, 44.8271, 1],
  ["EVN", "Yerevan", "AM", 40.1792, 44.4991, 2],

  // Central Asia
  ["TAS", "Tashkent", "UZ", 41.2995, 69.2401, 1],
  ["SKD", "Samarkand", "UZ", 39.627, 66.975, 2],
  ["ALA", "Almaty", "KZ", 43.222, 76.8512, 1],
  ["NQZ", "Astana", "KZ", 51.1694, 71.4491, 2],
  ["FRU", "Bishkek", "KG", 42.8746, 74.5698, 2],
  ["DYU", "Dushanbe", "TJ", 38.5598, 68.787, 3],
  ["ASB", "Ashgabat", "TM", 37.9601, 58.3261, 3],

  // Middle East
  ["DXB", "Dubai", "AE", 25.2048, 55.2708, 1],
  ["AUH", "Abu Dhabi", "AE", 24.4539, 54.3773, 2],
  ["DOH", "Doha", "QA", 25.2854, 51.531, 1],
  ["RUH", "Riyadh", "SA", 24.7136, 46.6753, 1],
  ["JED", "Jeddah", "SA", 21.4858, 39.1925, 2],
  ["KWI", "Kuwait City", "KW", 29.3759, 47.9774, 2],
  ["BAH", "Manama", "BH", 26.2285, 50.586, 3],
  ["MCT", "Muscat", "OM", 23.588, 58.3829, 3],
  ["AMM", "Amman", "JO", 31.9454, 35.9284, 2],
  ["BEY", "Beirut", "LB", 33.8938, 35.5018, 2],
  ["TLV", "Tel Aviv", "IL", 32.0853, 34.7818, 2],
  ["CAI", "Cairo", "EG", 30.0444, 31.2357, 2],
  ["EBL", "Erbil", "IQ", 36.1911, 44.0092, 3],
];

export const CITIES: City[] = RAW_CITIES.map(([code, name, country, lat, lon, tier]) => ({
  code,
  name,
  country,
  lat,
  lon,
  tier: tier ?? 2,
}));

export const CITY_BY_CODE = new Map(CITIES.map((c) => [c.code, c]));

export function getCity(code: string): City | undefined {
  return CITY_BY_CODE.get(code);
}

export function cityRegion(city: City): RegionId {
  return COUNTRY_BY_ISO.get(city.country)?.region ?? "EU_WEST";
}

export function cityCountry(city: City): Country {
  return COUNTRY_BY_ISO.get(city.country) ?? COUNTRIES[0];
}

/** "Istanbul, Türkiye" */
export function cityLabel(code: string): string {
  const city = getCity(code);
  if (!city) return code;
  return `${city.name}, ${cityCountry(city).name}`;
}

/** "IST → BER" */
export function routeCode(from: string, to: string): string {
  return `${from} → ${to}`;
}

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Fold a string down to something a hurried typist will actually produce:
 * lower case, no diacritics, dotted/dotless i unified. "Dusseldorf" finds
 * Düsseldorf, "izmir" finds İzmir, "turkiye" finds Türkiye.
 */
export function foldText(value: string): string {
  return value
    .replace(/[İIı]/g, "i")
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .trim();
}

export interface CityHit {
  city: City;
  /** Where the query matched, so the UI can bold exactly that run. */
  field: "name" | "country" | "code" | "region";
  start: number;
  length: number;
}

/**
 * Hub search.
 *
 * Matches city name, country, region and hub code, and ranks word-start
 * matches above mid-word ones so typing "ber" surfaces Berlin before Bursa's
 * country. Returns match positions so results can be highlighted.
 */
export function searchCityHits(query: string, limit = 8): CityHit[] {
  const q = foldText(query);

  if (!q) {
    return CITIES.filter((c) => c.tier === 1)
      .slice(0, limit)
      .map((city) => ({ city, field: "name" as const, start: 0, length: 0 }));
  }

  const hits: Array<CityHit & { score: number }> = [];

  for (const city of CITIES) {
    const country = cityCountry(city);
    const region = REGIONS[country.region];
    const name = foldText(city.name);
    const cname = foldText(country.name);
    const rname = foldText(region.name);
    const code = foldText(city.code);

    const tierBonus = (4 - city.tier) * 4;
    let best: { score: number; field: CityHit["field"]; start: number } | null = null;

    const consider = (score: number, field: CityHit["field"], start: number) => {
      if (start < 0) return;
      if (!best || score > best.score) best = { score, field, start };
    };

    if (code === q) consider(200, "code", 0);
    else if (code.startsWith(q)) consider(150 + tierBonus, "code", 0);

    if (name.startsWith(q)) consider(140 + tierBonus, "name", 0);
    else {
      // word-start inside a multi-word name ("st petersburg" <- "pet")
      const wordStart = name.indexOf(` ${q}`);
      if (wordStart >= 0) consider(120 + tierBonus, "name", wordStart + 1);
      else consider(name.includes(q) ? 90 + tierBonus : -1, "name", name.indexOf(q));
    }

    if (cname.startsWith(q)) consider(110 + tierBonus, "country", 0);
    else if (cname.includes(q)) consider(70 + tierBonus, "country", cname.indexOf(q));

    if (rname.startsWith(q)) consider(60 + tierBonus, "region", 0);

    if (best) {
      const match = best as { score: number; field: CityHit["field"]; start: number };
      hits.push({
        city,
        field: match.field,
        start: match.start,
        length: q.length,
        score: match.score,
      });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score || a.city.name.localeCompare(b.city.name))
    .slice(0, limit)
    .map(({ city, field, start, length }) => ({ city, field, start, length }));
}

export function searchCities(query: string, limit = 8): City[] {
  return searchCityHits(query, limit).map((h) => h.city);
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: City, b: City): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Road distance is meaningfully longer than great-circle on these corridors
 * (Alps, Bosphorus, Caspian). A 1.28 detour factor tracks real TR→EU truck
 * routings within a few percent.
 */
export function roadKm(a: City, b: City): number {
  return Math.round(haversineKm(a, b) * 1.28);
}

export interface Corridor {
  id: string;
  from: RegionId;
  to: RegionId;
  /** Marketing name, e.g. "Türkiye → Germany & Benelux". */
  label: string;
  /** Typical door-to-door transit in days, by road groupage. */
  transitDays: [number, number];
  /** Monthly lead volume on the network. Drives partner-side pricing. */
  monthlyLeads: number;
  modes: TransportMode[];
}

export type TransportMode = "road" | "sea" | "air" | "rail";

/**
 * The corridors Rotamove actively sells. Every one touches Türkiye or is an
 * adjacent lane our partner base already runs trucks on.
 */
export const CORRIDORS: Corridor[] = [
  {
    id: "tr-eu-west",
    from: "TR",
    to: "EU_WEST",
    label: "Türkiye → Germany, Benelux & France",
    transitDays: [6, 11],
    monthlyLeads: 2140,
    modes: ["road", "sea", "air"],
  },
  {
    id: "eu-west-tr",
    from: "EU_WEST",
    to: "TR",
    label: "Western Europe → Türkiye",
    transitDays: [7, 12],
    monthlyLeads: 1880,
    modes: ["road", "sea", "air"],
  },
  {
    id: "tr-eu-south",
    from: "TR",
    to: "EU_SOUTH",
    label: "Türkiye → Italy, Spain & Greece",
    transitDays: [5, 10],
    monthlyLeads: 760,
    modes: ["road", "sea", "air"],
  },
  {
    id: "eu-south-tr",
    from: "EU_SOUTH",
    to: "TR",
    label: "Southern Europe → Türkiye",
    transitDays: [5, 10],
    monthlyLeads: 690,
    modes: ["road", "sea", "air"],
  },
  {
    id: "tr-nordics",
    from: "TR",
    to: "NORDICS",
    label: "Türkiye → Scandinavia",
    transitDays: [8, 14],
    monthlyLeads: 540,
    modes: ["road", "sea"],
  },
  {
    id: "nordics-tr",
    from: "NORDICS",
    to: "TR",
    label: "Scandinavia → Türkiye",
    transitDays: [8, 14],
    monthlyLeads: 610,
    modes: ["road", "sea"],
  },
  {
    id: "tr-balkans",
    from: "TR",
    to: "BALKANS",
    label: "Türkiye → Balkans",
    transitDays: [3, 7],
    monthlyLeads: 480,
    modes: ["road"],
  },
  {
    id: "balkans-tr",
    from: "BALKANS",
    to: "TR",
    label: "Balkans → Türkiye",
    transitDays: [3, 7],
    monthlyLeads: 430,
    modes: ["road"],
  },
  {
    id: "tr-middle-east",
    from: "TR",
    to: "MIDDLE_EAST",
    label: "Türkiye → Gulf & Levant",
    transitDays: [6, 13],
    monthlyLeads: 820,
    modes: ["road", "sea", "air"],
  },
  {
    id: "middle-east-tr",
    from: "MIDDLE_EAST",
    to: "TR",
    label: "Middle East → Türkiye",
    transitDays: [6, 13],
    monthlyLeads: 700,
    modes: ["road", "sea", "air"],
  },
  {
    id: "tr-cis",
    from: "TR",
    to: "CIS",
    label: "Türkiye → Russia & Caucasus",
    transitDays: [7, 16],
    monthlyLeads: 910,
    modes: ["road", "sea", "air", "rail"],
  },
  {
    id: "cis-tr",
    from: "CIS",
    to: "TR",
    label: "Russia & Caucasus → Türkiye",
    transitDays: [7, 16],
    monthlyLeads: 1240,
    modes: ["road", "sea", "air", "rail"],
  },
  {
    id: "tr-central-asia",
    from: "TR",
    to: "CENTRAL_ASIA",
    label: "Türkiye → Central Asia",
    transitDays: [12, 24],
    monthlyLeads: 420,
    modes: ["road", "rail", "air"],
  },
  {
    id: "central-asia-tr",
    from: "CENTRAL_ASIA",
    to: "TR",
    label: "Central Asia → Türkiye",
    transitDays: [12, 24],
    monthlyLeads: 510,
    modes: ["road", "rail", "air"],
  },
  {
    id: "eu-central-asia",
    from: "EU_WEST",
    to: "CENTRAL_ASIA",
    label: "Europe → Central Asia (via Middle Corridor)",
    transitDays: [16, 30],
    monthlyLeads: 260,
    modes: ["road", "rail", "air"],
  },
  {
    id: "central-asia-eu",
    from: "CENTRAL_ASIA",
    to: "EU_WEST",
    label: "Central Asia → Europe",
    transitDays: [16, 30],
    monthlyLeads: 240,
    modes: ["road", "rail", "air"],
  },
  {
    id: "me-eu",
    from: "MIDDLE_EAST",
    to: "EU_WEST",
    label: "Gulf → Europe",
    transitDays: [14, 28],
    monthlyLeads: 330,
    modes: ["sea", "air"],
  },
  {
    id: "eu-me",
    from: "EU_WEST",
    to: "MIDDLE_EAST",
    label: "Europe → Gulf",
    transitDays: [14, 28],
    monthlyLeads: 380,
    modes: ["sea", "air"],
  },
  {
    id: "tr-domestic",
    from: "TR",
    to: "TR",
    label: "Domestic Türkiye",
    transitDays: [1, 4],
    monthlyLeads: 3600,
    modes: ["road"],
  },
];

const CORRIDOR_INDEX = new Map(CORRIDORS.map((c) => [`${c.from}:${c.to}`, c]));

export function findCorridor(from: RegionId, to: RegionId): Corridor | undefined {
  return CORRIDOR_INDEX.get(`${from}:${to}`);
}

/**
 * Resolve the commercial corridor for a route. Lanes we do not explicitly sell
 * fall back to a synthetic corridor so the quote engine still answers — the UI
 * then labels it "extended network".
 */
export function resolveCorridor(fromCity: City, toCity: City): Corridor {
  const from = cityRegion(fromCity);
  const to = cityRegion(toCity);
  const exact = findCorridor(from, to);
  if (exact) return exact;

  if (from === to) {
    return {
      id: `domestic-${from.toLowerCase()}`,
      from,
      to,
      label: `Domestic ${REGIONS[from].name}`,
      transitDays: [1, 5],
      monthlyLeads: 240,
      modes: ["road"],
    };
  }

  const km = roadKm(fromCity, toCity);
  const lo = Math.max(3, Math.round(km / 620));
  return {
    id: `ext-${from.toLowerCase()}-${to.toLowerCase()}`,
    from,
    to,
    label: `${REGIONS[from].name} → ${REGIONS[to].name}`,
    transitDays: [lo, lo + Math.round(lo * 0.7) + 2],
    monthlyLeads: 90,
    modes: km > 4200 ? ["sea", "air", "road"] : ["road", "air"],
  };
}

export function isCoreCorridor(corridor: Corridor): boolean {
  return CORRIDOR_INDEX.has(`${corridor.from}:${corridor.to}`);
}

export const NETWORK_STATS = {
  countries: COUNTRIES.length,
  cities: CITIES.length,
  corridors: CORRIDORS.length,
  monthlyLeads: CORRIDORS.reduce((sum, c) => sum + c.monthlyLeads, 0),
};
