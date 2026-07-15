export const STANDAR_BIAYA_LUAR_DAERAH: Record<string, number> = {
  "ACEH": 360000,
  "SUMATERA UTARA": 370000,
  "RIAU": 370000,
  "KEPULAUAN RIAU": 370000,
  "JAMBI": 370000,
  "SUMATERA BARAT": 380000,
  "SUMATERA SELATAN": 380000,
  "LAMPUNG": 380000,
  "BENGKULU": 380000,
  "BANGKA BELITUNG": 410000,
  "BANTEN": 370000,
  "JAWA BARAT": 430000,
  "D.K.I. JAKARTA": 530000,
  "JAWA TENGAH": 370000,
  "D.I. YOGYAKARTA": 420000,
  "JAWA TIMUR": 410000,
  "BALI": 480000,
  "NUSA TENGGARA BARAT": 440000,
  "NUSA TENGGARA TIMUR": 430000,
  "KALIMANTAN BARAT": 380000,
  "KALIMANTAN TENGAH": 360000,
  "KALIMANTAN SELATAN": 380000,
  "KALIMANTAN TIMUR": 430000,
  "KALIMANTAN UTARA": 430000,
  "SULAWESI UTARA": 370000,
  "GORONTALO": 370000,
  "SULAWESI BARAT": 410000,
  "SULAWESI SELATAN": 430000,
  "SULAWESI TENGAH": 370000,
  "SULAWESI TENGGARA": 380000,
  "MALUKU": 380000,
  "MALUKU UTARA": 430000,
  "PAPUA": 580000,
  "PAPUA BARAT": 480000,
  "PAPUA BARAT DAYA": 480000,
  "PAPUA TENGAH": 580000,
  "PAPUA SELATAN": 580000,
  "PAPUA PEGUNUNGAN": 580000,
};

// Helper function to map common cities/regencies to their province.
const KOTA_TO_PROVINSI_MAP: Record<string, string> = {
  // ACEH
  "banda aceh": "ACEH", "sabang": "ACEH", "lhokseumawe": "ACEH", "langsa": "ACEH", "subulussalam": "ACEH", "pidie": "ACEH", "bireuen": "ACEH",
  
  // SUMATERA UTARA
  "medan": "SUMATERA UTARA", "binjai": "SUMATERA UTARA", "tebing tinggi": "SUMATERA UTARA", "pematangsiantar": "SUMATERA UTARA", "tanjungbalai": "SUMATERA UTARA", "sibolga": "SUMATERA UTARA", "padangsidempuan": "SUMATERA UTARA", "gunungsitoli": "SUMATERA UTARA", "deli serdang": "SUMATERA UTARA",
  
  // RIAU
  "pekanbaru": "RIAU", "dumai": "RIAU", "bengkalis": "RIAU", "indragiri": "RIAU", "kampar": "RIAU", "pelalawan": "RIAU", "rokan": "RIAU", "siak": "RIAU",
  
  // KEPULAUAN RIAU
  "tanjung pinang": "KEPULAUAN RIAU", "batam": "KEPULAUAN RIAU", "bintan": "KEPULAUAN RIAU", "karimun": "KEPULAUAN RIAU", "natuna": "KEPULAUAN RIAU", "anambas": "KEPULAUAN RIAU",
  
  // JAMBI
  "jambi": "JAMBI", "sungai penuh": "JAMBI", "batanghari": "JAMBI", "bungo": "JAMBI", "kerinci": "JAMBI", "merangin": "JAMBI",
  
  // SUMATERA BARAT
  "padang": "SUMATERA BARAT", "bukittinggi": "SUMATERA BARAT", "pariaman": "SUMATERA BARAT", "payakumbuh": "SUMATERA BARAT", "sawahlunto": "SUMATERA BARAT", "solok": "SUMATERA BARAT", "padang panjang": "SUMATERA BARAT",
  
  // SUMATERA SELATAN
  "palembang": "SUMATERA SELATAN", "prabumulih": "SUMATERA SELATAN", "lubuklinggau": "SUMATERA SELATAN", "pagar alam": "SUMATERA SELATAN", "banyuasin": "SUMATERA SELATAN", "muara enim": "SUMATERA SELATAN", "ogan": "SUMATERA SELATAN",
  
  // LAMPUNG
  "bandar lampung": "LAMPUNG", "metro": "LAMPUNG", "mesuji": "LAMPUNG", "pesawaran": "LAMPUNG", "tanggamus": "LAMPUNG", "tulang bawang": "LAMPUNG", "way kanan": "LAMPUNG",
  
  // BENGKULU
  "bengkulu": "BENGKULU", "rejang lebong": "BENGKULU", "mukomuko": "BENGKULU", "seluma": "BENGKULU", "kaur": "BENGKULU",
  
  // BANGKA BELITUNG
  "pangkal pinang": "BANGKA BELITUNG", "bangka": "BANGKA BELITUNG", "belitung": "BANGKA BELITUNG",
  
  // BANTEN
  "serang": "BANTEN", "cilegon": "BANTEN", "tangerang": "BANTEN", "tangerang selatan": "BANTEN", "lebak": "BANTEN", "pandeglang": "BANTEN",
  
  // JAWA BARAT
  "bandung": "JAWA BARAT", "bogor": "JAWA BARAT", "depok": "JAWA BARAT", "bekasi": "JAWA BARAT", "cimahi": "JAWA BARAT", "cirebon": "JAWA BARAT", "sukabumi": "JAWA BARAT", "tasikmalaya": "JAWA BARAT", "banjar": "JAWA BARAT", "karawang": "JAWA BARAT", "purwakarta": "JAWA BARAT", "cianjur": "JAWA BARAT", "garut": "JAWA BARAT", "indramayu": "JAWA BARAT", "majalengka": "JAWA BARAT", "kuningan": "JAWA BARAT", "sumedang": "JAWA BARAT", "ciamis": "JAWA BARAT", "pangandaran": "JAWA BARAT",
  
  // D.K.I. JAKARTA
  "jakarta": "D.K.I. JAKARTA", "jakarta pusat": "D.K.I. JAKARTA", "jakarta utara": "D.K.I. JAKARTA", "jakarta barat": "D.K.I. JAKARTA", "jakarta selatan": "D.K.I. JAKARTA", "jakarta timur": "D.K.I. JAKARTA", "kepulauan seribu": "D.K.I. JAKARTA",
  
  // JAWA TENGAH
  "semarang": "JAWA TENGAH", "surakarta": "JAWA TENGAH", "solo": "JAWA TENGAH", "tegal": "JAWA TENGAH", "pekalongan": "JAWA TENGAH", "magelang": "JAWA TENGAH", "salatiga": "JAWA TENGAH", "banyumas": "JAWA TENGAH", "purwokerto": "JAWA TENGAH", "cilacap": "JAWA TENGAH", "kendal": "JAWA TENGAH", "brebes": "JAWA TENGAH", "pemalang": "JAWA TENGAH", "batang": "JAWA TENGAH", "demak": "JAWA TENGAH", "jepara": "JAWA TENGAH", "kudus": "JAWA TENGAH", "pati": "JAWA TENGAH", "boyolali": "JAWA TENGAH", "klaten": "JAWA TENGAH", "sukoharjo": "JAWA TENGAH", "wonogiri": "JAWA TENGAH", "karanganyar": "JAWA TENGAH", "sragen": "JAWA TENGAH", "blora": "JAWA TENGAH", "rembang": "JAWA TENGAH", "temanggung": "JAWA TENGAH", "wonosobo": "JAWA TENGAH", "purworejo": "JAWA TENGAH", "kebumen": "JAWA TENGAH", "banjarnegara": "JAWA TENGAH", "purbalingga": "JAWA TENGAH",
  
  // D.I. YOGYAKARTA
  "yogyakarta": "D.I. YOGYAKARTA", "jogja": "D.I. YOGYAKARTA", "sleman": "D.I. YOGYAKARTA", "bantul": "D.I. YOGYAKARTA", "gunungkidul": "D.I. YOGYAKARTA", "kulon progo": "D.I. YOGYAKARTA",
  
  // JAWA TIMUR
  "surabaya": "JAWA TIMUR", "malang": "JAWA TIMUR", "batu": "JAWA TIMUR", "kediri": "JAWA TIMUR", "blitar": "JAWA TIMUR", "madiun": "JAWA TIMUR", "mojokerto": "JAWA TIMUR", "pasuruan": "JAWA TIMUR", "probolinggo": "JAWA TIMUR", "sidoarjo": "JAWA TIMUR", "gresik": "JAWA TIMUR", "banyuwangi": "JAWA TIMUR", "jember": "JAWA TIMUR", "situbondo": "JAWA TIMUR", "bondowoso": "JAWA TIMUR", "lumajang": "JAWA TIMUR", "tuban": "JAWA TIMUR", "bojonegoro": "JAWA TIMUR", "lamongan": "JAWA TIMUR", "jombang": "JAWA TIMUR", "nganjuk": "JAWA TIMUR", "tulungagung": "JAWA TIMUR", "trenggalek": "JAWA TIMUR", "pacitan": "JAWA TIMUR", "ponorogo": "JAWA TIMUR", "magetan": "JAWA TIMUR", "ngawi": "JAWA TIMUR", "pamekasan": "JAWA TIMUR", "bangkalan": "JAWA TIMUR", "sampang": "JAWA TIMUR", "sumenep": "JAWA TIMUR",
  
  // BALI
  "denpasar": "BALI", "badung": "BALI", "bangli": "BALI", "buleleng": "BALI", "gianyar": "BALI", "jembrana": "BALI", "karangasem": "BALI", "klungkung": "BALI", "tabanan": "BALI",
  
  // NUSA TENGGARA BARAT
  "mataram": "NUSA TENGGARA BARAT", "bima": "NUSA TENGGARA BARAT", "lombok": "NUSA TENGGARA BARAT", "dompu": "NUSA TENGGARA BARAT", "sumbawa": "NUSA TENGGARA BARAT",
  
  // NUSA TENGGARA TIMUR
  "kupang": "NUSA TENGGARA TIMUR", "ende": "NUSA TENGGARA TIMUR", "flores": "NUSA TENGGARA TIMUR", "manggarai": "NUSA TENGGARA TIMUR", "sumba": "NUSA TENGGARA TIMUR", "belu": "NUSA TENGGARA TIMUR", "alor": "NUSA TENGGARA TIMUR", "sikka": "NUSA TENGGARA TIMUR", "ngada": "NUSA TENGGARA TIMUR", "rote": "NUSA TENGGARA TIMUR",
  
  // KALIMANTAN BARAT
  "pontianak": "KALIMANTAN BARAT", "singkawang": "KALIMANTAN BARAT", "ketapang": "KALIMANTAN BARAT", "sintang": "KALIMANTAN BARAT", "sambas": "KALIMANTAN BARAT", "bengkayang": "KALIMANTAN BARAT", "kapuas": "KALIMANTAN BARAT",
  
  // KALIMANTAN TENGAH
  "palangka raya": "KALIMANTAN TENGAH", "palangkaraya": "KALIMANTAN TENGAH", "kotawaringin": "KALIMANTAN TENGAH", "barito": "KALIMANTAN TENGAH",
  
  // KALIMANTAN SELATAN
  "banjarmasin": "KALIMANTAN SELATAN", "banjarbaru": "KALIMANTAN SELATAN", "kabupaten banjar": "KALIMANTAN SELATAN", "barito kuala": "KALIMANTAN SELATAN", "tanah laut": "KALIMANTAN SELATAN", "tanah bumbu": "KALIMANTAN SELATAN", "kotabaru": "KALIMANTAN SELATAN", "hulu sungai": "KALIMANTAN SELATAN", "tabalong": "KALIMANTAN SELATAN",
  
  // KALIMANTAN TIMUR
  "samarinda": "KALIMANTAN TIMUR", "balikpapan": "KALIMANTAN TIMUR", "bontang": "KALIMANTAN TIMUR", "kutai": "KALIMANTAN TIMUR", "berau": "KALIMANTAN TIMUR", "paser": "KALIMANTAN TIMUR", "penajam": "KALIMANTAN TIMUR",
  
  // KALIMANTAN UTARA
  "tarakan": "KALIMANTAN UTARA", "bulungan": "KALIMANTAN UTARA", "malinau": "KALIMANTAN UTARA", "nunukan": "KALIMANTAN UTARA", "tana tidung": "KALIMANTAN UTARA",
  
  // SULAWESI UTARA
  "manado": "SULAWESI UTARA", "bitung": "SULAWESI UTARA", "tomohon": "SULAWESI UTARA", "kotamobagu": "SULAWESI UTARA", "minahasa": "SULAWESI UTARA", "bolaang mongondow": "SULAWESI UTARA", "sangihe": "SULAWESI UTARA", "talaud": "SULAWESI UTARA",
  
  // GORONTALO
  "gorontalo": "GORONTALO", "boalemo": "GORONTALO", "bone bolango": "GORONTALO", "pohuwato": "GORONTALO",
  
  // SULAWESI BARAT
  "mamuju": "SULAWESI BARAT", "majene": "SULAWESI BARAT", "polewali mandar": "SULAWESI BARAT", "mamasa": "SULAWESI BARAT", "pasangkayu": "SULAWESI BARAT",
  
  // SULAWESI SELATAN
  "makassar": "SULAWESI SELATAN", "parepare": "SULAWESI SELATAN", "palopo": "SULAWESI SELATAN", "gowa": "SULAWESI SELATAN", "bone": "SULAWESI SELATAN", "maros": "SULAWESI SELATAN", "pangkajene": "SULAWESI SELATAN", "barru": "SULAWESI SELATAN", "soppeng": "SULAWESI SELATAN", "wajo": "SULAWESI SELATAN", "luwu": "SULAWESI SELATAN", "tana toraja": "SULAWESI SELATAN", "toraja utara": "SULAWESI SELATAN", "bulukumba": "SULAWESI SELATAN", "bantaeng": "SULAWESI SELATAN", "jeneponto": "SULAWESI SELATAN", "takalar": "SULAWESI SELATAN", "sinjai": "SULAWESI SELATAN", "selayar": "SULAWESI SELATAN",
  
  // SULAWESI TENGAH
  "palu": "SULAWESI TENGAH", "donggala": "SULAWESI TENGAH", "parigi moutong": "SULAWESI TENGAH", "poso": "SULAWESI TENGAH", "toli-toli": "SULAWESI TENGAH", "buol": "SULAWESI TENGAH", "morowali": "SULAWESI TENGAH", "banggai": "SULAWESI TENGAH", "tojo una-una": "SULAWESI TENGAH",
  
  // SULAWESI TENGGARA
  "kendari": "SULAWESI TENGGARA", "baubau": "SULAWESI TENGGARA", "konawe": "SULAWESI TENGGARA", "kolaka": "SULAWESI TENGGARA", "muna": "SULAWESI TENGGARA", "buton": "SULAWESI TENGGARA", "bombana": "SULAWESI TENGGARA", "wakatobi": "SULAWESI TENGGARA",
  
  // MALUKU
  "ambon": "MALUKU", "tual": "MALUKU", "maluku": "MALUKU", "buru": "MALUKU", "seram": "MALUKU", "aru": "MALUKU",
  
  // MALUKU UTARA
  "ternate": "MALUKU UTARA", "tidore": "MALUKU UTARA", "halmahera": "MALUKU UTARA", "morotai": "MALUKU UTARA", "sula": "MALUKU UTARA",
  
  // PAPUA
  "jayapura": "PAPUA", "keerom": "PAPUA", "sarmi": "PAPUA", "biak": "PAPUA", "supiori": "PAPUA", "waropen": "PAPUA", "yapen": "PAPUA", "mamberamo": "PAPUA",
  
  // PAPUA BARAT
  "manokwari": "PAPUA BARAT", "fakfak": "PAPUA BARAT", "kaimana": "PAPUA BARAT", "teluk bintuni": "PAPUA BARAT", "teluk wondama": "PAPUA BARAT", "pegunungan arfak": "PAPUA BARAT", "manokwari selatan": "PAPUA BARAT",
  
  // PAPUA BARAT DAYA
  "sorong": "PAPUA BARAT DAYA", "raja ampat": "PAPUA BARAT DAYA", "tambrauw": "PAPUA BARAT DAYA", "maybrat": "PAPUA BARAT DAYA",
  
  // PAPUA TENGAH
  "nabire": "PAPUA TENGAH", "mimika": "PAPUA TENGAH", "timika": "PAPUA TENGAH", "paniai": "PAPUA TENGAH", "deiyai": "PAPUA TENGAH", "dogiyai": "PAPUA TENGAH", "intan jaya": "PAPUA TENGAH", "puncak": "PAPUA TENGAH", "puncak jaya": "PAPUA TENGAH",
  
  // PAPUA SELATAN
  "merauke": "PAPUA SELATAN", "boven digoel": "PAPUA SELATAN", "mappi": "PAPUA SELATAN", "asmat": "PAPUA SELATAN",
  
  // PAPUA PEGUNUNGAN
  "jayawijaya": "PAPUA PEGUNUNGAN", "wamena": "PAPUA PEGUNUNGAN", "lanny jaya": "PAPUA PEGUNUNGAN", "mamberamo tengah": "PAPUA PEGUNUNGAN", "nduga": "PAPUA PEGUNUNGAN", "tolikara": "PAPUA PEGUNUNGAN", "yahukimo": "PAPUA PEGUNUNGAN", "yalimo": "PAPUA PEGUNUNGAN", "pegunungan bintang": "PAPUA PEGUNUNGAN",
};

/**
 * Gets the standard rate (Uang Harian) for a given city or regency name.
 */
export function getRateForKota(destination: string): number {
  if (!destination) return 430000;
  
  let normalized = destination.toLowerCase()
    .replace(/^kota\s+/, '')
    .replace(/^kab\.\s+/, '')
    .replace(/^kabupaten\s+/, '')
    .trim();

  if (KOTA_TO_PROVINSI_MAP[normalized]) {
    const province = KOTA_TO_PROVINSI_MAP[normalized];
    return STANDAR_BIAYA_LUAR_DAERAH[province] || 430000;
  }

  for (const [kota, province] of Object.entries(KOTA_TO_PROVINSI_MAP)) {
    if (normalized.includes(kota)) {
      return STANDAR_BIAYA_LUAR_DAERAH[province] || 430000;
    }
  }

  for (const [province, rate] of Object.entries(STANDAR_BIAYA_LUAR_DAERAH)) {
    if (normalized.includes(province.toLowerCase())) {
      return rate;
    }
  }

  return 430000;
}

/**
 * Gets the province name for a given city.
 */
export function getProvinsiForKota(destination: string): string {
  if (!destination) return "";
  
  let normalized = destination.toLowerCase()
    .replace(/^kota\s+/, '')
    .replace(/^kab\.\s+/, '')
    .replace(/^kabupaten\s+/, '')
    .trim();

  if (KOTA_TO_PROVINSI_MAP[normalized]) {
    return KOTA_TO_PROVINSI_MAP[normalized];
  }

  for (const [kota, province] of Object.entries(KOTA_TO_PROVINSI_MAP)) {
    if (normalized.includes(kota)) {
      return province;
    }
  }

  for (const province of Object.keys(STANDAR_BIAYA_LUAR_DAERAH)) {
    if (normalized.includes(province.toLowerCase())) {
      return province;
    }
  }

  return "";
}
