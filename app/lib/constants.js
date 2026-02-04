// Audio Reciters
export const AUDIO_RECITERS = [
  {
    id: "alafasy",
    label: "Mishary Rashid Alafasy",
    baseUrl: "https://everyayah.com/data/Alafasy_64kbps"
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
  min: { arabic: 0.6, translation: 0.8 },
  max: { arabic: 1.4, translation: 1.3 },
  default: { arabic: 1, translation: 1 }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  bookmarks: "quran_bookmarks",
  notes: "quran_notes",
  plan: "quran_plan",
  fontScale: "quran_font_scale",
  lastRead: "quran_last_read",
  reciter: "quran_reciter"
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
