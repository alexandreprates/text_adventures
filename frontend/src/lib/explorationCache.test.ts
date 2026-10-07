import { afterEach, describe, expect, it, vi } from "vitest";
import { ExplorationCache } from "./explorationCache";

afterEach(() => vi.useRealTimers());

describe("exploration cache", () => {
  it("serializes only the latest dirty snapshot once per interval", () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const serialize = vi.fn(() => "latest map");
    const cache = new ExplorationCache(write);
    for (let version = 0; version < 20; version++) cache.queue("game-a", String(version), serialize);
    expect(serialize).not.toHaveBeenCalled();
    vi.advanceTimersByTime(750);
    expect(serialize).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledExactlyOnceWith("game-a", "latest map");
    cache.queue("game-a", "19", serialize);
    vi.runAllTimers();
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("flushes the previous owner before switching and cancels stale callbacks", () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const cache = new ExplorationCache(write);
    cache.queue("game-a", "1", () => "floor one");
    cache.queue("game-b", "1", () => "floor two");
    expect(write).toHaveBeenCalledExactlyOnceWith("game-a", "floor one");
    cache.flush();
    expect(write).toHaveBeenLastCalledWith("game-b", "floor two");
    vi.runAllTimers();
    expect(write).toHaveBeenCalledTimes(2);
    cache.queue("game-b", "2", () => "discarded floor");
    cache.discard();
    vi.runAllTimers();
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("tolerates blocked storage and retries on the next update", () => {
    vi.useFakeTimers();
    const write = vi.fn().mockImplementationOnce(() => { throw new Error("quota"); });
    const cache = new ExplorationCache(write);
    cache.queue("game", "1", () => "map");
    expect(() => cache.flush()).not.toThrow();
    cache.queue("game", "1", () => "map");
    vi.runAllTimers();
    expect(write).toHaveBeenCalledTimes(2);
  });
});
