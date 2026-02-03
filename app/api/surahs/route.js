import { NextResponse } from "next/server";

const SURAH_LIST_ENDPOINT = "https://api.alquran.cloud/v1/surah";

export const revalidate = 86400;

export async function GET() {
  try {
    const response = await fetch(SURAH_LIST_ENDPOINT, {
      next: { revalidate: 86400 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch surah list." },
        { status: 502 }
      );
    }

    const payload = await response.json();

    if (!payload || !payload.data) {
      return NextResponse.json(
        { error: "Unexpected response from Quran API." },
        { status: 502 }
      );
    }

    const surahs = payload.data.map((surah) => ({
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      numberOfAyahs: surah.numberOfAyahs,
      revelationType: surah.revelationType
    }));

    return NextResponse.json({ surahs });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reach Quran API." },
      { status: 502 }
    );
  }
}
