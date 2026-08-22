import { useCallback, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "./common";

type TipId = "study-enter" | "tools-open" | "surah-progress";

type Tip = {
  id: TipId;
  message: string;
};

const TIPS: Tip[] = [
  {
    id: "study-enter",
    message: "Tap the Tools icon to customize your reading experience",
  },
  {
    id: "tools-open",
    message: "Try Track Memorization to mark the ayahs you've memorized",
  },
  {
    id: "surah-progress",
    message: "Check the Study tab for your reading progress and streaks",
  },
];

type TipTriggers = {
  toolsOpened: boolean;
  surahCount: number;
};

type DismissedMap = Record<string, boolean>;

const COOLDOWN_MS = 5000;

export function useDiscoveryTips(triggers: TipTriggers) {
  const [dismissed, setDismissed] = useLocalStorage<DismissedMap>(
    "quran_discovery_tips",
    {}
  );
  const [coolingDown, setCoolingDown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTip = useMemo(() => {
    if (coolingDown) return null;

    for (const tip of TIPS) {
      if (dismissed[tip.id]) continue;

      switch (tip.id) {
        case "study-enter":
          return tip;
        case "tools-open":
          if (triggers.toolsOpened) return tip;
          break;
        case "surah-progress":
          if (triggers.surahCount >= 3) return tip;
          break;
      }
    }
    return null;
  }, [dismissed, triggers.toolsOpened, triggers.surahCount, coolingDown]);

  const dismiss = useCallback(() => {
    if (!activeTip) return;
    setDismissed((prev) => ({ ...(prev || {}), [activeTip.id]: true }));
    setCoolingDown(true);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => setCoolingDown(false), COOLDOWN_MS);
  }, [activeTip, setDismissed]);

  return { activeTip, dismiss };
}
