import { NextResponse } from "next/server";
import { SURAHS } from "../../data/surahs";

export async function GET() {
  const surahs = SURAHS.map((s) => ({
    number: s.number,
    name: s.arabicName,
    englishName: s.englishName,
    englishNameTranslation: s.translation,
    numberOfAyahs: s.ayahCount,
    revelationType: s.revelationType
  }));

  return NextResponse.json({ surahs });
}
