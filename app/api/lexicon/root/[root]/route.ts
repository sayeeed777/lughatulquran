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

export async function GET(_request: Request, { params }: RouteContext) {
  const resolvedParams = await Promise.resolve(params);
  const rawRoot = decodeURIComponent(resolvedParams?.root || "");
  const root = sanitizeRoot(rawRoot);

  if (!root) {
    return NextResponse.json({ error: "Missing root." }, { status: 400 });
  }

  const index = await getMorphologyIndex();
  const laneEntry = getLaneEntry(root);
  const references = getRootReferences(index, root, 120);
  const lemmas = getRootLemmas(index, root, 20);
  const rootMeaning = getPrimaryRootMeaning(root);

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
    primaryRootMeaningsAvailable: hasPrimaryRootMeanings(),
    primaryRootMeaningsError: rootMeaning ? null : getPrimaryRootMeaningsLoadError(),
    laneAvailable: hasLaneLexicon(),
    morphologyAvailable: Boolean(index),
    morphologyError: index ? null : getMorphologyLoadError()
  });
}
