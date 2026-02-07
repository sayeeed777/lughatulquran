export type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type AyahTranslation = {
  text?: string;
};

export type Ayah = {
  number: number;
  arabic?: string;
  arabicTajweed?: string | null;
  pageNumber?: number | null;
  translations?: Record<string, AyahTranslation>;
};

export type Bookmark = string;

export type ReadingPlan = {
  startDate: string;
  perDay: number;
  startSurah: number;
  startAyah: number;
};

export type SurahData = {
  surah?: Surah;
  ayahs?: Ayah[];
};
