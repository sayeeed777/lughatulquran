"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJSON } from "../../lib/apiClient";
import { hasLexiconData } from "./StudyModeHelpers";
import type {
  RootLexiconPayload,
  SelectedWordDetails,
  Word,
  WordByAyah,
  WordBySurah,
  WordByWordPayload
} from "./StudyModeTypes";

type UseWordLexiconArgs = {
  selectedSurahNumber: number;
  wordByAyah: WordBySurah;
  wordLoading: boolean;
};

export default function useWordLexicon({
  selectedSurahNumber,
  wordByAyah,
  wordLoading
}: UseWordLexiconArgs) {
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const rootLookupRequestRef = useRef(0);

  const [wordAudioUrl, setWordAudioUrl] = useState<string | null>(null);
  const [selectedWordDetails, setSelectedWordDetails] = useState<SelectedWordDetails | null>(null);
  const [isRootModalOpen, setIsRootModalOpen] = useState(false);
  const [rootLexicon, setRootLexicon] = useState<RootLexiconPayload | null>(null);
  const [rootLexiconLoading, setRootLexiconLoading] = useState(false);
  const [rootLexiconError, setRootLexiconError] = useState<string | null>(null);
  const [studyWordCache, setStudyWordCache] = useState<WordBySurah>({});
  const [studyWordLoading, setStudyWordLoading] = useState(false);

  const wordsFromHook = selectedSurahNumber ? wordByAyah?.[selectedSurahNumber] : undefined;
  const wordsFromStudyCache = selectedSurahNumber ? studyWordCache?.[selectedSurahNumber] : undefined;

  const hookHasLexiconData = useMemo(() => hasLexiconData(wordsFromHook), [wordsFromHook]);
  const cacheHasLexiconData = useMemo(() => hasLexiconData(wordsFromStudyCache), [wordsFromStudyCache]);

  const wordsByAyahForStudy = useMemo<WordByAyah>(() => {
    if (hookHasLexiconData && wordsFromHook) return wordsFromHook;
    if (cacheHasLexiconData && wordsFromStudyCache) return wordsFromStudyCache;
    return wordsFromHook || wordsFromStudyCache || {};
  }, [hookHasLexiconData, wordsFromHook, cacheHasLexiconData, wordsFromStudyCache]);

  const effectiveWordLoading = wordLoading || studyWordLoading;

  useEffect(() => {
    if (!selectedSurahNumber) return;

    if (hookHasLexiconData && wordsFromHook) {
      setStudyWordCache((prev) => {
        if (prev[selectedSurahNumber]) return prev;
        return {
          ...prev,
          [selectedSurahNumber]: wordsFromHook
        };
      });
      return;
    }

    if (cacheHasLexiconData && wordsFromStudyCache) return;

    let isMounted = true;
    setStudyWordLoading(true);

    fetchJSON<WordByWordPayload>(`/api/words/${selectedSurahNumber}?v=6`, {
      ttl: 24 * 60 * 60 * 1000,
      retries: 1,
      retryDelay: 300,
      persist: true,
      staleWhileRevalidate: true
    })
      .then((payload) => {
        if (!isMounted) return;
        setStudyWordCache((prev) => ({
          ...prev,
          [selectedSurahNumber]: payload?.wordsByAyah || {}
        }));
      })
      .catch(() => {
        if (!isMounted) return;
      })
      .finally(() => {
        if (!isMounted) return;
        setStudyWordLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    selectedSurahNumber,
    wordsFromHook,
    wordsFromStudyCache,
    hookHasLexiconData,
    cacheHasLexiconData
  ]);

  const resolveWordAudioUrl = useCallback((audioUrl?: string) => {
    if (!audioUrl) return "";
    if (audioUrl.startsWith("http")) return audioUrl;
    return `https://audio.qurancdn.com/${audioUrl.replace(/^\//, "")}`;
  }, []);

  const handleWordAudio = useCallback(
    (audioUrl?: string) => {
      const resolvedUrl = resolveWordAudioUrl(audioUrl);
      if (!resolvedUrl) return;
      const audio = wordAudioRef.current;
      if (audio) {
        if (audio.src !== resolvedUrl) {
          audio.src = resolvedUrl;
          audio.load();
        }
        audio.pause();
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      setWordAudioUrl(resolvedUrl);
    },
    [resolveWordAudioUrl]
  );

  const hydrateWordLexicon = useCallback(
    async (surahNumber: number, ayahNumber: number, position: number) => {
      const payload = await fetchJSON<WordByWordPayload>(`/api/words/${surahNumber}?v=6`, {
        ttl: 24 * 60 * 60 * 1000,
        retries: 1,
        retryDelay: 250,
        persist: true,
        staleWhileRevalidate: true
      });
      const wordsByAyahPayload = payload?.wordsByAyah || {};
      setStudyWordCache((prev) => ({
        ...prev,
        [surahNumber]: wordsByAyahPayload
      }));
      const ayahWords = wordsByAyahPayload?.[ayahNumber] || [];
      return (
        ayahWords.find((item, idx) => (Number(item.position) || idx + 1) === position) || null
      );
    },
    []
  );

  const fetchRootLexicon = useCallback(async (root?: string) => {
    const normalizedRoot = (root || "").trim();
    if (!normalizedRoot) return null;
    const requestId = rootLookupRequestRef.current + 1;
    rootLookupRequestRef.current = requestId;
    setRootLexiconLoading(true);
    setRootLexiconError(null);
    try {
      const payload = await fetchJSON<RootLexiconPayload>(
        `/api/lexicon/root/${encodeURIComponent(normalizedRoot)}?v=2`,
        { ttl: 24 * 60 * 60 * 1000, retries: 1, retryDelay: 250, persist: true }
      );
      if (rootLookupRequestRef.current !== requestId) return null;
      setRootLexicon(payload);
      return payload;
    } catch (error) {
      if (rootLookupRequestRef.current !== requestId) return null;
      const message = error instanceof Error ? error.message : "Failed to load root lexicon.";
      setRootLexicon(null);
      setRootLexiconError(message);
      return null;
    } finally {
      if (rootLookupRequestRef.current === requestId) {
        setRootLexiconLoading(false);
      }
    }
  }, []);

  const handleWordSelect = useCallback(
    (word: Word, ayahNumber: number, wordIndex: number) => {
      if (!selectedSurahNumber) return;
      rootLookupRequestRef.current += 1;
      const position = Number(word.position) || wordIndex + 1;
      setSelectedWordDetails({
        surah: selectedSurahNumber,
        ayah: ayahNumber,
        position,
        arabic: word.arabic,
        translation: word.translation,
        audioUrl: word.audioUrl,
        lemma: word.lemma,
        root: word.root,
        rootArabic: word.rootArabic
      });
      setIsRootModalOpen(false);
      setRootLexicon(null);
      setRootLexiconError(null);

      if (word.root) {
        void fetchRootLexicon(word.root);
      }

      if (!word.root && !word.lemma) {
        void hydrateWordLexicon(selectedSurahNumber, ayahNumber, position)
          .then((hydratedWord) => {
            if (!hydratedWord) return;
            setSelectedWordDetails((prev) => {
              if (!prev) return prev;
              if (
                prev.surah !== selectedSurahNumber ||
                prev.ayah !== ayahNumber ||
                prev.position !== position
              ) {
                return prev;
              }
              return {
                ...prev,
                lemma: hydratedWord.lemma || prev.lemma,
                root: hydratedWord.root || prev.root,
                rootArabic: hydratedWord.rootArabic || prev.rootArabic
              };
            });
            if (hydratedWord.root) {
              void fetchRootLexicon(hydratedWord.root);
            }
          })
          .catch(() => {});
      }
    },
    [selectedSurahNumber, hydrateWordLexicon, fetchRootLexicon]
  );

  const closeWordDetails = useCallback(() => {
    rootLookupRequestRef.current += 1;
    setSelectedWordDetails(null);
    setIsRootModalOpen(false);
    setRootLexicon(null);
    setRootLexiconError(null);
    setRootLexiconLoading(false);
  }, []);

  const openRootDetails = useCallback(
    async (root?: string) => {
      const normalizedRoot = (root || "").trim();
      if (!normalizedRoot) return;
      setIsRootModalOpen(true);
      if (rootLexicon?.root === normalizedRoot && !rootLexiconError) {
        return;
      }
      await fetchRootLexicon(normalizedRoot);
    },
    [fetchRootLexicon, rootLexicon?.root, rootLexiconError]
  );

  const closeRootModal = useCallback(() => {
    setIsRootModalOpen(false);
  }, []);

  const selectedRoot = (selectedWordDetails?.root || "").trim();
  const selectedRootArabic =
    selectedWordDetails?.rootArabic || rootLexicon?.rootArabic || "";

  const distillRootMeaning = useCallback((value?: string) => {
    const raw = (value || "").replace(/\s+/g, " ").trim();
    if (!raw) return "";
    const firstSentence = raw.split(/[.;:]/, 1)[0] || raw;
    const condensed = firstSentence.replace(/\s+/g, " ").trim();
    if (condensed.length <= 160) return condensed;
    return `${condensed.slice(0, 157).trim()}...`;
  }, []);

  const rootMeaningSummary = useMemo(() => {
    if (!selectedRoot) return "Root data is not available for this word yet.";
    if (rootLexicon?.rootMeaning) {
      return distillRootMeaning(rootLexicon.rootMeaning);
    }
    if (rootLexiconLoading) return "Loading root meaning...";
    if (rootLexicon?.primaryRootMeaningsAvailable === false) {
      return "Primary root-meaning dataset is not available.";
    }
    return "No root meaning found in the primary dataset.";
  }, [
    distillRootMeaning,
    rootLexicon?.rootMeaning,
    rootLexicon?.primaryRootMeaningsAvailable,
    rootLexiconLoading,
    selectedRoot
  ]);

  const laneActionLabel = useMemo(() => {
    if (!selectedRoot) return "Lane Lexicon unavailable";
    if (rootLexiconLoading) return "Loading Lane Lexicon...";
    if (rootLexiconError) return "Retry Lane Lexicon";
    return "Open Lane Lexicon";
  }, [rootLexiconError, rootLexiconLoading, selectedRoot]);

  return {
    wordAudioRef,
    wordAudioUrl,
    selectedWordDetails,
    isRootModalOpen,
    rootLexicon,
    rootLexiconLoading,
    rootLexiconError,
    wordsByAyahForStudy,
    effectiveWordLoading,
    resolveWordAudioUrl,
    handleWordAudio,
    handleWordSelect,
    closeWordDetails,
    openRootDetails,
    closeRootModal,
    selectedRoot,
    selectedRootArabic,
    rootMeaningSummary,
    laneActionLabel
  };
}
