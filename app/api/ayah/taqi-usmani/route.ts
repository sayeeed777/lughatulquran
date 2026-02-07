import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TAQI_USMANI_BOOK_ID = 13645;

export const revalidate = 86400;

type TranslationEntry = {
  book?: { id?: number | string };
  translation?: Record<string, unknown>;
  [key: string]: unknown;
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
  const surah = searchParams.get("surah");
  const ayah = searchParams.get("ayah");

  if (!surah || !ayah) {
    return NextResponse.json(
      { error: "Missing surah or ayah." },
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
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reach Quranpedia API." },
      { status: 502 }
    );
  }
}
