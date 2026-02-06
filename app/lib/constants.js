// Audio Reciters
export const AUDIO_RECITERS = [
  {
    id: "alafasy",
    label: "Mishary Rashid Alafasy",
    baseUrl: "https://everyayah.com/data/Alafasy_64kbps"
  },
  {
    id: "sudais",
    label: "Abdurrahmaan As-Sudais",
    baseUrl: "https://everyayah.com/data/Abdurrahmaan_As-Sudais_64kbps"
  },
  {
    id: "shuraim",
    label: "Saood ash-Shuraym",
    baseUrl: "https://everyayah.com/data/Saood_ash-Shuraym_64kbps"
  },
  {
    id: "shaatree",
    label: "Abu Bakr Ash-Shaatree",
    baseUrl: "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_64kbps"
  },
  {
    id: "maher",
    label: "Maher Al-Muaiqly",
    baseUrl: "https://everyayah.com/data/Maher_AlMuaiqly_64kbps"
  },
  {
    id: "hani",
    label: "Hani Rifai",
    baseUrl: "https://everyayah.com/data/Hani_Rifai_64kbps"
  },
  {
    id: "abdulbasit",
    label: "Abdul Basit (Murattal)",
    baseUrl: "https://everyayah.com/data/Abdul_Basit_Murattal_64kbps"
  },
  {
    id: "husary",
    label: "Mahmoud Khalil Al-Husary",
    baseUrl: "https://everyayah.com/data/Husary_64kbps"
  },
  {
    id: "minshawi",
    label: "Mohamed Siddiq Al-Minshawi",
    baseUrl: "https://everyayah.com/data/Minshawy_Mujawwad_64kbps"
  }
];

export const DEFAULT_RECITER = AUDIO_RECITERS[0];

// Arabic Fonts
export const ARABIC_FONTS = [
  {
    id: "kfgqpc-hafs",
    label: "KFGQPC Uthmanic Hafs",
    css: '"KFGQPC Hafs","UthmanicHafs","Traditional Arabic","Scheherazade New",serif'
  },
  {
    id: "kfgqpc-hafssmart",
    label: "KFGQPC Hafs Smart",
    css: '"KFGQPC Hafs Smart","UthmanicHafs","Traditional Arabic","Scheherazade New",serif'
  },
  {
    id: "uthman-naskh",
    label: "Uthman Taha Naskh",
    css: '"Uthman Naskh","UthmanicHafs","Traditional Arabic","Scheherazade New",serif'
  }
];

// Translations
export const INLINE_TRANSLATIONS = [
  { id: "en.sahih", label: "Sahih International", short: "Sahih" },
  { id: "en.arberry", label: "A.J. Arberry", short: "Arberry" },
  { id: "en.pickthall", label: "Pickthall", short: "Pickthall" },
  { id: "en.yusufali", label: "Yusuf Ali", short: "Yusuf Ali" }
];

export const ALL_TRANSLATIONS = [
  ...INLINE_TRANSLATIONS,
  { id: "taqi-usmani", label: "Mufti Taqi Usmani", short: "Taqi Usmani" }
];

// Helper to get local date string
const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};

// Reading Plan Defaults
export const DEFAULT_PLAN = {
  startDate: getLocalDateString(),
  perDay: 10,
  startSurah: 1,
  startAyah: 1
};

// Font Scale Limits
export const FONT_SCALE = {
  min: { arabic: 0.8, translation: 0.9 },
  max: { arabic: 1.4, translation: 1.4 },
  default: { arabic: 1, translation: 1 }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  bookmarks: "quran_bookmarks",
  notes: "quran_notes",
  plan: "quran_plan",
  fontScale: "quran_font_scale",
  lastRead: "quran_last_read",
  reciter: "quran_reciter",
  arabicFont: "quran_arabic_font"
};

// Keyboard Shortcuts
export const SHORTCUTS = {
  nextAyah: ["ArrowDown", "j"],
  prevAyah: ["ArrowUp", "k"],
  playPause: [" "],
  toggleWordByWord: ["w"],
  toggleFocusMode: ["f"],
  search: ["/"],
  escape: ["Escape"]
};

// Bismillah Text (for display before surahs)
export const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
export const BISMILLAH_TRANSLATION = "In the name of Allah, the Entirely Merciful, the Especially Merciful";

// Surahs that don't have Bismillah
export const NO_BISMILLAH_SURAHS = [1, 9]; // Al-Fatihah (it's the first ayah), At-Tawbah (no bismillah)
