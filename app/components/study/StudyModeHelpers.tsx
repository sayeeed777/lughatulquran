import type { ReactNode } from "react";

type TajweedTagName = "tajweed" | "span";

type TajweedStackNode = {
  tag: TajweedTagName;
  className: string | null;
  children: ReactNode[];
};

export type TajweedLegendItem = {
  swatchClass: string;
  label: string;
  description: string;
};

export type TafsirEdition = {
  id: string;
  label: string;
};

export const hasLexiconData = (
  wordsByAyah?: Record<number, Array<{ root?: string; lemma?: string }>>
) => {
  if (!wordsByAyah) return false;
  for (const words of Object.values(wordsByAyah)) {
    for (const word of words || []) {
      if (word?.root || word?.lemma) {
        return true;
      }
    }
  }
  return false;
};

const sanitizeClassName = (value: string) => value.replace(/[^a-zA-Z0-9 _-]/g, "").trim();

const extractClassName = (attrs: string) => {
  const match = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const raw = (match?.[1] || match?.[2] || match?.[3] || "").trim();
  return raw ? sanitizeClassName(raw) : "";
};

export const renderTajweedMarkup = (markup: string): ReactNode[] => {
  if (!markup) return [""];

  const root: ReactNode[] = [];
  const stack: TajweedStackNode[] = [];
  let keyCounter = 0;

  const append = (node: ReactNode) => {
    if (node === null || node === undefined || node === "") return;
    if (stack.length) {
      stack[stack.length - 1]?.children.push(node);
    } else {
      root.push(node);
    }
  };

  const appendText = (text: string) => {
    if (!text) return;
    append(text);
  };

  let cursor = 0;
  while (cursor < markup.length) {
    const lt = markup.indexOf("<", cursor);
    if (lt === -1) {
      appendText(markup.slice(cursor));
      break;
    }
    appendText(markup.slice(cursor, lt));

    const gt = markup.indexOf(">", lt + 1);
    if (gt === -1) {
      appendText(markup.slice(lt));
      break;
    }

    const rawTag = markup.slice(lt + 1, gt).trim();
    cursor = gt + 1;

    if (!rawTag) continue;

    if (rawTag.startsWith("/")) {
      const tagName = rawTag.slice(1).split(/\s+/, 1)[0] as TajweedTagName | string;
      const node = stack.pop();
      if (!node || node.tag !== tagName) {
        return [markup.replace(/<[^>]*>/g, "")];
      }
      const key = `${node.tag}-${keyCounter++}`;
      if (node.tag === "tajweed") {
        const className = node.className ? `tajweed ${node.className}` : "tajweed";
        append(
          <span key={key} className={className}>
            {node.children}
          </span>
        );
      } else if (node.tag === "span") {
        append(
          <span key={key} className={node.className || undefined}>
            {node.children}
          </span>
        );
      }
      continue;
    }

    const tagName = rawTag.split(/\s+/, 1)[0] as TajweedTagName | string;
    if (tagName !== "tajweed" && tagName !== "span") {
      continue;
    }

    const className = extractClassName(rawTag);
    stack.push({
      tag: tagName,
      className: className || null,
      children: []
    });
  }

  if (stack.length) {
    return [markup.replace(/<[^>]*>/g, "")];
  }

  return root;
};

export const TAJWEED_LEGEND: TajweedLegendItem[] = [
  {
    swatchClass: "ham_wasl",
    label: "Hamzat al-wasl",
    description: "Connecting hamza; usually dropped when linking from the previous word."
  },
  {
    swatchClass: "laam_shamsiyah",
    label: "Laam shamsiyah (sun letters)",
    description: "Lam is assimilated; the following letter is emphasized."
  },
  {
    swatchClass: "laam_qamariyah",
    label: "Laam qamariyah (moon letters)",
    description: "Lam is pronounced clearly before the following letter."
  },
  {
    swatchClass: "madda_normal",
    label: "Madd (natural)",
    description: "Elongate 2 counts (2 harakah)."
  },
  {
    swatchClass: "madda_permissible",
    label: "Madd (permissible)",
    description: "Elongate 2–4 counts (varies by recitation)."
  },
  {
    swatchClass: "madda_obligatory",
    label: "Madd (obligatory)",
    description: "Elongate 4–5 counts."
  },
  {
    swatchClass: "madda_necessary",
    label: "Madd (necessary)",
    description: "Elongate 6 counts."
  },
  {
    swatchClass: "qalqalah",
    label: "Qalqalah (echo)",
    description: "A slight echo/bounce sound on certain letters when they carry sukoon."
  },
  {
    swatchClass: "ikhafa",
    label: "Ikhfaa / Ikhafa",
    description: "Concealment with nasalization (ghunnah) for ~2 counts."
  },
  {
    swatchClass: "ikhafa_shafawi",
    label: "Ikhfaa shafawi",
    description: "Labial concealment (mim before ba) with ghunnah for ~2 counts."
  },
  {
    swatchClass: "iqlab",
    label: "Iqlab",
    description: "Change nun sakinah/tanween before ba into a hidden mim with ghunnah."
  },
  {
    swatchClass: "idgham_with_ghunnah",
    label: "Idgham (with ghunnah)",
    description: "Merge with nasalization (ghunnah) for ~2 counts."
  },
  {
    swatchClass: "idgham_without_ghunnah",
    label: "Idgham (without ghunnah)",
    description: "Merge without nasalization."
  },
  {
    swatchClass: "idgham_shafawi",
    label: "Idgham shafawi",
    description: "Mim merging (mim before mim) with ghunnah."
  },
  {
    swatchClass: "ghunnah",
    label: "Ghunnah",
    description: "Nasalization (usually 2 counts) on nun/mim with shaddah."
  },
  {
    swatchClass: "slnt",
    label: "Silent letter",
    description: "A letter present in the script that is not pronounced."
  }
];

export const TAFSIR_EDITIONS: readonly TafsirEdition[] = [
  { id: "en-tafsir-maarif-ul-quran", label: "Maarif-ul-Quran" },
  { id: "en-kashf-al-asrar-tafsir", label: "Kashf Al-Asrar" },
  { id: "en-al-jalalayn", label: "Al-Jalalayn" }
] as const;
