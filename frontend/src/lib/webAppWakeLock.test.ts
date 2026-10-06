import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startWebAppWakeLock } from "./webAppWakeLock";

function createLock() {
  const lock = Object.assign(new EventTarget(), {
    released: false,
    release: vi.fn(async () => {
      lock.released = true;
      lock.dispatchEvent(new Event("release"));
    }),
  });
  return lock;
}

describe("installed web app screen wake lock", () => {
  let browser: EventTarget & { isSecureContext: boolean };
  let page: EventTarget & { visibilityState: string };
  let displayMode: EventTarget & { matches: boolean };
  let request: ReturnType<typeof vi.fn>;
  let stop: (() => void) | undefined;

  beforeEach(() => {
    displayMode = Object.assign(new EventTarget(), { matches: true });
    browser = Object.assign(new EventTarget(), {
      isSecureContext: true,
      matchMedia: vi.fn(() => displayMode),
    });
    page = Object.assign(new EventTarget(), { visibilityState: "visible" });
    request = vi.fn(async () => createLock());
    vi.stubGlobal("window", browser);
    vi.stubGlobal("document", page);
    vi.stubGlobal("navigator", { wakeLock: { request } });
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.unstubAllGlobals();
  });

  function visibility(state: string) {
    page.visibilityState = state;
    page.dispatchEvent(new Event("visibilitychange"));
  }

  it("requests one screen lock and releases it when hidden, then reacquires on return", async () => {
    const lock = createLock();
    request.mockResolvedValueOnce(lock);
    stop = startWebAppWakeLock();
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
    visibility("visible");
    expect(request).toHaveBeenCalledTimes(1);
    visibility("hidden");
    expect(lock.release).toHaveBeenCalledOnce();
    visibility("visible");
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it("only requests a lock in installed mode, including iOS standalone", async () => {
    displayMode.matches = false;
    stop = startWebAppWakeLock();
    expect(request).not.toHaveBeenCalled();
    stop();
    Object.assign(navigator, { standalone: true });
    stop = startWebAppWakeLock();
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
  });

  it("responds to installation and display mode changes", async () => {
    displayMode.matches = false;
    const lock = createLock();
    request.mockResolvedValueOnce(lock);
    stop = startWebAppWakeLock();
    displayMode.matches = true;
    displayMode.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
    displayMode.matches = false;
    displayMode.dispatchEvent(new Event("change"));
    expect(lock.release).toHaveBeenCalledOnce();
  });

  it("ignores unsupported browsers and insecure contexts", () => {
    browser.isSecureContext = false;
    stop = startWebAppWakeLock();
    expect(request).not.toHaveBeenCalled();
    browser.isSecureContext = true;
    vi.stubGlobal("navigator", {});
    expect(startWebAppWakeLock).not.toThrow();
  });

  it("tolerates denial and retries only on the next lifecycle event", async () => {
    request.mockRejectedValueOnce(new Error("Power saving"));
    stop = startWebAppWakeLock();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(request).toHaveBeenCalledOnce();
    visibility("hidden");
    visibility("visible");
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it("does not fight a system release", async () => {
    const lock = createLock();
    request.mockResolvedValueOnce(lock);
    stop = startWebAppWakeLock();
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
    await lock.release();
    expect(request).toHaveBeenCalledOnce();
    visibility("hidden");
    visibility("visible");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("releases a late request after cleanup and removes lifecycle listeners", async () => {
    const lock = createLock();
    let resolve!: (value: ReturnType<typeof createLock>) => void;
    request.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    stop = startWebAppWakeLock();
    stop();
    resolve(lock);
    await vi.waitFor(() => expect(lock.release).toHaveBeenCalledOnce());
    visibility("visible");
    browser.dispatchEvent(new Event("pageshow"));
    expect(request).toHaveBeenCalledOnce();
  });

  it("discards a pending lock across a background round trip before requesting a fresh one", async () => {
    const lock = createLock();
    let resolve!: (value: ReturnType<typeof createLock>) => void;
    request.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    stop = startWebAppWakeLock();
    visibility("hidden");
    visibility("visible");
    expect(request).toHaveBeenCalledOnce();
    resolve(lock);
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(lock.release).toHaveBeenCalledOnce();
  });

  it("releases on pagehide, resumes on pageshow, and releases on cleanup", async () => {
    const first = createLock();
    const second = createLock();
    request.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    stop = startWebAppWakeLock();
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
    browser.dispatchEvent(new Event("pagehide"));
    expect(first.release).toHaveBeenCalledOnce();
    browser.dispatchEvent(new Event("pageshow"));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    stop();
    expect(second.release).toHaveBeenCalledOnce();
  });
});
