export const INSTALL_PROMPT_DISMISSED_KEY = "text_adventures.install_prompt_dismissed_until";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type MobileNavigator = Pick<Navigator, "userAgent" | "maxTouchPoints"> & {
  userAgentData?: { mobile: boolean };
};

export function mobileInstallPlatform(browser: MobileNavigator): "ios" | "android" | null {
  if (/iPad|iPhone|iPod/.test(browser.userAgent) ||
    (/Macintosh/.test(browser.userAgent) && browser.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(browser.userAgent) || browser.userAgentData?.mobile) return "android";
  return null;
}

export function installPromptDismissed(): boolean {
  try {
    const until = Number(window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

export function rememberInstallPromptDismissal(): void {
  try {
    window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, String(Date.now() + DISMISS_DURATION_MS));
  } catch {
    // Dismissal still applies to this page when browser storage is unavailable.
  }
}
