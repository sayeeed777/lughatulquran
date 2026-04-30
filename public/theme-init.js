(() => {
  try {
    const defaultTheme = "dark";
    const validThemes = new Set(["dark", "light", "bw", "bw-dark", "mist", "sky"]);
    const raw = localStorage.getItem("quran_theme");
    const theme = raw ? JSON.parse(raw) : null;
    const normalizedTheme = theme === "ocean" ? "mist" : theme;
    if (validThemes.has(normalizedTheme)) {
      if (normalizedTheme !== theme) {
        localStorage.setItem("quran_theme", JSON.stringify(normalizedTheme));
      }
      document.documentElement.dataset.theme = normalizedTheme;
      return;
    }
    const isMobileView = window.matchMedia?.("(max-width: 1100px)")?.matches;
    if (isMobileView) {
      document.documentElement.dataset.theme = defaultTheme;
      return;
    }
    document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme:light)").matches
      ? "light"
      : defaultTheme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
