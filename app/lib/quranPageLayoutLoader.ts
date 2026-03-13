import "server-only";

import { readFile } from "fs/promises";
import { join } from "path";

export type MushafPageSegment = {
  type: "word" | "marker";
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  position: number | null;
  glyph?: string;
  text: string;
};

export type MushafPageLine = {
  lineNumber: number;
  segments: MushafPageSegment[];
};

export type MushafPageLayout = {
  pageNumber: number;
  mushaf: string;
  firstVerseKey: string;
  lastVerseKey: string;
  versesCount: number;
  surahs: number[];
  lines: MushafPageLine[];
};

const pageLayoutCache = new Map<number, MushafPageLayout | null>();

export const getPageLayout = async (pageNumber: number): Promise<MushafPageLayout | null> => {
  if (pageLayoutCache.has(pageNumber)) {
    return pageLayoutCache.get(pageNumber) || null;
  }

  const fileName = `page-${String(pageNumber).padStart(3, "0")}.json`;
  const filePath = join(process.cwd(), "app/data/quran-page-layouts", fileName);

  try {
    const content = await readFile(filePath, "utf-8");
    const layout = JSON.parse(content) as MushafPageLayout;
    pageLayoutCache.set(pageNumber, layout);
    return layout;
  } catch {
    pageLayoutCache.set(pageNumber, null);
    return null;
  }
};
