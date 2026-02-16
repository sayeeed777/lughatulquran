(() => {
  try {
    const raw = localStorage.getItem("quran_theme");
    const theme = raw ? JSON.parse(raw) : null;
    if (theme === "light" || theme === "bw" || theme === "dark" || theme === "bw-dark") {
      document.documentElement.dataset.theme = theme;
      return;
    }
    document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme:light)").matches
      ? "light"
      : "dark";
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
