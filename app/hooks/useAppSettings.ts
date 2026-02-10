import { useLocalStorage } from "./common";
import { STORAGE_KEYS, DEFAULT_PLAN, FONT_SCALE } from "../lib/constants";
import { clamp } from "../lib/utils";
import type { ReadingPlan, FontScale, SetState } from "../lib/types";

export function useReadingPlan() {
  const [storedPlan, setStoredPlan, isLoaded] = useLocalStorage(
    STORAGE_KEYS.plan,
    DEFAULT_PLAN
  ) as [ReadingPlan, SetState<ReadingPlan>, boolean];

  // Merge with defaults and ensure numbers are actually numbers
  const plan: ReadingPlan = {
    ...DEFAULT_PLAN,
    ...storedPlan,
    perDay: Number(storedPlan?.perDay) || DEFAULT_PLAN.perDay,
    startSurah: Number(storedPlan?.startSurah) || DEFAULT_PLAN.startSurah,
    startAyah: Number(storedPlan?.startAyah) || DEFAULT_PLAN.startAyah
  };

  return [plan, setStoredPlan, isLoaded] as const;
}

export function useFontScale() {
  const [storedScale, setStoredScale, isLoaded] = useLocalStorage(
    STORAGE_KEYS.fontScale,
    FONT_SCALE.default
  ) as [FontScale, SetState<FontScale>, boolean];

  const scale: FontScale = {
    arabic: clamp(Number(storedScale?.arabic) || 1, FONT_SCALE.min.arabic, FONT_SCALE.max.arabic),
    translation: clamp(
      Number(storedScale?.translation) || 1,
      FONT_SCALE.min.translation,
      FONT_SCALE.max.translation
    )
  };

  return [scale, setStoredScale, isLoaded] as const;
}
