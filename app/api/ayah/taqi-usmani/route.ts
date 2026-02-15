import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SURAH_AYAH_COUNTS } from "../../../lib/constants";
import { getAyahTranslation } from "../../../lib/translationLoader";

const parsePositiveInteger = (value: string | null) => {
  if (!value || !/^\d{1,3}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

  const text = await getAyahTranslation("en-taqi-usmani", surah, ayah);

  if (!text) {
    return NextResponse.json(
      { error: "Translation not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ text });
}
