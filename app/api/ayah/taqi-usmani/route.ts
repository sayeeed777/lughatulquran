import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TAQI_USMANI_BOOK_ID = 13645;

export const revalidate = 86400;

const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49,
  62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28,
  28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

type TranslationEntry = {
  book?: { id?: number | string };
  translation?: Record<string, unknown>;
  [key: string]: unknown;
};

const parsePositiveInteger = (value: string | null) => {
  if (!value || !/^\d{1,3}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const extractTranslationText = (entry?: TranslationEntry | null): string | null => {
  if (!entry) return null;
  const record = entry as Record<string, unknown>;
  const translation = record.translation as Record<string, unknown> | undefined;

  return (
    (record["translation-content"] as string | undefined) ??
    (record["translation-text"] as string | undefined) ??
    (record.translation_content as string | undefined) ??
    (record.translation_text as string | undefined) ??
    (translation?.["translation-content"] as string | undefined) ??
    (translation?.["translation-text"] as string | undefined) ??
    (translation?.translation_text as string | undefined) ??
    null
  );
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const surah = parsePositiveInteger(searchParams.get("surah"));
  const ayah = parsePositiveInteger(searchParams.get("ayah"));

  if (!surah || !ayah) {
    return NextResponse.json(
      { error: "Missing surah or ayah." },
      { status: 400 }
    );
  }

  if (surah < 1 || surah > 114) {
    return NextResponse.json(
      { error: "Invalid surah number." },
      { status: 400 }
    );
  }

  const maxAyah = SURAH_AYAH_COUNTS[surah - 1] || 0;
  if (ayah < 1 || ayah > maxAyah) {
    return NextResponse.json(
      { error: "Invalid ayah number." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.quranpedia.net/v1/translations/${surah}/${ayah}/en`,
      {
        next: { revalidate: 86400 },
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch translation." },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as unknown;
    const results = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { result?: unknown }).result)
        ? ((payload as { result: unknown[] }).result)
        : Array.isArray((payload as { data?: unknown }).data)
          ? ((payload as { data: unknown[] }).data)
          : [];

    const match = (results as TranslationEntry[]).find(
      (entry) => Number(entry?.book?.id) === TAQI_USMANI_BOOK_ID
    );

    let text = extractTranslationText(match);

    if (!text) {
      const fallbackResponse = await fetch(
        `https://api.quranpedia.net/v1/translation/${TAQI_USMANI_BOOK_ID}/${surah}/${ayah}`,
        {
          next: { revalidate: 86400 },
          headers: {
            Accept: "application/json"
          }
        }
      );

      if (fallbackResponse.ok) {
        const fallbackPayload = (await fallbackResponse.json()) as Record<string, unknown> | null;
        text =
          (fallbackPayload?.translation_text as string | undefined) ??
          (fallbackPayload?.translationText as string | undefined) ??
          (fallbackPayload?.["translation-text"] as string | undefined) ??
          (fallbackPayload?.["translation-content"] as string | undefined) ??
          null;
      }
    }

    if (!text) {
      return NextResponse.json(
        { error: "Translation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach Quranpedia API." },
      { status: 502 }
    );
  }
}
