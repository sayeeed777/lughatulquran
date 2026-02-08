import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const revalidate = 2592000;

const TAFSIR_BASE_URLS = [
  "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir",
  "https://cdn.statically.io/gh/spa5k/tafsir_api/main/tafsir",
  "https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir"
];

const ALLOWED_EDITIONS = new Set([
  "en-tafsir-maarif-ul-quran",
  "en-kashf-al-asrar-tafsir",
  "en-al-jalalayn"
]);

const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49,
  62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28,
  28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

type TafsirResponse = {
  text?: string;
  surah?: number;
  ayah?: number;
};

type TafsirSurahResponse = {
  ayahs?: Array<{ ayah?: number; text?: string }>;
};

const cleanTafsirText = (input: string) => {
  let text = input;
  text = text.replace(/(\p{L})\uFFFD(\p{L})/gu, "$1$2");
  text = text.replace(/\uFFFD+/gu, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
};

const fetchJson = async (url: string) => {
  try {
    const response = await fetch(url, { next: { revalidate } });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
};

const fetchAyahText = async (edition: string, surah: number, ayah: number) => {
  for (const base of TAFSIR_BASE_URLS) {
    const perAyahUrl = `${base}/${edition}/${surah}/${ayah}.json`;
    const perAyah = (await fetchJson(perAyahUrl)) as TafsirResponse | null;
    if (perAyah?.text) {
      return perAyah.text;
    }

    const perSurahUrl = `${base}/${edition}/${surah}.json`;
    const perSurah = (await fetchJson(perSurahUrl)) as TafsirSurahResponse | null;
    const match = perSurah?.ayahs?.find((item) => item?.ayah === ayah);
    if (match?.text) {
      return match.text;
    }
  }
  return "";
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const edition = (url.searchParams.get("edition") || "").trim();
  const surah = Number(url.searchParams.get("surah"));
  const ayah = Number(url.searchParams.get("ayah"));

  if (!edition || !ALLOWED_EDITIONS.has(edition)) {
    return NextResponse.json({ error: "Invalid tafsir edition." }, { status: 400 });
  }
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return NextResponse.json({ error: "Invalid surah number." }, { status: 400 });
  }
  const maxAyah = SURAH_AYAH_COUNTS[surah - 1] || 0;
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > maxAyah) {
    return NextResponse.json({ error: "Invalid ayah number." }, { status: 400 });
  }

  try {
    const text = await fetchAyahText(edition, surah, ayah);
    return NextResponse.json({
      edition,
      surah,
      ayah,
      text: text ? cleanTafsirText(text) : ""
    });
  } catch {
    return NextResponse.json({ error: "Unable to load tafsir." }, { status: 502 });
  }
}
