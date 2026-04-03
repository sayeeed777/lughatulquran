(() => {
  try {
    const raw = localStorage.getItem("quran_theme");
    const theme = raw ? JSON.parse(raw) : null;
    const normalizedTheme = theme === "ocean" ? "mist" : theme;
    if (normalizedTheme === "light" || normalizedTheme === "bw" || normalizedTheme === "dark" || normalizedTheme === "bw-dark" || normalizedTheme === "mist" || normalizedTheme === "sky") {
      if (theme === "ocean") {
        localStorage.setItem("quran_theme", JSON.stringify("mist"));
      }
      document.documentElement.dataset.theme = normalizedTheme;
      return;
    }
    const isMobileView = window.matchMedia?.("(max-width: 1100px)")?.matches;
    if (isMobileView) {
      document.documentElement.dataset.theme = "dark";
      return;
    }
    document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme:light)").matches
      ? "light"
      : "dark";
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
