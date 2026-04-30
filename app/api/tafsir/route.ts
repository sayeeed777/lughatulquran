import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SURAH_AYAH_COUNTS } from "../../lib/constants";
import { isKnownTafsirEdition, isLocalTafsirEdition } from "../../lib/tafsirEditions";
import { getAyahTranslation } from "../../lib/translationLoader";

export const revalidate = 2592000;

const TAFSIR_BASE_URLS = [
  "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir",
  "https://cdn.statically.io/gh/spa5k/tafsir_api/main/tafsir",
  "https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir"
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
    if (Array.isArray(perSurah?.ayahs)) {
      return "";
    }
  }
  return "";
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const edition = (url.searchParams.get("edition") || "").trim();
  const surah = Number(url.searchParams.get("surah"));
  const ayah = Number(url.searchParams.get("ayah"));

  if (!edition || !isKnownTafsirEdition(edition)) {
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
    const rawText = isLocalTafsirEdition(edition)
      ? (await getAyahTranslation(edition, surah, ayah)) || ""
      : await fetchAyahText(edition, surah, ayah);

    const text = rawText ? cleanTafsirText(rawText) : "";
    return NextResponse.json({
      edition,
      surah,
      ayah,
      text
    });
  } catch {
    return NextResponse.json({ error: "Unable to load tafsir." }, { status: 502 });
  }
}
