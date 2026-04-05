import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiRateGuard } from "../../../../lib/apiRateLimit";
import { getLocalChapterAudioTiming, hasLocalAudioTimingReciter } from "../../../../lib/audioTimings";

export const revalidate = 86400;

type RouteContext = {
  params:
    | { reciter: string; surah: string }
    | Promise<{ reciter: string; surah: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const blocked = await apiRateGuard(request, "api-audio-timings");
  if (blocked) return blocked;

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

  return NextResponse.json(payload);
}
