/**
 * Re-export all types from the central types module.
 * This keeps existing imports from "./types" working across the home hooks.
 */
export type {
  Ayah,
  AyahTranslation,
  ReadingPlan,
  Surah,
  SurahData,
  MemorizeConfig,
  Reciter,
  ArabicFont,
  Word,
  WordByAyah,
  WordBySurah,
  NowPlaying,
  LastRead,
  Notes,
  NoteTarget,
  FontScale,
  SetState
} from "../../lib/types";
