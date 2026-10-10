import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectionStatus, GameState } from "../lib/types";

// Exercise scheduling without a DOM renderer; refs persist and effects run after each render.
const hooks = vi.hoisted(() => ({ refs: [] as Array<{ current: unknown }>, index: 0, mounted: false, cleanups: [] as Array<() => void>, effects: [] as Array<() => void | (() => void)> }));
vi.mock("react", () => ({
  useRef: (value: unknown) => hooks.refs[hooks.index++] ?? (hooks.refs[hooks.index - 1] = { current: value }),
  useState: (value: unknown) => [value, () => {}],
  useEffect: (effect: () => void | (() => void), deps?: unknown[]) => {
    if (!deps || !hooks.mounted) hooks.effects.push(effect);
  },
}));
import { useAutoExplore } from "./useAutoExplore";

let storage: Map<string, string>;
beforeEach(() => {
  vi.useFakeTimers();
  hooks.refs = []; hooks.index = 0; hooks.effects = []; hooks.cleanups = []; hooks.mounted = false;
  storage = new Map();
  vi.stubGlobal("window", {
    setTimeout, clearTimeout,
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) },
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  });
  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => (now += 5));
});
afterEach(() => { hooks.cleanups.forEach((cleanup) => cleanup()); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

function setup(initialState?: GameState) {
  const cells = Array.from({ length: 1000 }, (_, x) => [`${x},2`, "open"]);
  if (!initialState) storage.set("text_adventures.auto_explore.game", JSON.stringify({ level: 1, cells }));
  const state = initialState ?? {
    scene: "ruins", player: { health: { current: 30, max: 30 }, inventory: [{ type: "potion", name: "potion of heal", quantity: 5 }], spells: [] },
    dungeon: { level: 1, player_position: { x: 998, y: 2 }, viewport: { width: 18, height: 15, origin: { x: 990, y: 0 }, terrain: "?".repeat(270), entities: [] } },
  } as unknown as GameState;
  const runCommand = vi.fn(async () => {});
  const Render = (connectionStatus: ConnectionStatus = "online", nextState = state, gameId = "game") => {
    hooks.index = 0;
    const controls = useAutoExplore({ state: nextState, gameId, connectionStatus, runCommand });
    hooks.effects.splice(0).forEach((effect) => { const cleanup = effect(); if (cleanup) hooks.cleanups.push(cleanup); });
    hooks.mounted = true;
    return controls;
  };
  const controls = Render();
  controls.start();
  return { render: Render, controls, runCommand, state };
}

describe("cooperative auto exploration", () => {
  it.each(["default", "explore", "descent"] as const)("keeps descending across floors with the %s goal until stopped", async (goal) => {
    const initial = {
      scene: "ruins",
      player: { level: 10, health: { current: 30, max: 30 }, inventory: [{ type: "potion", name: "potion of heal", quantity: 5 }], spells: [] },
      dungeon: {
        level: 1, player_position: { x: 1, y: 1 }, descent: { x: 2, y: 1 },
        viewport: { width: 3, height: 3, origin: { x: 0, y: 0 }, terrain: ".........", entities: [{ type: "descent", x: 2, y: 1 }] },
      },
    } as unknown as GameState;
    const { render, controls, runCommand } = setup(initial);
    if (goal !== "default") controls.setGoal(goal);
    for (const level of [1, 2, 3]) {
      if (level > 1) render("online", { ...initial, dungeon: { ...initial.dungeon!, level } });
      await vi.advanceTimersByTimeAsync(550);
      expect(runCommand).toHaveBeenLastCalledWith("go right", { source: "auto" });
      expect(runCommand).toHaveBeenCalledTimes(level);
    }
    controls.stop();
    await vi.advanceTimersByTimeAsync(2000);
    expect(runCommand).toHaveBeenCalledTimes(3);
  });

  it.each([1, 2, 3])("waits for the rendered loot frame at speed %s even after the death timer elapsed", async (speed) => {
    const { render, controls, state, runCommand } = setup();
    controls.setSpeed(speed);
    controls.lootAnimation.pending = true;
    render("online", { ...state, dungeon: { ...state.dungeon!, nearby_loot: { x: 999, y: 2, gold: 1, items: [] } } });
    await vi.advanceTimersByTimeAsync(4000);
    expect(runCommand).not.toHaveBeenCalled();
    controls.lootAnimation.pending = false;
    await vi.advanceTimersByTimeAsync(1100);
    expect(runCommand).toHaveBeenCalledWith("loot", { source: "auto" });
  });

  it("flushes the previous game before clearing its mutable map", async () => {
    const { render, state } = setup();
    render("online", { ...state, dungeon: { ...state.dungeon!, level: 2 } }, "other-game");
    await vi.advanceTimersByTimeAsync(1000);
    const previous = JSON.parse(storage.get("text_adventures.auto_explore.game")!);
    const current = JSON.parse(storage.get("text_adventures.auto_explore.other-game")!);
    expect(previous.level).toBe(1);
    expect(previous.cells.length).toBe(1000);
    expect(previous.visited).toContain("998,2");
    expect(current.level).toBe(2);
    expect(current.cells).toEqual([]);
  });

  it("cancels a suspended search and flushes knowledge on unmount", async () => {
    const { runCommand } = setup();
    await vi.advanceTimersByTimeAsync(520);
    hooks.cleanups.splice(0).forEach((cleanup) => cleanup());
    await vi.advanceTimersByTimeAsync(1000);
    expect(runCommand).not.toHaveBeenCalled();
    expect(JSON.parse(storage.get("text_adventures.auto_explore.game")!).visited).toContain("998,2");
  });

  it("does not send a movement while a manual action becomes pending during search", async () => {
    const { render, runCommand } = setup();
    await vi.advanceTimersByTimeAsync(520);
    expect(runCommand).not.toHaveBeenCalled();
    render("sending");
    await vi.advanceTimersByTimeAsync(200);
    expect(runCommand).not.toHaveBeenCalled();
    render("online");
    await vi.advanceTimersByTimeAsync(550);
    expect(runCommand).toHaveBeenCalledWith("go left", { source: "auto" });
  });

  it("cancels a suspended search when exploration stops", async () => {
    const { controls, runCommand } = setup();
    await vi.advanceTimersByTimeAsync(520);
    controls.stop();
    await vi.advanceTimersByTimeAsync(1000);
    expect(runCommand).not.toHaveBeenCalled();
  });

  it("discards a suspended route when the server starts combat", async () => {
    const { render, controls, state, runCommand } = setup();
    await vi.advanceTimersByTimeAsync(520);
    render("online", { ...state, battle: { active: true, enemy: null } });
    await vi.advanceTimersByTimeAsync(1100);
    controls.stop();
    expect(runCommand.mock.calls.length).toBeGreaterThan(0);
    expect(runCommand).not.toHaveBeenCalledWith("go left", { source: "auto" });
    expect(runCommand).toHaveBeenCalledWith("attack", { source: "auto" });
  });
});
