export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !window.isSecureContext || !("serviceWorker" in navigator)) return;

  // Updates wait for existing tabs to close; never reload an active game.
  void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
    .catch((error: unknown) => {
      console.warn("Offline support could not be enabled.", error);
    });
}
