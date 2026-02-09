import { clamp } from "./utils";

const SCALE_STEP = 0.05;
const DEFAULT_ARABIC_FONT_CLASS = "arabic-font-scheherazade-new";

const quantizeScale = (value: number, min: number, max: number) => {
  const safeValue = Number.isFinite(value) ? value : 1;
  const bounded = clamp(safeValue, min, max);
  const stepped = Math.round(bounded / SCALE_STEP) * SCALE_STEP;
  return Number(stepped.toFixed(2));
};

const toScaleToken = (value: number) => Math.round(value * 100);

export const getArabicScaleClass = (value: number) =>
  `arabic-scale-${toScaleToken(quantizeScale(value, 0.6, 2))}`;

export const getTranslationScaleClass = (value: number) =>
  `translation-scale-${toScaleToken(quantizeScale(value, 0.7, 1.6))}`;

export const getArabicFontClass = (fontId: string) => {
  if (!fontId) return DEFAULT_ARABIC_FONT_CLASS;
  const normalized = fontId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
  return normalized ? `arabic-font-${normalized}` : DEFAULT_ARABIC_FONT_CLASS;
};
