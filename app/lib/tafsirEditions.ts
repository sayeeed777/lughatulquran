export type TafsirEditionSource = "local" | "remote";

export type TafsirEdition = {
  id: string;
  label: string;
  source: TafsirEditionSource;
};

export const TAFSIR_EDITIONS: readonly TafsirEdition[] = [
  { id: "en-tafsir-maarif-ul-quran", label: "Maarif-ul-Quran", source: "remote" },
  { id: "en-maududi", label: "Maududi (Notes)", source: "local" },
  { id: "bn-tafsir-ahsanul-bayaan", label: "Bangla Tafsir (Ahsanul Bayaan)", source: "local" },
  { id: "bengali-mokhtasar", label: "Bangla Tafsir (Mokhtasar)", source: "local" },
  { id: "hi-tafsir-farooq", label: "Hindi Tafseer (Farooq & Ahmed)", source: "local" },
  { id: "en-kashf-al-asrar-tafsir", label: "Kashf Al-Asrar", source: "remote" },
  { id: "en-al-jalalayn", label: "Al-Jalalayn", source: "remote" },
  { id: "ur-tafsir-bayan-ul-quran", label: "Tafsir Bayan ul Quran (Dr. Israr Ahmad)", source: "remote" },
  { id: "en-asbab-al-nuzul-by-al-wahidi", label: "Asbab Al-Nuzul by Al-Wahidi", source: "remote" },
  { id: "en-al-qushairi-tafsir", label: "Al Qushairi Tafsir", source: "remote" },
  { id: "en-tafsir-ibn-abbas", label: "Tanwir al-Miqbas min Tafsir Ibn Abbas", source: "remote" },
  { id: "en-tafsir-al-tustari", label: "Tafsir al-Tustari", source: "remote" }
] as const;

export const LOCAL_TAFSIR_EDITION_IDS = new Set(
  TAFSIR_EDITIONS.filter((edition) => edition.source === "local").map((edition) => edition.id)
);

export const REMOTE_TAFSIR_EDITION_IDS = new Set(
  TAFSIR_EDITIONS.filter((edition) => edition.source === "remote").map((edition) => edition.id)
);

export const isKnownTafsirEdition = (editionId: string) =>
  LOCAL_TAFSIR_EDITION_IDS.has(editionId) || REMOTE_TAFSIR_EDITION_IDS.has(editionId);

export const isLocalTafsirEdition = (editionId: string) =>
  LOCAL_TAFSIR_EDITION_IDS.has(editionId);
