"use client";

import { useMemo, useState } from "react";
import type { Surah, SurahData } from "./types";

export function useHomeFilters(surahs: Surah[], surahData: SurahData | null) {
  const [query, setQuery] = useState("");
  const [ayahQuery, setAyahQuery] = useState("");

  const filteredSurahs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return surahs;
    return surahs.filter(
      (surah) =>
        surah.englishName.toLowerCase().includes(trimmed) ||
        surah.englishNameTranslation.toLowerCase().includes(trimmed) ||
        String(surah.number).includes(trimmed)
    );
  }, [query, surahs]);

  const filteredAyahs = useMemo(() => {
    if (!surahData?.ayahs) return [];
    const trimmed = ayahQuery.trim().toLowerCase();
    if (!trimmed) return surahData.ayahs;
    if (/^\d+$/.test(trimmed)) {
      return surahData.ayahs.filter((ayah) => ayah.number === Number(trimmed));
    }
    return surahData.ayahs.filter((ayah) => {
      const combined = Object.values(ayah.translations || {})
        .map((t) => t.text || "")
        .join(" ")
        .toLowerCase();
      return combined.includes(trimmed);
    });
  }, [ayahQuery, surahData]);

  return {
    query,
    setQuery,
    ayahQuery,
    setAyahQuery,
    filteredSurahs,
    filteredAyahs
  };
}
