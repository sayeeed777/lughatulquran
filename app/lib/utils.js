// Date utilities
export const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};

export const parseLocalDate = (value) => new Date(`${value}T00:00:00`);

export const getDaysBetween = (date1, date2) => {
  return Math.floor((date2 - date1) / 86400000);
};

// Verse key utilities
export const verseKey = (surahNumber, ayahNumber) => `${surahNumber}:${ayahNumber}`;

export const parseVerseKey = (key) => {
  const [surah, ayah] = key.split(":").map(Number);
  return { surah, ayah };
};

// Number utilities
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const pad = (value, length = 3) => String(value).padStart(length, "0");

// Audio URL generator
export const getAudioUrl = (baseUrl, surahNumber, ayahNumber) =>
  `${baseUrl}/${pad(surahNumber)}${pad(ayahNumber)}.mp3`;

// Arabic text utilities
export const sanitizeArabic = (text) => {
  if (!text) return "";
  return text;
};

// Debounce utility
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttle utility
export const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return true;
};

// Format reading progress
export const formatProgress = (current, total) => {
  const percentage = Math.round((current / total) * 100);
  return { current, total, percentage };
};

// Generate ayah link
export const generateAyahLink = (surahNumber, ayahNumber) => {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set("surah", surahNumber);
  url.searchParams.set("ayah", ayahNumber);
  url.hash = `ayah-${ayahNumber}`;
  return url.toString();
};
