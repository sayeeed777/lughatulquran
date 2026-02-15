import { ImageResponse } from "next/og";
import { SURAH_BY_SLUG } from "../../../data/surahs";

export const alt = "OpenFurqan — Ayah";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type QuranText = Record<string, Record<string, { ar: string; en: string }>>;

let quranText: QuranText | null = null;
function getQuranText(): QuranText {
  if (!quranText) {
    quranText = require("../../../data/quran-text.json") as QuranText;
  }
  return quranText;
}

export default async function OGImage({ params }: { params: Promise<{ slug: string; ayah: string }> }) {
  const { slug, ayah } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  const ayahNum = Number(ayah);

  if (!surah || !Number.isInteger(ayahNum) || ayahNum < 1 || ayahNum > surah.ayahCount) {
    return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#0b1c20" }} />, { ...size });
  }

  const text = getQuranText();
  const verse = text[String(surah.number)]?.[String(ayahNum)];

  const englishText = verse?.en
    ? verse.en.length > 220 ? verse.en.slice(0, 220) + "..." : verse.en
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a3b42 0%, #0b1c20 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: 60,
        }}
      >
        {/* Surah number badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "rgba(216, 179, 106, 0.12)",
            border: "2px solid rgba(216, 179, 106, 0.3)",
            fontSize: 28,
            fontWeight: 700,
            color: "#d8b36a",
            marginBottom: 24,
          }}
        >
          {`${surah.number}:${ayahNum}`}
        </div>

        {/* Surah + Ayah info */}
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: "#f2eee6",
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          {`Surah ${surah.englishName} \u2014 Ayah ${ayahNum}`}
        </div>

        {/* Translation name */}
        <div
          style={{
            fontSize: 22,
            color: "#d8b36a",
            marginBottom: 28,
          }}
        >
          {surah.translation}
        </div>

        {/* English verse text */}
        {englishText && (
          <div
            style={{
              fontSize: 20,
              color: "#a8b0ba",
              textAlign: "center",
              lineHeight: 1.6,
              maxWidth: "85%",
              marginBottom: 28,
            }}
          >
            {`\u201C${englishText}\u201D`}
          </div>
        )}

        {/* Meta */}
        <div
          style={{
            display: "flex",
            gap: 20,
            fontSize: 16,
            color: "#4a5568",
          }}
        >
          <span>{`${surah.ayahCount} Ayahs \u00B7 ${surah.revelationType} \u00B7 OpenFurqan`}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
