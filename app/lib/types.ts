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
  translations?: Record<string, AyahTranslation>;
};

export type Bookmark = string;

export type ReadingPlan = {
  startDate: string;
  perDay: number;
  startSurah: number;
  startAyah: number;
};
