import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameMusic, rememberMusicEnabled, savedMusicEnabled, type MusicStatus } from "./music";

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  preload = "";
  loop = false;
  error: MediaError | null = null;
  paused = true;
  play = vi.fn(async () => { this.paused = false; });
  pause = vi.fn(() => { this.paused = true; });
  load = vi.fn(() => { this.error = null; });
  removeAttribute = vi.fn();
  src: string;
  constructor(src: string) { super(); this.src = src; FakeAudio.instances.push(this); }
}

function fakeGain() {
  return {
    gain: { value: 0, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(), disconnect: vi.fn(),
  };
}

class FakeContext {
  static instances: FakeContext[] = [];
  currentTime = 0;
  state = "running";
  destination = {};
  gains: ReturnType<typeof fakeGain>[] = [];
  resume = vi.fn(async () => { this.state = "running"; });
  suspend = vi.fn(async () => { this.state = "suspended"; });
  close = vi.fn(async () => { this.state = "closed"; });
  createMediaElementSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }));
  createGain() {
    const node = fakeGain();
    this.gains.push(node);
    return node;
  }
  constructor() { FakeContext.instances.push(this); }
}

describe("game soundtrack", () => {
  let page: EventTarget & { hidden: boolean };
  let music: GameMusic;
  let notify = vi.fn<(status: MusicStatus) => void>();
  beforeEach(() => {
    vi.useFakeTimers();
    FakeAudio.instances = [];
    FakeContext.instances = [];
    page = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal("document", page);
    vi.stubGlobal("window", new EventTarget());
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("AudioContext", FakeContext);
    vi.stubGlobal("localStorage", { getItem: vi.fn(), setItem: vi.fn() });
    notify = vi.fn();
    music = new GameMusic(true, notify);
  });
  afterEach(() => { music.dispose(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  const settle = async () => { await vi.advanceTimersByTimeAsync(900); };

  it("waits for interaction, streams a quiet looping town track, and keeps it through town services", async () => {
    music.setScene("town");
    expect(FakeAudio.instances).toHaveLength(0);
    page.dispatchEvent(new Event("click"));
    await settle();
    const [town, dungeon] = FakeAudio.instances;
    expect(town.src).toContain("village-consort.mp3");
    expect(town.loop).toBe(true);
    expect(town.paused).toBe(false);
    expect(dungeon.paused).toBe(true);
    expect(FakeContext.instances[0].gains[0].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.25, 0.8);
    music.setScene("tavern");
    music.setScene("blacksmith");
    expect(town.play).toHaveBeenCalledOnce();
  });

  it("crossfades between scenes without restarting the dungeon during combat updates", async () => {
    music.setScene("town");
    page.dispatchEvent(new Event("keydown"));
    await settle();
    music.setScene("ruins");
    await settle();
    const [town, dungeon] = FakeAudio.instances;
    expect(town.paused).toBe(true);
    expect(dungeon.paused).toBe(false);
    expect(dungeon.src).toContain("darkest-child-var-a.mp3");
    const calls = dungeon.play.mock.calls.length;
    music.setScene("ruins");
    expect(dungeon.play).toHaveBeenCalledTimes(calls);
    music.setScene("town");
    await settle();
    expect(town.paused).toBe(false);
    expect(dungeon.paused).toBe(true);
  });

  it("pauses in the background and resumes the latest scene on return", async () => {
    music.setScene("town");
    page.dispatchEvent(new Event("click"));
    await settle();
    page.hidden = true;
    page.dispatchEvent(new Event("visibilitychange"));
    expect(FakeAudio.instances.every((audio) => audio.paused)).toBe(true);
    expect(FakeContext.instances[0].state).toBe("suspended");
    music.setScene("ruins");
    page.hidden = false;
    page.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(FakeAudio.instances[1].paused).toBe(false);
  });

  it("uses the latest scene when travel happens during the first audio load", async () => {
    music.setScene("town");
    page.dispatchEvent(new Event("click"));
    music.setScene("ruins");
    await settle();
    expect(FakeAudio.instances[0].paused).toBe(true);
    expect(FakeAudio.instances[1].paused).toBe(false);
    expect(FakeContext.instances[0].gains[1].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.25, 0.8);
  });

  it("keeps muted music stopped across gestures and visibility changes", async () => {
    music.setEnabled(false);
    music.setScene("town");
    page.dispatchEvent(new Event("click"));
    expect(FakeAudio.instances).toHaveLength(0);
    music.setEnabled(true);
    await settle();
    music.setEnabled(false);
    page.dispatchEvent(new Event("visibilitychange"));
    page.dispatchEvent(new Event("keydown"));
    expect(FakeAudio.instances.every((audio) => audio.paused)).toBe(true);
  });

  it("handles autoplay rejection and retries within the next gesture", async () => {
    music.setScene("town");
    page.dispatchEvent(new Event("click"));
    await settle();
    FakeAudio.instances[1].play.mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"));
    music.setScene("ruins");
    await settle();
    expect(notify).toHaveBeenLastCalledWith("ready");
    page.dispatchEvent(new Event("click"));
    await settle();
    expect(notify).toHaveBeenLastCalledWith("playing");
  });

  it("reports media errors and reloads the failed file on explicit retry", async () => {
    music.setScene("town");
    page.dispatchEvent(new Event("click"));
    await settle();
    const town = FakeAudio.instances[0];
    town.error = {} as MediaError;
    town.dispatchEvent(new Event("error"));
    expect(notify).toHaveBeenLastCalledWith("error");
    page.dispatchEvent(new Event("click"));
    expect(notify).toHaveBeenLastCalledWith("error");
    music.retry();
    await settle();
    expect(town.load).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenLastCalledWith("playing");
  });

  it("ignores late play resolution after mute and releases resources on disposal", async () => {
    music.setScene("town");
    page.dispatchEvent(new Event("click"));
    music.setEnabled(false);
    await settle();
    expect(notify).toHaveBeenLastCalledWith("paused");
    expect(FakeContext.instances[0].gains[0].gain.linearRampToValueAtTime).not.toHaveBeenCalled();
    music.dispose();
    expect(FakeContext.instances[0].close).toHaveBeenCalledOnce();
    expect(FakeAudio.instances.every((audio) => audio.paused)).toBe(true);
    page.dispatchEvent(new Event("click"));
    expect(FakeAudio.instances).toHaveLength(2);
  });

  it("survives unavailable Web Audio and restricted preference storage", async () => {
    vi.stubGlobal("AudioContext", undefined);
    music.setScene("town");
    page.dispatchEvent(new Event("click"));
    await settle();
    expect(notify).toHaveBeenLastCalledWith("error");
    vi.mocked(localStorage.getItem).mockReturnValue("false");
    expect(savedMusicEnabled()).toBe(false);
    vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error("Restricted"); });
    vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error("Restricted"); });
    expect(savedMusicEnabled()).toBe(true);
    expect(() => rememberMusicEnabled(false)).not.toThrow();
  });
});
