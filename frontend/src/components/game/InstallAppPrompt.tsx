import { useEffect, useRef, useState } from "react";
import {
  installPromptDismissed,
  mobileInstallPlatform,
  rememberInstallPromptDismissal,
} from "../../lib/installPrompt";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallAppPrompt({ ready }: { ready: boolean }) {
  const [platform] = useState(() => mobileInstallPlatform(navigator));
  const [dismissed, setDismissed] = useState(installPromptDismissed);
  const [installed, setInstalled] = useState(isStandalone);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const visible = ready && window.isSecureContext && platform !== null && !dismissed && !installed;

  useEffect(() => {
    if (!platform || !window.isSecureContext) return;
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onInstallable = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      rememberInstallPromptDismissal();
    };
    const onDisplayModeChange = () => {
      if (isStandalone()) onInstalled();
    };
    window.addEventListener("beforeinstallprompt", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    displayMode.addEventListener("change", onDisplayModeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode.removeEventListener("change", onDisplayModeChange);
    };
  }, [platform]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!visible || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [visible]);

  const dismiss = () => {
    rememberInstallPromptDismissal();
    setDismissed(true);
  };

  async function install() {
    if (!installEvent || installing) return;
    setInstalling(true);
    setError(false);
    setInstallEvent(null);
    try {
      // The browser requires a user gesture, and each event can be used only once.
      await installEvent.prompt();
      await installEvent.userChoice;
      dismiss();
    } catch {
      setError(true);
    } finally {
      setInstalling(false);
    }
  }

  if (!visible) return null;

  return (
    <dialog
      ref={dialogRef}
      className="install-app-dialog"
      aria-labelledby="install-app-title"
      aria-describedby="install-app-description"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <header className="install-app-header">
        <img src="/icons/app-192.png" alt="" width="48" height="48" />
        <span className="install-app-eyebrow">YOUR NEXT ADVENTURE</span>
        <button type="button" className="install-app-close" aria-label="Close installation guide" onClick={dismiss}>×</button>
      </header>
      <h2 id="install-app-title">Install Text Adventures</h2>
      <p id="install-app-description">Launch from your home screen and give the game more room to explore.</p>
      {!installEvent && !installing && (
        <ol className="install-app-steps">
          {platform === "ios" ? (
            <>
              <li>Open this page in <strong>Safari</strong> and tap <strong>Share</strong>.</li>
              <li>Choose <strong>Add to Home Screen</strong>.</li>
              <li>Enable <strong>Open as Web App</strong> if shown, then tap <strong>Add</strong>.</li>
            </>
          ) : (
            <>
              <li>Open your browser’s <strong>menu</strong>.</li>
              <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, if available.</li>
            </>
          )}
        </ol>
      )}
      {error && <p role="alert" className="install-app-error">Installation could not start. Follow the steps above to install from your browser.</p>}
      <p className="install-app-note">Free to install. Internet connection required to play.</p>
      <div className="install-app-actions">
        {(installEvent || installing) && (
          <button type="button" className="install-app-primary" disabled={installing} onClick={() => void install()}>
            {installing ? "Waiting for browser…" : "Install app"}
          </button>
        )}
        <button type="button" onClick={dismiss}>{installEvent || installing ? "Not now" : "Continue playing"}</button>
      </div>
    </dialog>
  );
}
