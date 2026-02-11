import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loadPrayerLocations, searchPrayerLocations } from "../../lib/prayerLocations";

export const revalidate = 21600;

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryCode = String(searchParams.get("countryCode") || "")
    .toUpperCase()
    .trim();
  const query = String(searchParams.get("q") || "").trim();
  const limit = Number(searchParams.get("limit") || 20);

  if (countryCode && !COUNTRY_CODE_PATTERN.test(countryCode)) {
    return NextResponse.json(
      { error: "Invalid countryCode. Use ISO 2-letter code." },
      { status: 400 }
    );
  }

  if (query.length > 80) {
    return NextResponse.json(
      { error: "Query is too long. Max 80 characters." },
      { status: 400 }
    );
  }

  try {
    const locations = await loadPrayerLocations();
    const items = searchPrayerLocations(locations, { countryCode, query, limit });

    return NextResponse.json({
      source: "geonames",
      total: items.length,
      items
    });
  } catch {
    return NextResponse.json(
      { error: "Prayer locations are temporarily unavailable." },
      { status: 502 }
    );
  }
}
