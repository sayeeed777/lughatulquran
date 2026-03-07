import { ImageResponse } from "next/og";
import { SURAH_BY_SLUG } from "../../data/surahs";

export const runtime = "nodejs";
export const revalidate = 86400;
export const alt = "OpenFurqan — Surah with English, Bangla & Urdu Translations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  if (!surah) {
    return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#0b1c20" }} />, { ...size });
  }

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "rgba(216, 179, 106, 0.12)",
            border: "2px solid rgba(216, 179, 106, 0.3)",
            fontSize: 32,
            fontWeight: 700,
            color: "#d8b36a",
            marginBottom: 28,
          }}
        >
          {surah.number}
        </div>

        <div
          style={{
            fontSize: 46,
            fontWeight: 700,
            color: "#f2eee6",
            letterSpacing: "-0.02em",
            marginBottom: 10,
          }}
        >
          Surah {surah.englishName}
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#d8b36a",
            marginBottom: 28,
          }}
        >
          {surah.translation}
        </div>

        <div
          style={{
            fontSize: 18,
            color: "#a8b0ba",
            textAlign: "center",
          }}
        >
          {`${surah.ayahCount} Ayahs · ${surah.revelationType} · OpenFurqan`}
        </div>
      </div>
    ),
    { ...size }
  );
}
