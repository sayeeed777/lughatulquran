import { NextResponse } from "next/server";

const TAQI_USMANI_BOOK_ID = 13645;

export const revalidate = 86400;

export async function GET(request) {
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

    const payload = await response.json();
    const results = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.result)
        ? payload.result
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    const match = results.find(
      (entry) => Number(entry?.book?.id) === TAQI_USMANI_BOOK_ID
    );

    let text =
      match?.["translation-content"] ||
      match?.["translation-text"] ||
      match?.translation_content ||
      match?.translation_text ||
      match?.translation?.["translation-content"] ||
      match?.translation?.["translation-text"] ||
      match?.translation?.translation_text ||
      null;

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
        const fallbackPayload = await fallbackResponse.json();
        text =
          fallbackPayload?.translation_text ||
          fallbackPayload?.translationText ||
          fallbackPayload?.["translation-text"] ||
          fallbackPayload?.["translation-content"] ||
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
