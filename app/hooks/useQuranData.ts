import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchJSON } from "../lib/apiClient";
import type { Ayah, Surah, WordByAyah, WordBySurah } from "../lib/types";

type SurahDetail = {
  surah?: Surah;
  ayahs?: Ayah[];
  arabicScript?: string;
  translationOrder?: string[];
};

type SurahListPayload = { surahs: Surah[] };

type WordByWordPayload = { wordsByAyah?: WordByAyah };

type TaqiPayload = { text: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === "string";

const validateSurah = (surah: unknown): surah is Surah =>
  isObject(surah) &&
  isNumber(surah.number) &&
  isString(surah.englishName) &&
  isString(surah.englishNameTranslation) &&
  isString(surah.name) &&
  isNumber(surah.numberOfAyahs) &&
  isString(surah.revelationType);

const validateSurahList = (payload: unknown): SurahListPayload | null => {
  if (!isObject(payload) || !Array.isArray(payload.surahs)) return null;
  if (!payload.surahs.every(validateSurah)) return null;
  return payload as SurahListPayload;
};

const validateSurahDetail = (payload: unknown): SurahDetail | null => {
  if (!isObject(payload)) return null;
  if (payload.surah && !validateSurah(payload.surah)) return null;
  if (
    payload.ayahs &&
    (!Array.isArray(payload.ayahs) ||
      !payload.ayahs.every((ayah) => isObject(ayah) && isNumber(ayah.number)))
  ) {
    return null;
  }
  return payload as SurahDetail;
};

const validateWordByWord = (payload: unknown): WordByWordPayload | null => {
  if (!isObject(payload)) return null;
  if (payload.wordsByAyah && !isObject(payload.wordsByAyah)) return null;
  return payload as WordByWordPayload;
};

const validateTaqi = (payload: unknown): TaqiPayload | null => {
  if (!isObject(payload) || !isString(payload.text)) return null;
  return payload as TaqiPayload;
};

export function useSurahs() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadSurahs = async () => {
      setLoading(true);
      try {
        const payload = await fetchJSON<SurahListPayload>("/api/surahs", {
          ttl: 24 * 60 * 60 * 1000,
          cacheKey: "/api/surahs?v=2",
          retries: 2,
          retryDelay: 300,
          persist: true,
          staleWhileRevalidate: true,
          signal: controller.signal
        });
        const parsed = validateSurahList(payload);
        if (!parsed) {
          throw new Error("Invalid surah list response.");
        }
        setSurahs(parsed.surahs || []);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSurahs();
    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  const surahByNumber = useMemo(() => {
    return new Map(surahs.map((surah) => [surah.number, surah]));
  }, [surahs]);

  return { surahs, loading, error, surahByNumber, refetch };
}

export function useSurahDetails(
  surahNumber?: number | string | null,
  translationIds: string[] = ["en-arberry"],
  includeTransliteration = false
) {
  const [surahData, setSurahData] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const translationKey = useMemo(() => {
    return (translationIds || [])
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(",");
  }, [translationIds]);

  const refetch = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (surahNumber == null || surahNumber === "") return;
    const surahId = typeof surahNumber === "string" ? Number(surahNumber) : surahNumber;
    if (!Number.isFinite(surahId) || surahId < 1) return;

    const controller = new AbortController();
    const loadSurah = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (translationKey) {
          params.set("translations", translationKey);
        }
        if (includeTransliteration) {
          params.set("transliteration", "1");
        }
        // Bump when /api/surah response shape or text source changes — busts
        // persisted IndexedDB cache so users pick up the new payload.
        params.set("v", "2");
        const url = `/api/surah/${surahId}?${params.toString()}`;

        const payload = await fetchJSON<SurahDetail>(url, {
          ttl: 10 * 60 * 1000,
          retries: 2,
          retryDelay: 300,
          persist: true,
          staleWhileRevalidate: true,
          signal: controller.signal
        });
        const parsed = validateSurahDetail(payload);
        if (!parsed) {
          throw new Error("Invalid surah response.");
        }
        setSurahData(parsed);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSurah();
    return () => {
      controller.abort();
    };
  }, [surahNumber, translationKey, includeTransliteration, reloadKey]);

  return { surahData, loading, error, refetch };
}

export function useWordByWord(selectedSurahNumber?: number | null, showWordByWord?: boolean) {
  const [wordByAyah, setWordByAyah] = useState<WordBySurah>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback((surahNumber?: number | null) => {
    if (!surahNumber) return;
    setError(null);
    setWordByAyah((prev) => {
      if (!prev[surahNumber]) return prev;
      const next = { ...prev };
      delete next[surahNumber];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!selectedSurahNumber) return;
    if (wordByAyah[selectedSurahNumber]) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchJSON<WordByWordPayload>(`/api/words/${selectedSurahNumber}?v=6`, {
      ttl: 24 * 60 * 60 * 1000,
      retries: 1,
      retryDelay: 300,
      persist: true,
      staleWhileRevalidate: true,
      signal: controller.signal
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        const parsed = validateWordByWord(data);
        if (!parsed) {
          throw new Error("Invalid word-by-word response.");
        }
        setWordByAyah((prev) => ({
          ...prev,
          [selectedSurahNumber]: parsed.wordsByAyah || {}
        }));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [selectedSurahNumber, wordByAyah, showWordByWord]);

  return { wordByAyah, loading, error, refetch };
}

export function useTaqiTranslation() {
  const [cache, setCache] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchTranslation = async (surahNumber: number, ayahNumber: number) => {
    const key = `${surahNumber}:${ayahNumber}`;
    if (cache[key] || loading[key]) return;

    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const payload = await fetchJSON<TaqiPayload>(
        `/api/ayah/taqi-usmani?surah=${surahNumber}&ayah=${ayahNumber}`,
        { ttl: 10 * 60 * 1000, retries: 1, retryDelay: 300 }
      );
      const parsed = validateTaqi(payload);
      if (!parsed) {
        throw new Error("Invalid translation response.");
      }
      setCache((prev) => ({ ...prev, [key]: parsed.text }));
    } catch {
      setCache((prev) => ({
        ...prev,
        [key]: "Unable to load Mufti Taqi Usmani translation."
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return { cache, loading, fetchTranslation };
}
