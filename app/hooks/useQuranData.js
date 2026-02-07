import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchJSON } from '../lib/apiClient';

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const isString = (value) => typeof value === "string";

const validateSurah = (surah) =>
    isObject(surah) &&
    isNumber(surah.number) &&
    isString(surah.englishName) &&
    isString(surah.englishNameTranslation) &&
    isString(surah.name) &&
    isNumber(surah.numberOfAyahs) &&
    isString(surah.revelationType);

const validateSurahList = (payload) => {
    if (!isObject(payload) || !Array.isArray(payload.surahs)) return null;
    if (!payload.surahs.every(validateSurah)) return null;
    return payload;
};

const validateSurahDetail = (payload) => {
    if (!isObject(payload)) return null;
    if (payload.surah && !validateSurah(payload.surah)) return null;
    if (payload.ayahs && (!Array.isArray(payload.ayahs) || !payload.ayahs.every((ayah) => isObject(ayah) && isNumber(ayah.number)))) {
        return null;
    }
    return payload;
};

const validateWordByWord = (payload) => {
    if (!isObject(payload)) return null;
    if (payload.wordsByAyah && !isObject(payload.wordsByAyah)) return null;
    return payload;
};

const validateTaqi = (payload) => {
    if (!isObject(payload) || !isString(payload.text)) return null;
    return payload;
};

export function useSurahs() {
    const [surahs, setSurahs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const refetch = useCallback(() => {
        setReloadKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadSurahs = async () => {
            setLoading(true);
            try {
                const payload = await fetchJSON("/api/surahs", {
                    ttl: 24 * 60 * 60 * 1000,
                    retries: 2,
                    retryDelay: 300,
                    persist: true
                });
                const parsed = validateSurahList(payload);
                if (!parsed) {
                    throw new Error("Invalid surah list response.");
                }
                if (isMounted) {
                    setSurahs(parsed.surahs || []);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadSurahs();
        return () => {
            isMounted = false;
        };
    }, [reloadKey]);

    const surahByNumber = useMemo(() => {
        return new Map(surahs.map((surah) => [surah.number, surah]));
    }, [surahs]);

    return { surahs, loading, error, surahByNumber, refetch };
}

export function useSurahDetails(surahNumber) {
    const [surahData, setSurahData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const refetch = useCallback(() => {
        setReloadKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        if (!surahNumber) return;

        let isMounted = true;
        const loadSurah = async () => {
            setLoading(true);
            setError(null);
            try {
                const payload = await fetchJSON(`/api/surah/${surahNumber}`, {
                    ttl: 10 * 60 * 1000,
                    retries: 2,
                    retryDelay: 300,
                    persist: true
                });
                const parsed = validateSurahDetail(payload);
                if (!parsed) {
                    throw new Error("Invalid surah response.");
                }
                if (isMounted) {
                    setSurahData(parsed);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadSurah();
        return () => {
            isMounted = false;
        };
    }, [surahNumber, reloadKey]);

    return { surahData, loading, error, refetch };
}

export function useWordByWord(selectedSurahNumber, showWordByWord) {
    const [wordByAyah, setWordByAyah] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const refetch = useCallback((surahNumber) => {
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
        if (!showWordByWord || !selectedSurahNumber) return;
        if (wordByAyah[selectedSurahNumber]) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        fetchJSON(`/api/words/${selectedSurahNumber}`, {
            ttl: 24 * 60 * 60 * 1000,
            retries: 1,
            retryDelay: 300,
            persist: true
        })
            .then((data) => {
                const parsed = validateWordByWord(data);
                if (!parsed) {
                    throw new Error("Invalid word-by-word response.");
                }
                if (isMounted) {
                    setWordByAyah((prev) => ({
                        ...prev,
                        [selectedSurahNumber]: parsed.wordsByAyah || {}
                    }));
                }
            })
            .catch((err) => {
                if (isMounted) setError(err.message);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, [showWordByWord, selectedSurahNumber, wordByAyah]);

    return { wordByAyah, loading, error, refetch };
}

export function useTaqiTranslation() {
    const [cache, setCache] = useState({});
    const [loading, setLoading] = useState({});

    const fetchTranslation = async (surahNumber, ayahNumber) => {
        const key = `${surahNumber}:${ayahNumber}`;
        if (cache[key] || loading[key]) return;

        setLoading((prev) => ({ ...prev, [key]: true }));
        try {
            const payload = await fetchJSON(
                `/api/ayah/taqi-usmani?surah=${surahNumber}&ayah=${ayahNumber}`,
                { ttl: 10 * 60 * 1000, retries: 1, retryDelay: 300 }
            );
            const parsed = validateTaqi(payload);
            if (!parsed) {
                throw new Error("Invalid translation response.");
            }
            setCache((prev) => ({ ...prev, [key]: parsed.text }));
        } catch (err) {
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
