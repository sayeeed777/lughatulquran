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
  },
  {
    id: "abdulbasit-mujawwad",
    label: "Abdul Basit (Mujawwad)",
    baseUrl: "https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps"
  },
  {
    id: "ghamdi",
    label: "Saad Al-Ghamdi",
    baseUrl: "https://everyayah.com/data/Ghamadi_40kbps"
  },
  {
    id: "ajmy",
    label: "Ahmed ibn Ali al-Ajmy",
    baseUrl: "https://everyayah.com/data/Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com"
  },
  {
    id: "ali-jabir",
    label: "Abdullah Ali Jabir",
    baseUrl: "https://everyayah.com/data/Ali_Jaber_64kbps"
  },
  {
    id: "tunaiji",
    label: "Khalifah Al Tunaiji",
    baseUrl: "https://everyayah.com/data/khalefa_al_tunaiji_64kbps"
  },
  {
    id: "husary-muallim",
    label: "Mahmoud Khalil Al-Husary (Muallim)",
    baseUrl: "https://everyayah.com/data/Husary_Muallim_128kbps"
  },
  {
    id: "dussary",
    label: "Yasser Ad-Dussary",
    baseUrl: "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps"
  }
];

export const DEFAULT_RECITER_ID = "alafasy";
export const DEFAULT_RECITER =
  AUDIO_RECITERS.find((reciter) => reciter.id === DEFAULT_RECITER_ID) ??
  AUDIO_RECITERS[0];

// Arabic Fonts
export const ARABIC_FONTS = [
  {
    id: "scheherazade-new",
    label: "Scheherazade New",
    css: '"Scheherazade New","Amiri","Traditional Arabic",serif'
  },
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
  { id: "en-sahih", label: "Sahih International", short: "Sahih" },
  { id: "en-arberry", label: "A.J. Arberry", short: "Arberry" },
  { id: "en-pickthall", label: "Pickthall", short: "Pickthall" },
  { id: "en-yusufali", label: "Yusuf Ali", short: "Yusuf Ali" }
];

export const ALL_TRANSLATIONS = [
  ...INLINE_TRANSLATIONS,
  { id: "en-taqi-usmani", label: "Mufti Taqi Usmani", short: "Taqi Usmani" },
  { id: "en-haleem", label: "Abdel Haleem", short: "Haleem" },
  { id: "en-muhsin-khan", label: "Al-Hilali & Khan", short: "Hilali & Khan" },
  { id: "en-maarif-ul-quran", label: "Maarif-ul-Quran", short: "Maarif" },
  { id: "en-ahmedraza", label: "Kanz al-Iman (English)", short: "Kanz (EN)" },
  { id: "hi-hindi", label: "Hindi (Azizul Haq Al-Umari)", short: "Hindi" },
  { id: "si-naseem-ismail", label: "Sinhala (Naseem Ismail)", short: "Sinhala" },
  { id: "fr-hamidullah", label: "French (Muhammad Hamidullah)", short: "Francais" },
  { id: "de-bubenheim", label: "German (Bubenheim & Elyas)", short: "Deutsch" },
  { id: "es-cortes", label: "Spanish (Julio Cortes)", short: "Español" },
  { id: "tr-ates", label: "Turkish (Suleyman Ates)", short: "Turkish" },
  { id: "bn-bengali", label: "Bangla (Muhiuddin Khan)", short: "Bangla" },
  { id: "bn-hoque", label: "Bangla (Zohurul Hoque)", short: "Hoque" },
  { id: "ur-kanzuliman", label: "Kanz al-Iman (Urdu)", short: "Kanz (UR)" },
  { id: "bayan-ul-quran", label: "Bayan-ul-Quran (Urdu)", short: "Bayan" }
];

// Prayer Settings (UI)
export const PRAYER_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "BD", name: "Bangladesh" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "EG", name: "Egypt" },
  { code: "TR", name: "Turkey" },
  { code: "JO", name: "Jordan" },
  { code: "IQ", name: "Iraq" },
  { code: "SY", name: "Syria" },
  { code: "LB", name: "Lebanon" },
  { code: "YE", name: "Yemen" },
  { code: "MA", name: "Morocco" },
  { code: "DZ", name: "Algeria" },
  { code: "TN", name: "Tunisia" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "BN", name: "Brunei" },
  { code: "MV", name: "Maldives" },
  { code: "AF", name: "Afghanistan" },
  { code: "IR", name: "Iran" }
];

export const PRAYER_METHODS = [
  { id: "MWL", label: "Muslim World League" },
  { id: "ISNA", label: "ISNA" },
  { id: "EGYPT", label: "Egyptian General Authority of Survey" },
  { id: "MAKKAH", label: "Umm Al-Qura, Makkah" },
  { id: "KARACHI", label: "University of Islamic Sciences, Karachi" },
  { id: "DUBAI", label: "Dubai" },
  { id: "QATAR", label: "Qatar" },
  { id: "KUWAIT", label: "Kuwait" },
  { id: "SINGAPORE", label: "Singapore (MUIS)" },
  { id: "TURKEY", label: "Turkey (Diyanet)" },
  { id: "MOROCCO", label: "Morocco" }
];

export const PRAYER_MADHABS = [
  { id: "HANAFI", label: "Hanafi" },
  { id: "SHAFI", label: "Shafi" }
];



// Reading Plan Defaults
// NOTE: startDate is intentionally empty — it must be set at runtime (client-side)
// to avoid server/client date mismatches during SSR/hydration.
export const DEFAULT_PLAN = {
  startDate: "",
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
  noteTarget: "quran_note_target",
  noteDraft: "quran_note_draft",
  plan: "quran_plan",
  fontScale: "quran_font_scale",
  translations: "quran_translations",
  showWordByWord: "quran_show_word_by_word",
  showRootDetails: "quran_show_root_details",
  showTransliteration: "quran_show_transliteration",
  showStudyTransliteration: "quran_show_study_transliteration",
  surahPanelCollapsed: "quran_surah_panel_collapsed",
  studyPanelCollapsed: "quran_study_panel_collapsed",
  playbackRate: "quran_playback_rate",
  lastRead: "quran_last_read",
  studySession: "quran_study_session",
  quickNotes: "quran_quick_notes",
  reciter: "quran_reciter",
  arabicFont: "quran_arabic_font",
  theme: "quran_theme",
  prayerSettings: "quran_prayer_settings",
  readingStats: "quran_reading_stats",
  recitationStorageNoticeDismissed: "quran_recitation_storage_notice_dismissed",
  memorizationProgress: "quran_memorization_progress",
  memorizationDeckState: "quran_memorization_deck_state",
  memorizationSessionHistory: "quran_memorization_session_history",
  memorizationSettings: "quran_memorization_settings",
  memorizationAutoPlay: "quran_memorization_autoplay",
  studyReadingProgress: "quran_study_reading_progress"
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

// Ayah counts per surah (1-indexed by surah-1)
export const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49,
  62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28,
  28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

// Surahs that don't have Bismillah
export const NO_BISMILLAH_SURAHS = [1, 9]; // Al-Fatihah (it's the first ayah), At-Tawbah (no bismillah)
