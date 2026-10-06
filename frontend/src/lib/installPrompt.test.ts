import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INSTALL_PROMPT_DISMISSED_KEY,
  installPromptDismissed,
  mobileInstallPlatform,
  rememberInstallPromptDismissal,
} from "./installPrompt";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("mobile installation eligibility", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5, "ios"],
    ["Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", 5, "ios"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 5, "ios"],
    ["Mozilla/5.0 (Linux; Android 15; Pixel 8)", 5, "android"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 0, null],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 10, null],
  ])("identifies %s with %i touch points", (userAgent, maxTouchPoints, platform) => {
    expect(mobileInstallPlatform({ userAgent, maxTouchPoints })).toBe(platform);
  });

  it("uses mobile client hints when available", () => {
    expect(mobileInstallPlatform({ userAgent: "", maxTouchPoints: 1, userAgentData: { mobile: true } })).toBe("android");
  });
});

describe("installation guide dismissal", () => {
  it("remembers dismissal for seven days and expires it", () => {
    vi.useFakeTimers();
    const values = new Map<string, string>();
    vi.stubGlobal("window", { localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } });
    expect(installPromptDismissed()).toBe(false);
    rememberInstallPromptDismissal();
    expect(installPromptDismissed()).toBe(true);
    vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000);
    expect(installPromptDismissed()).toBe(false);
    values.set(INSTALL_PROMPT_DISMISSED_KEY, "invalid");
    expect(installPromptDismissed()).toBe(false);
  });

  it("tolerates restricted storage", () => {
    vi.stubGlobal("window", { get localStorage() { throw new Error("Storage blocked"); } });
    expect(installPromptDismissed()).toBe(false);
    expect(rememberInstallPromptDismissal).not.toThrow();
  });
});
