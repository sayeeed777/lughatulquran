import { NextResponse } from "next/server";
import { buckwalterToArabic } from "../../../../lib/lexicon/buckwalter";
import { getLaneEntry, hasLaneLexicon } from "../../../../lib/lexicon/lane";
import {
  getMorphologyIndex,
  getMorphologyLoadError,
  getRootLemmas,
  getRootReferences
} from "../../../../lib/lexicon/morphology";
import {
  getPrimaryRootMeaning,
  getPrimaryRootMeaningsLoadError,
  hasPrimaryRootMeanings
} from "../../../../lib/lexicon/rootMeanings";

export const revalidate = 86400;

type RouteContext = {
  params: { root: string } | Promise<{ root: string }>;
};

const sanitizeRoot = (value: string) => value.trim().slice(0, 32);
const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

export async function GET(request: Request, { params }: RouteContext) {
  const resolvedParams = await Promise.resolve(params);
  const rawRoot = safeDecodeURIComponent(resolvedParams?.root || "");
  if (rawRoot === null) {
    return NextResponse.json({ error: "Invalid root encoding." }, { status: 400 });
  }
  const root = sanitizeRoot(rawRoot);

  if (!root) {
    return NextResponse.json({ error: "Missing root." }, { status: 400 });
  }

  const url = new URL(request.url);
  const isSummaryMode = url.searchParams.get("mode") === "summary";
  const rootMeaning = await getPrimaryRootMeaning(root);

  if (isSummaryMode) {
    return NextResponse.json({
      root,
      rootArabic: buckwalterToArabic(root),
      rootMeaning,
      rootMeaningSource: "primary-root-meanings",
      coreMeanings: [],
      definitions: [],
      lemmas: [],
      references: [],
      primaryRootMeaningsAvailable: await hasPrimaryRootMeanings(),
      primaryRootMeaningsError: rootMeaning ? null : getPrimaryRootMeaningsLoadError(),
      laneAvailable: false,
      morphologyAvailable: false,
      morphologyError: null,
      fullPayload: false
    });
  }

  const [index, laneEntry] = await Promise.all([
    getMorphologyIndex(),
    getLaneEntry(root)
  ]);
  const references = getRootReferences(index, root, 120);
  const lemmas = getRootLemmas(index, root, 20);

  const coreMeanings = laneEntry?.coreMeanings || [];
  const definitions = laneEntry?.definitions || [];

  return NextResponse.json({
    root,
    rootArabic: laneEntry?.rootArabic || buckwalterToArabic(root),
    rootMeaning,
    rootMeaningSource: "primary-root-meanings",
    coreMeanings,
    definitions,
    lemmas,
    references,
    primaryRootMeaningsAvailable: await hasPrimaryRootMeanings(),
    primaryRootMeaningsError: rootMeaning ? null : getPrimaryRootMeaningsLoadError(),
    laneAvailable: await hasLaneLexicon(),
    morphologyAvailable: Boolean(index),
    morphologyError: index ? null : getMorphologyLoadError(),
    fullPayload: true
  });
}
