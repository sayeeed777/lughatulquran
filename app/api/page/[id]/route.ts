import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ALL_TRANSLATIONS } from "../../../lib/constants";
import { apiRateGuard } from "../../../lib/apiRateLimit";
import { getPageLayout } from "../../../lib/quranPageLayoutLoader";
import { getPagePayload } from "../../../lib/quranScopeLoader";

const EDITIONS = ALL_TRANSLATIONS;

export const revalidate = 86400;

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

const parseTranslationIds = (request: NextRequest): string[] => {
  const allowedTranslationIds = new Set(EDITIONS.map((edition) => edition.id));
  const translationsParam = request.nextUrl.searchParams.get("translations") || "";
  const requestedIds = translationsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => allowedTranslationIds.has(value));

  const translationIds: string[] = [];
  const seen = new Set<string>();

  for (const translationId of (requestedIds.length ? requestedIds : ["en-arberry"])) {
    if (seen.has(translationId)) continue;
    if (!allowedTranslationIds.has(translationId)) continue;
    seen.add(translationId);
    translationIds.push(translationId);
  }

  return translationIds;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const blocked = await apiRateGuard(request, "api-page");
  if (blocked) return blocked;

  const { id } = await Promise.resolve(params);
  const pageNumber = Number(id);

  if (!id || !Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 604) {
    return NextResponse.json({ error: "Invalid page id." }, { status: 400 });
  }

  try {
    const transliterationParam = String(
      request.nextUrl.searchParams.get("transliteration") || ""
    ).toLowerCase();
    const includeTransliteration = ["1", "true", "yes", "on"].includes(
      transliterationParam
    );
    const translationIds = parseTranslationIds(request);
    const payload = await getPagePayload(
      pageNumber,
      translationIds,
      includeTransliteration
    );
    const layout = await getPageLayout(pageNumber);

    if (!payload) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    return NextResponse.json({
      scope: {
        type: "page",
        id: pageNumber,
        label: `Page ${pageNumber}`,
        versesCount: payload.entry.verses_count,
        firstVerseKey: payload.entry.first_verse_key,
        lastVerseKey: payload.entry.last_verse_key
      },
      sections: payload.sections,
      ayahs: payload.ayahs,
      layout,
      arabicScript: "uthmani",
      translationOrder: translationIds
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load page data." },
      { status: 502 }
    );
  }
}
