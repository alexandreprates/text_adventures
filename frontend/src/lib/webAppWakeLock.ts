export function startWebAppWakeLock(): () => void {
  if (!window.isSecureContext || !("wakeLock" in navigator)) return () => {};

  const standalone = window.matchMedia("(display-mode: standalone)");
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  let sentinel: WakeLockSentinel | undefined;
  let pending = false;
  let disposed = false;
  let pageActive = true;
  let generation = 0;

  const eligible = () => !disposed && pageActive &&
    document.visibilityState === "visible" &&
    (standalone.matches || iosNavigator.standalone === true);

  const release = (lock: WakeLockSentinel) => lock.release().catch(() => undefined);

  const sync = () => {
    if (!eligible()) {
      generation += 1;
      if (sentinel) {
        void release(sentinel);
        sentinel = undefined;
      }
      return;
    }
    if (pending || sentinel) return;
    pending = true;
    const requestedGeneration = generation;
    void (async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (!eligible() || generation !== requestedGeneration) {
          await release(lock);
          return;
        }
        if (lock.released) return;
        sentinel = lock;
        lock.addEventListener("release", () => {
          if (sentinel === lock) sentinel = undefined;
        }, { once: true });
      } catch {
        // Power-saving and browser policies may deny the request. Keep gameplay available.
      } finally {
        pending = false;
        // Retry only after a lifecycle change, never loop on a system denial or release.
        if (generation !== requestedGeneration && eligible()) sync();
      }
    })();
  };

  const hide = () => { pageActive = false; sync(); };
  const show = () => { pageActive = true; sync(); };
  document.addEventListener("visibilitychange", sync);
  standalone.addEventListener("change", sync);
  window.addEventListener("pagehide", hide);
  window.addEventListener("pageshow", show);
  sync();

  return () => {
    disposed = true;
    sync();
    document.removeEventListener("visibilitychange", sync);
    standalone.removeEventListener("change", sync);
    window.removeEventListener("pagehide", hide);
    window.removeEventListener("pageshow", show);
  };
}
