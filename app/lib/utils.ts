// Date utilities
export const getLocalDateString = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};

export const parseLocalDate = (value: string): Date => new Date(`${value}T00:00:00`);

export const getDaysBetween = (date1: Date | number, date2: Date | number): number => {
  return Math.floor((Number(date2) - Number(date1)) / 86400000);
};

// Verse key utilities
export const verseKey = (surahNumber: number, ayahNumber: number): string =>
  `${surahNumber}:${ayahNumber}`;

export const parseVerseKey = (key: string): { surah: number; ayah: number } => {
  const parts = key.split(":");
  const surah = Number(parts[0] ?? 0);
  const ayah = Number(parts[1] ?? 0);
  return { surah, ayah };
};

// Number utilities
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const pad = (value: number | string, length = 3): string =>
  String(value).padStart(length, "0");

// Audio URL generator
export const getAudioUrl = (baseUrl: string, surahNumber: number, ayahNumber: number): string =>
  `${baseUrl}/${pad(surahNumber)}${pad(ayahNumber)}.mp3`;



// Debounce utility
export const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttle utility
export const throttle = <T extends (...args: unknown[]) => void>(fn: T, limit: number) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy fallback below.
    }
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
};

// Format reading progress
export const formatProgress = (current: number, total: number) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  return { current, total, percentage };
};

