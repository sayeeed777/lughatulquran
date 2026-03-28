import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiRateGuard } from "../../../lib/apiRateLimit";
import { getMemorizationDeck } from "../../../lib/memorizationDeckLoader";
import type { MemorizationCardMode, MemorizationScopeMode } from "../../../lib/types";

export const revalidate = 86400;

const VALID_SCOPE_MODES: MemorizationScopeMode[] = ["surah", "juz", "page"];
const VALID_CARD_MODES: MemorizationCardMode[] = [
  "arabic-to-meaning",
  "meaning-to-arabic",
  "first-words",
  "word-by-word-meaning"
];

export async function GET(request: NextRequest) {
  const blocked = await apiRateGuard(request, "api-memorization-deck");
  if (blocked) return blocked;

  const scopeMode = String(request.nextUrl.searchParams.get("scope") || "surah") as MemorizationScopeMode;
  const scopeId = Number(request.nextUrl.searchParams.get("id") || "1");
  const cardMode = String(
    request.nextUrl.searchParams.get("mode") || "arabic-to-meaning"
  ) as MemorizationCardMode;

  if (!VALID_SCOPE_MODES.includes(scopeMode)) {
    return NextResponse.json({ error: "Invalid memorization scope." }, { status: 400 });
  }

  if (!VALID_CARD_MODES.includes(cardMode)) {
    return NextResponse.json({ error: "Invalid memorization card mode." }, { status: 400 });
  }

  const max = scopeMode === "surah" ? 114 : scopeMode === "juz" ? 30 : 604;
  if (!Number.isInteger(scopeId) || scopeId < 1 || scopeId > max) {
    return NextResponse.json({ error: "Invalid memorization deck id." }, { status: 400 });
  }

  try {
    const payload = await getMemorizationDeck(scopeMode, scopeId, cardMode);
    if (!payload) {
      return NextResponse.json({ error: "Memorization deck not found." }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Unable to load memorization deck." },
      { status: 502 }
    );
  }
}
