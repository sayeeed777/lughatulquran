(() => {
  try {
    const raw = localStorage.getItem("quran_theme");
    const theme = raw ? JSON.parse(raw) : null;
    if (theme === "light" || theme === "bw" || theme === "dark" || theme === "bw-dark") {
      document.documentElement.dataset.theme = theme;
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
