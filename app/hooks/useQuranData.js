import { useState, useEffect, useMemo } from 'react';

export function useSurahs() {
    const [surahs, setSurahs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const loadSurahs = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/surahs");
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload?.error || "Failed to load surahs.");
                }
                if (isMounted) {
                    setSurahs(payload.surahs || []);
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
    }, []);

    const surahByNumber = useMemo(() => {
        return new Map(surahs.map((surah) => [surah.number, surah]));
    }, [surahs]);

    return { surahs, loading, error, surahByNumber };
}

export function useSurahDetails(surahNumber) {
    const [surahData, setSurahData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!surahNumber) return;

        let isMounted = true;
        const loadSurah = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/surah/${surahNumber}`);
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload?.error || "Failed to load surah.");
                }
                if (isMounted) {
                    setSurahData(payload);
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
    }, [surahNumber]);

    return { surahData, loading, error };
}

export function useWordByWord(selectedSurahNumber, showWordByWord) {
    const [wordByAyah, setWordByAyah] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!showWordByWord || !selectedSurahNumber) return;
        if (wordByAyah[selectedSurahNumber]) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        fetch(`/api/words/${selectedSurahNumber}`)
            .then((response) => response.json().then((data) => ({ response, data })))
            .then(({ response, data }) => {
                if (!response.ok) {
                    throw new Error(data?.error || "Word-by-word unavailable.");
                }
                if (isMounted) {
                    setWordByAyah((prev) => ({
                        ...prev,
                        [selectedSurahNumber]: data.wordsByAyah || {}
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

    return { wordByAyah, loading, error };
}

export function useTaqiTranslation() {
    const [cache, setCache] = useState({});
    const [loading, setLoading] = useState({});

    const fetchTranslation = async (surahNumber, ayahNumber) => {
        const key = `${surahNumber}:${ayahNumber}`;
        if (cache[key] || loading[key]) return;

        setLoading((prev) => ({ ...prev, [key]: true }));
        try {
            const response = await fetch(
                `/api/ayah/taqi-usmani?surah=${surahNumber}&ayah=${ayahNumber}`
            );
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || "Failed to load translation.");
            }
            setCache((prev) => ({ ...prev, [key]: payload.text }));
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
