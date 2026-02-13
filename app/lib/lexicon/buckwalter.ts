const BUCKWALTER_TO_ARABIC: Record<string, string> = {
  "'": "ء",
  "|": "آ",
  ">": "أ",
  "&": "ؤ",
  "<": "إ",
  "}": "ئ",
  A: "ا",
  b: "ب",
  p: "ة",
  t: "ت",
  v: "ث",
  j: "ج",
  H: "ح",
  x: "خ",
  d: "د",
  "*": "ذ",
  r: "ر",
  z: "ز",
  s: "س",
  $: "ش",
  S: "ص",
  D: "ض",
  T: "ط",
  Z: "ظ",
  E: "ع",
  g: "غ",
  f: "ف",
  q: "ق",
  k: "ك",
  l: "ل",
  m: "م",
  n: "ن",
  h: "ه",
  w: "و",
  Y: "ى",
  y: "ي"
};

export const buckwalterToArabic = (value?: string | null) => {
  if (!value) return "";
  let out = "";
  for (const char of value) {
    out += BUCKWALTER_TO_ARABIC[char] ?? char;
  }
  return out;
};

/** Normalize an Arabic root key by stripping diacritics and unifying letter variants. */
export const normalizeRootKey = (value: string) =>
  value
    .normalize("NFC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/\s+/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ؤئ]/g, "ء")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();

