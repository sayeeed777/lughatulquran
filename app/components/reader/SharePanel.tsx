"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Ayah } from "../../lib/types";
import { normalizeQuranDisplayArabic } from "../../lib/utils";
import { SURAH_BY_NUMBER } from "../../data/surahs";

type SharePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  ayah: Ayah | null;
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  selectedTranslation: string;
};

const SOCIAL_LINKS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    getUrl: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    id: "x",
    label: "X",
    color: "#000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    getUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    getUrl: (text: string, url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    color: "#0088cc",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    getUrl: (text: string, url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

type ImageTextScaleOptions = {
  arabicScale: number;
  translationScale: number;
};

type ImageBackgroundId =
  | "emerald"
  | "midnight"
  | "sand"
  | "royal"
  | "rose"
  | "sage"
  | "olive"
  | "parchment";

type ImageBackgroundOption = {
  id: ImageBackgroundId;
  label: string;
  swatch: string;
  base: [string, string, string];
  glow: string;
  glowMid: string;
  warmth: string;
  accent: string;
  accentSoft: string;
  gold: string;
  footerGlow: string;
  text: string;
  translation: string;
  brand: string;
  footerText: string;
  footerMuted: string;
  vignetteInner: string;
  vignetteMid: string;
  shadow: string;
};

const IMAGE_BACKGROUNDS: ImageBackgroundOption[] = [
  {
    id: "emerald",
    label: "Emerald",
    swatch: "linear-gradient(135deg, #0a2f27 0%, #2e6a5f 100%)",
    base: ["#0a2f27", "#0c1b1e", "#060f12"],
    glow: "rgba(111, 212, 177, 0.30)",
    glowMid: "rgba(46, 106, 95, 0.12)",
    warmth: "rgba(216, 179, 106, 0.16)",
    accent: "rgba(111, 212, 177, 0.95)",
    accentSoft: "rgba(111, 212, 177, 0.35)",
    gold: "rgba(216, 179, 106, 0.75)",
    footerGlow: "rgba(111, 212, 177, 0.08)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "midnight",
    label: "Midnight",
    swatch: "linear-gradient(135deg, #061224 0%, #1d3a66 100%)",
    base: ["#071323", "#0b1722", "#05080f"],
    glow: "rgba(92, 154, 255, 0.26)",
    glowMid: "rgba(58, 98, 158, 0.12)",
    warmth: "rgba(216, 179, 106, 0.11)",
    accent: "rgba(131, 181, 255, 0.95)",
    accentSoft: "rgba(131, 181, 255, 0.32)",
    gold: "rgba(216, 179, 106, 0.78)",
    footerGlow: "rgba(92, 154, 255, 0.08)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "sand",
    label: "Sand",
    swatch: "linear-gradient(135deg, #3a2a18 0%, #8f6d3a 100%)",
    base: ["#2a2117", "#17130f", "#080706"],
    glow: "rgba(216, 179, 106, 0.24)",
    glowMid: "rgba(143, 109, 58, 0.12)",
    warmth: "rgba(111, 212, 177, 0.10)",
    accent: "rgba(216, 179, 106, 0.95)",
    accentSoft: "rgba(216, 179, 106, 0.30)",
    gold: "rgba(233, 201, 135, 0.82)",
    footerGlow: "rgba(216, 179, 106, 0.09)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "royal",
    label: "Royal",
    swatch: "linear-gradient(135deg, #201044 0%, #5e4bb6 100%)",
    base: ["#1b1238", "#111326", "#070711"],
    glow: "rgba(139, 116, 246, 0.24)",
    glowMid: "rgba(94, 75, 182, 0.12)",
    warmth: "rgba(216, 179, 106, 0.12)",
    accent: "rgba(164, 146, 255, 0.95)",
    accentSoft: "rgba(164, 146, 255, 0.30)",
    gold: "rgba(226, 195, 131, 0.80)",
    footerGlow: "rgba(139, 116, 246, 0.08)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "linear-gradient(135deg, #3a111f 0%, #9d5264 100%)",
    base: ["#351421", "#1a1016", "#080607"],
    glow: "rgba(222, 120, 146, 0.22)",
    glowMid: "rgba(157, 82, 100, 0.12)",
    warmth: "rgba(216, 179, 106, 0.12)",
    accent: "rgba(235, 143, 165, 0.95)",
    accentSoft: "rgba(235, 143, 165, 0.30)",
    gold: "rgba(225, 190, 126, 0.80)",
    footerGlow: "rgba(222, 120, 146, 0.08)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "sage",
    label: "Charcoal",
    swatch: "#282a2a",
    base: ["#282a2a", "#282a2a", "#282a2a"],
    glow: "rgba(0, 0, 0, 0)",
    glowMid: "rgba(0, 0, 0, 0)",
    warmth: "rgba(0, 0, 0, 0)",
    accent: "rgba(232, 234, 229, 0.95)",
    accentSoft: "rgba(232, 234, 229, 0.16)",
    gold: "rgba(232, 234, 229, 0.76)",
    footerGlow: "rgba(255, 255, 255, 0.035)",
    text: "rgba(240, 242, 237, 0.97)",
    translation: "rgba(240, 242, 237, 0.88)",
    brand: "rgba(240, 242, 237, 0.64)",
    footerText: "rgba(240, 242, 237, 0.88)",
    footerMuted: "rgba(240, 242, 237, 0.50)",
    vignetteInner: "rgba(0, 0, 0, 0.05)",
    vignetteMid: "rgba(0, 0, 0, 0.025)",
    shadow: "rgba(0, 0, 0, 0.34)",
  },
  {
    id: "olive",
    label: "Deep olive",
    swatch: "#62674f",
    base: ["#62674f", "#62674f", "#62674f"],
    glow: "rgba(0, 0, 0, 0)",
    glowMid: "rgba(0, 0, 0, 0)",
    warmth: "rgba(0, 0, 0, 0)",
    accent: "rgba(243, 240, 219, 0.95)",
    accentSoft: "rgba(243, 240, 219, 0.18)",
    gold: "rgba(248, 240, 204, 0.82)",
    footerGlow: "rgba(255, 255, 255, 0.03)",
    text: "rgba(250, 248, 235, 0.98)",
    translation: "rgba(250, 248, 235, 0.92)",
    brand: "rgba(250, 248, 235, 0.72)",
    footerText: "rgba(250, 248, 235, 0.95)",
    footerMuted: "rgba(250, 248, 235, 0.56)",
    vignetteInner: "rgba(0, 0, 0, 0.10)",
    vignetteMid: "rgba(0, 0, 0, 0.05)",
    shadow: "rgba(43, 46, 35, 0.40)",
  },
  {
    id: "parchment",
    label: "Parchment",
    swatch: "#efede4",
    base: ["#efede4", "#efede4", "#efede4"],
    glow: "rgba(0, 0, 0, 0)",
    glowMid: "rgba(0, 0, 0, 0)",
    warmth: "rgba(0, 0, 0, 0)",
    accent: "rgba(36, 36, 31, 0.95)",
    accentSoft: "rgba(36, 36, 31, 0.10)",
    gold: "rgba(36, 36, 31, 0.68)",
    footerGlow: "rgba(36, 36, 31, 0.025)",
    text: "rgba(32, 32, 28, 0.96)",
    translation: "rgba(32, 32, 28, 0.86)",
    brand: "rgba(32, 32, 28, 0.68)",
    footerText: "rgba(32, 32, 28, 0.9)",
    footerMuted: "rgba(32, 32, 28, 0.52)",
    vignetteInner: "rgba(255, 255, 255, 0)",
    vignetteMid: "rgba(255, 255, 255, 0)",
    shadow: "rgba(80, 76, 64, 0.16)",
  },
];

const DEFAULT_IMAGE_BACKGROUND: ImageBackgroundId = "emerald";

function getImageBackground(backgroundId: ImageBackgroundId): ImageBackgroundOption {
  return IMAGE_BACKGROUNDS.find((background) => background.id === backgroundId) || IMAGE_BACKGROUNDS[0];
}

/**
 * Emerald template — 4:5 portrait (1080×1350), Spotify-style.
 * Full-bleed emerald gradient with radial colour blobs, big Arabic,
 * small translation, bold footer bar with surah + ayah number.
 * Pure client-side canvas — no server cost.
 */
function generateEmeraldCard(
  arabic: string,
  translation: string,
  surahNameArabic: string,
  surahNameEnglish: string,
  surahNumber: number,
  ayahNumber: number,
  textScale: ImageTextScaleOptions = { arabicScale: 1, translationScale: 1 },
  backgroundId: ImageBackgroundId = DEFAULT_IMAGE_BACKGROUND,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));

    const width = 1080;
    const height = 1350; // 4:5 post aspect ratio
    canvas.width = width;
    canvas.height = height;

    const padX = 80;
    const background = getImageBackground(backgroundId);

    // --- Layer 1: base dark gradient ---
    const base = ctx.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, background.base[0]);
    base.addColorStop(0.55, background.base[1]);
    base.addColorStop(1, background.base[2]);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    // --- Layer 2: mint radial blob, top-right (toned down) ---
    const blobA = ctx.createRadialGradient(
      width * 0.88, height * 0.08, 0,
      width * 0.88, height * 0.08, width * 0.7,
    );
    blobA.addColorStop(0, background.glow);
    blobA.addColorStop(0.45, background.glowMid);
    blobA.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = blobA;
    ctx.fillRect(0, 0, width, height);

    // --- Layer 3: warm gold blob, pushed further into the corner and
    //    dimmed so it doesn't bleed into the translation area. ---
    const blobB = ctx.createRadialGradient(
      width * -0.05, height * 1.05, 0,
      width * -0.05, height * 1.05, width * 0.55,
    );
    blobB.addColorStop(0, background.warmth);
    blobB.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = blobB;
    ctx.fillRect(0, 0, width, height);

    // --- Layer 3b: content-area vignette — a soft dark wash centered
    //    where the text lives, so both Arabic and English read on a
    //    consistent darker background regardless of blob bleed. ---
    const vignette = ctx.createRadialGradient(
      width * 0.5, height * 0.55, width * 0.15,
      width * 0.5, height * 0.55, width * 0.75,
    );
    vignette.addColorStop(0, background.vignetteInner);
    vignette.addColorStop(0.6, background.vignetteMid);
    vignette.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // --- Layer 4: subtle noise via random tiny rects (very cheap) ---
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = background.text;
    for (let i = 0; i < 600; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();

    // --- Brand lockup (top-left) ---
    ctx.textAlign = "left";
    ctx.direction = "ltr";
    ctx.fillStyle = background.brand;
    ctx.font = `700 22px -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText("OPENFURQAN", padX, 100);

    // accent dot after wordmark
    ctx.beginPath();
    ctx.arc(padX + 176, 93, 4, 0, Math.PI * 2);
    ctx.fillStyle = background.accent;
    ctx.fill();

    // --- Surah name in Arabic (top-right, small, gold) ---
    ctx.textAlign = "right";
    ctx.direction = "rtl";
    ctx.fillStyle = background.gold;
    ctx.font = `28px "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;
    ctx.fillText(surahNameArabic, width - padX, 103);

    // --- Prepare Arabic text block ---
    const arabicLen = arabic.length;
    const baseArabicFontSize =
      arabicLen > 260 ? 46 :
      arabicLen > 180 ? 54 :
      arabicLen > 120 ? 64 :
      arabicLen > 70  ? 76 : 88;
    const arabicFontSize = Math.round(baseArabicFontSize * textScale.arabicScale);
    const arabicLineHeight = arabicFontSize * 1.7;

    ctx.font = `${arabicFontSize}px "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;
    const arabicLines = wrapText(ctx, arabic, width - padX * 2);

    // --- Prepare translation text ---
    const transLen = translation.length;
    const baseTransFontSize =
      transLen > 320 ? 24 :
      transLen > 200 ? 28 :
      transLen > 100 ? 32 : 36;
    const transFontSize = Math.round(baseTransFontSize * textScale.translationScale);
    const transLineHeight = transFontSize * 1.55;

    ctx.font = `400 ${transFontSize}px -apple-system, "Segoe UI", sans-serif`;
    const translationLines = wrapText(ctx, translation, width - padX * 2);

    // --- Compute vertical placement so content is balanced ---
    const topGuard = 160; // below brand row
    const bottomGuard = 180; // above footer bar
    const gapArabicTrans = 56;

    const arabicBlockH = arabicLines.length * arabicLineHeight;
    const transBlockH = translationLines.length * transLineHeight;
    const totalH = arabicBlockH + gapArabicTrans + transBlockH;
    const avail = height - topGuard - bottomGuard;
    const blockTop = topGuard + Math.max(0, (avail - totalH) / 2);

    // --- Render Arabic with subtle glow ---
    ctx.fillStyle = background.text;
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.font = `${arabicFontSize}px "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;
    ctx.shadowColor = background.accentSoft;
    ctx.shadowBlur = 28;
    arabicLines.forEach((line, i) => {
      const y = blockTop + arabicFontSize + i * arabicLineHeight;
      ctx.fillText(line, width / 2, y);
    });
    ctx.shadowBlur = 0;

    // --- Render translation (crisper + soft shadow for readability
    //     over any blob variations) ---
    ctx.fillStyle = background.translation;
    ctx.direction = "ltr";
    ctx.textAlign = "center";
    ctx.font = `400 ${transFontSize}px -apple-system, "Segoe UI", sans-serif`;
    ctx.shadowColor = background.shadow;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 1;
    const transStartY = blockTop + arabicBlockH + gapArabicTrans + transFontSize;
    translationLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, transStartY + i * transLineHeight);
    });
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // --- Footer ---
    // Two-column citation footer. Arabic surah name is already shown at the top.
    const barH = 150;
    const barY = height - barH;

    // subtle background tint so the footer has presence without a hard bar
    const barGrad = ctx.createLinearGradient(0, barY, 0, height);
    barGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    barGrad.addColorStop(1, background.footerGlow);
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, barY, width, barH);

    // hairline divider at the top of the footer
    ctx.fillStyle = background.gold.replace(/0\.\d+\)$/, "0.28)");
    ctx.fillRect(padX, barY, width - padX * 2, 1);

    // --- Left column ---
    const smallCapsLabel = `SŪRAT ${surahNameEnglish.toUpperCase()} · ${surahNumber}:${ayahNumber}`;
    ctx.fillStyle = background.footerText;
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.font = `700 26px -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText(smallCapsLabel, padX, barY + 72);

    // --- Right column ---
    ctx.textAlign = "right";
    ctx.direction = "ltr";
    ctx.fillStyle = background.footerText;
    ctx.globalAlpha = 0.72;
    ctx.font = `600 21px -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText("openfurqan.com", width - padX, barY + 72);
    ctx.globalAlpha = 1;

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image"));
      },
      "image/png",
      1,
    );
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export default function SharePanel({
  isOpen,
  onClose,
  ayah,
  surahNumber,
  surahName,
  surahNameArabic,
  selectedTranslation,
}: SharePanelProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [imageArabicScale, setImageArabicScale] = useState(100);
  const [imageTranslationScale, setImageTranslationScale] = useState(100);
  const [selectedImageBackground, setSelectedImageBackground] = useState<ImageBackgroundId>(DEFAULT_IMAGE_BACKGROUND);
  const panelRef = useRef<HTMLDivElement>(null);
  const previewRenderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPreviewRequestRef = useRef(0);

  // Close preview on Escape (takes precedence over closing the main panel)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewBlob(null);
      } else {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, previewUrl]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Clean up any preview URL on unmount / when panel closes
  useEffect(() => {
    if (isOpen) return;
    latestPreviewRequestRef.current += 1;
    if (previewRenderTimerRef.current) {
      clearTimeout(previewRenderTimerRef.current);
      previewRenderTimerRef.current = null;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewBlob(null);
    }
    setImageArabicScale(100);
    setImageTranslationScale(100);
    setSelectedImageBackground(DEFAULT_IMAGE_BACKGROUND);
  }, [isOpen, previewUrl]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }, []);

  if (!isOpen || !ayah) return null;

  const arabic = normalizeQuranDisplayArabic(ayah.arabic || "");
  const translationText = ayah.translations?.[selectedTranslation]?.text || "";
  const reference = `${surahName} ${surahNumber}:${ayah.number}`;
  const shareText = `${arabic}\n\n"${translationText}"\n\n— ${reference}\n\nopenfurqan.com`;

  const ayahUrl = (() => {
    const base = typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? window.location.origin
      : "https://openfurqan.com";
    const slug = SURAH_BY_NUMBER.get(surahNumber)?.slug || String(surahNumber);
    return `${base}/surah/${slug}/${ayah.number}`;
  })();

  const handleCopyText = async () => {
    const text = `${arabic}\n\n"${translationText}"\n\n— ${reference}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
      setTimeout(onClose, 800);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("Copied to clipboard");
      setTimeout(onClose, 800);
    }
  };

  const handleSocialShare = (id: string) => {
    const social = SOCIAL_LINKS.find((s) => s.id === id);
    if (!social) return;
    const url = social.getUrl(shareText, ayahUrl);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      showToast("Share not supported on this device");
      return;
    }
    try {
      await navigator.share({ title: reference, text: shareText, url: ayahUrl });
    } catch {
      // User cancelled — do nothing
    }
  };

  const renderPreviewImage = async (
    arabicScalePercent = imageArabicScale,
    translationScalePercent = imageTranslationScale,
    backgroundId = selectedImageBackground,
  ) => {
    const requestId = latestPreviewRequestRef.current + 1;
    latestPreviewRequestRef.current = requestId;

    await document.fonts.ready;
    const blob = await generateEmeraldCard(
      arabic,
      translationText,
      surahNameArabic,
      surahName,
      surahNumber,
      ayah.number,
      {
        arabicScale: arabicScalePercent / 100,
        translationScale: translationScalePercent / 100,
      },
      backgroundId,
    );
    const url = URL.createObjectURL(blob);

    if (requestId !== latestPreviewRequestRef.current) {
      URL.revokeObjectURL(url);
      return;
    }

    setPreviewBlob(blob);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return url;
    });
  };

  const schedulePreviewRender = (
    arabicScalePercent: number,
    translationScalePercent: number,
    backgroundId = selectedImageBackground,
  ) => {
    if (!previewUrl) return;
    if (previewRenderTimerRef.current) {
      clearTimeout(previewRenderTimerRef.current);
    }
    previewRenderTimerRef.current = setTimeout(() => {
      previewRenderTimerRef.current = null;
      void renderPreviewImage(arabicScalePercent, translationScalePercent, backgroundId).catch(() => {
        showToast("Failed to update image");
      });
    }, 180);
  };

  const handleShareImage = async () => {
    setGeneratingImage(true);
    try {
      await renderPreviewImage(imageArabicScale, imageTranslationScale, selectedImageBackground);
    } catch {
      showToast("Failed to generate image");
    } finally {
      setGeneratingImage(false);
    }
  };

  const closePreview = () => {
    latestPreviewRequestRef.current += 1;
    if (previewRenderTimerRef.current) {
      clearTimeout(previewRenderTimerRef.current);
      previewRenderTimerRef.current = null;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
  };

  const handleArabicScaleChange = (value: string) => {
    const nextScale = Number(value);
    setImageArabicScale(nextScale);
    schedulePreviewRender(nextScale, imageTranslationScale, selectedImageBackground);
  };

  const handleTranslationScaleChange = (value: string) => {
    const nextScale = Number(value);
    setImageTranslationScale(nextScale);
    schedulePreviewRender(imageArabicScale, nextScale, selectedImageBackground);
  };

  const handleResetImageScales = () => {
    setImageArabicScale(100);
    setImageTranslationScale(100);
    schedulePreviewRender(100, 100, selectedImageBackground);
  };

  const handleImageBackgroundChange = (backgroundId: ImageBackgroundId) => {
    setSelectedImageBackground(backgroundId);
    schedulePreviewRender(imageArabicScale, imageTranslationScale, backgroundId);
  };

  const getPreviewSliderStyle = (value: number) => ({
    ["--share-slider-progress" as string]: `${((value - 80) / 40) * 100}%`,
  });

  const handleSavePreview = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `${reference.replace(/[^a-zA-Z0-9]+/g, "-")}.png`;
    a.click();
    showToast("Image saved");
  };

  const handleSharePreview = async () => {
    if (!previewBlob) return;
    if (!navigator.share || !navigator.canShare) {
      // No native share — fall back to save.
      handleSavePreview();
      return;
    }
    try {
      const file = new File(
        [previewBlob],
        `${reference.replace(/[^a-zA-Z0-9]+/g, "-")}.png`,
        { type: "image/png" },
      );
      const shareData = { files: [file], title: reference };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        handleSavePreview();
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      showToast("Share failed");
    }
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="share-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Share ayah"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="share-handle" />

        {/* Ayah reference header */}
        <div className="share-header">
          <span className="share-reference">{reference}</span>
          <button className="share-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Social icons row */}
        <div className="share-socials">
          {SOCIAL_LINKS.map((social) => (
            <button
              key={social.id}
              className="share-social-btn"
              onClick={() => handleSocialShare(social.id)}
              aria-label={`Share on ${social.label}`}
              title={social.label}
            >
              <span className="share-social-icon" style={{ background: social.color }}>
                {social.icon}
              </span>
              <span className="share-social-label">{social.label}</span>
            </button>
          ))}
          <button
            className="share-social-btn"
            onClick={handleNativeShare}
            aria-label="More sharing options"
            title="More"
          >
            <span className="share-social-icon share-social-more">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </span>
            <span className="share-social-label">More</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="share-actions">
          <button className="share-action-btn" onClick={handleCopyText}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <span>Copy Text</span>
          </button>
          <button
            className="share-action-btn share-action-image"
            onClick={handleShareImage}
            disabled={generatingImage}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>{generatingImage ? "Generating..." : "Share as Image"}</span>
          </button>
        </div>

        {/* Toast */}
        {toast && <span className="share-toast">{toast}</span>}
      </div>

      {/* Preview modal — shows the generated image so the user can review
          it before saving or sharing. Click overlay / Escape closes it
          (without closing the main share panel underneath). */}
      {previewUrl && (
        <div
          className="share-preview-overlay"
          onClick={(e) => {
            e.stopPropagation();
            closePreview();
          }}
        >
          <div
            className="share-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-preview-topbar">
              <div className="share-preview-topbar-left">
                <span className="share-preview-title">Preview</span>
                <div className="share-preview-palettes" aria-label="Image background color">
                  {IMAGE_BACKGROUNDS.map((background) => (
                    <button
                      key={background.id}
                      type="button"
                      className={`share-preview-palette${selectedImageBackground === background.id ? " active" : ""}`}
                      style={{ ["--share-palette" as string]: background.swatch }}
                      onClick={() => handleImageBackgroundChange(background.id)}
                      aria-label={`${background.label} background`}
                      aria-pressed={selectedImageBackground === background.id}
                      title={background.label}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="share-preview-close"
                onClick={closePreview}
                aria-label="Close preview"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="share-preview-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Ayah card preview"
                className="share-preview-image"
              />
            </div>

            <div className="share-preview-controls">
              <div className="share-preview-controls-header">
                <span>Text size</span>
                <button type="button" onClick={handleResetImageScales}>
                  Reset
                </button>
              </div>
              <label className="share-preview-control">
                <span className="share-preview-control-label">
                  <span>Arabic</span>
                  <span>{imageArabicScale}%</span>
                </span>
                <input
                  type="range"
                  min="80"
                  max="120"
                  step="5"
                  value={imageArabicScale}
                  style={getPreviewSliderStyle(imageArabicScale)}
                  onChange={(event) => handleArabicScaleChange(event.target.value)}
                  aria-label="Arabic text size"
                />
              </label>
              <label className="share-preview-control">
                <span className="share-preview-control-label">
                  <span>English</span>
                  <span>{imageTranslationScale}%</span>
                </span>
                <input
                  type="range"
                  min="80"
                  max="120"
                  step="5"
                  value={imageTranslationScale}
                  style={getPreviewSliderStyle(imageTranslationScale)}
                  onChange={(event) => handleTranslationScaleChange(event.target.value)}
                  aria-label="English text size"
                />
              </label>
            </div>

            <div className="share-preview-actions">
              <button
                type="button"
                className="share-preview-btn share-preview-btn--ghost"
                onClick={handleSavePreview}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Save</span>
              </button>
              <button
                type="button"
                className="share-preview-btn share-preview-btn--primary"
                onClick={handleSharePreview}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
