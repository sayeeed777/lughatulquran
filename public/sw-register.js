// @ts-check

(() => {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const currentScript = document.currentScript instanceof HTMLScriptElement
    ? document.currentScript
    : null;
  const registerVersion = currentScript
    ? new URL(currentScript.src, window.location.href).searchParams.get("v") || "dev"
    : "dev";
  const serviceWorkerUrl = `/sw.js?v=${encodeURIComponent(registerVersion)}`;

  let hasReloadedForUpdate = false;

  const reloadForUpdatedWorker = () => {
    if (hasReloadedForUpdate) {
      return;
    }

    hasReloadedForUpdate = true;
    window.location.reload();
  };

  /** @param {ServiceWorkerRegistration} registration */
  const activateWaitingWorker = (registration) => {
    if (!registration.waiting) {
      return false;
    }

    navigator.serviceWorker.addEventListener("controllerchange", reloadForUpdatedWorker, { once: true });
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    return true;
  };

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl);

      if (activateWaitingWorker(registration)) {
        return;
      }

      await registration.update();
    } catch {
      // Ignore service worker registration failures.
    }
  });
})();
