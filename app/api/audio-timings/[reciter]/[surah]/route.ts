import { NextResponse } from "next/server";
import {
  LOCAL_AUDIO_TIMING_RECITERS,
  getLocalChapterAudioTiming,
  hasLocalAudioTimingReciter
} from "../../../../lib/audioTimings";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
};

type RouteContext = {
  params:
    | { reciter: string; surah: string }
    | Promise<{ reciter: string; surah: string }>;
};

export function generateStaticParams() {
  return LOCAL_AUDIO_TIMING_RECITERS.flatMap((reciter) =>
    Array.from({ length: 114 }, (_, i) => ({
      reciter,
      surah: String(i + 1)
    }))
  );
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { reciter, surah } = await Promise.resolve(params);
  const reciterId = String(reciter || "").trim();
  const surahNumber = Number(surah);

  if (!reciterId || !hasLocalAudioTimingReciter(reciterId)) {
    return NextResponse.json({ error: "Unsupported reciter." }, { status: 404 });
  }

  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: "Invalid surah." }, { status: 400 });
  }

  const payload = await getLocalChapterAudioTiming(reciterId, surahNumber);
  if (!payload) {
    return NextResponse.json({ error: "Timing snapshot not found." }, { status: 404 });
  }

  return NextResponse.json(payload, { headers: CACHE_HEADERS });
}
