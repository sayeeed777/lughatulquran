// Local safety corrections for word timing snapshots.
// Keep this list intentionally tiny: only proven fixes and truly broken rows.

export const KNOWN_TIMING_POSITION_FIXES: Record<string, number[]> = {
  // Quran.com timing rows are malformed for these openings, but the intended
  // word order is unambiguous from the ayah text.
  "husary:38:1": [1, 2, 3, 4],
  "husary:50:1": [1, 2, 3]
};

export const DISABLED_WORD_HIGHLIGHT_AYAHS: Record<string, Record<number, number[]>> = {
  // These rows contain out-of-range word positions, so highlighting can land on
  // a non-existent word. Safer to suppress highlighting for the ayah.
  alafasy: {
    37: [130]
  },
  husary: {
    37: [130]
  }
};

export const getTimingPositionFix = (
  reciterId: string,
  surahNumber: number,
  ayahNumber: number
) => KNOWN_TIMING_POSITION_FIXES[`${reciterId}:${surahNumber}:${ayahNumber}`];

export const isWordHighlightDisabled = (
  reciterId: string,
  surahNumber: number,
  ayahNumber: number
) => {
  const reciterDisabled = DISABLED_WORD_HIGHLIGHT_AYAHS[reciterId];
  if (!reciterDisabled) return false;
  const ayahs = reciterDisabled[surahNumber];
  return Array.isArray(ayahs) ? ayahs.includes(ayahNumber) : false;
};
