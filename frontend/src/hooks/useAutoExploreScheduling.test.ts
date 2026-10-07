import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectionStatus, GameState } from "../lib/types";

// Exercise scheduling without a DOM renderer; refs persist and effects run after each render.
const hooks = vi.hoisted(() => ({ refs: [] as Array<{ current: unknown }>, index: 0, effects: [] as Array<() => void | (() => void)> }));
vi.mock("react", () => ({
  useRef: (value: unknown) => hooks.refs[hooks.index++] ?? (hooks.refs[hooks.index - 1] = { current: value }),
  useState: (value: unknown) => [value, () => {}],
  useEffect: (effect: () => void | (() => void), deps?: unknown[]) => {
    if (!deps || hooks.refs.length === 0) hooks.effects.push(effect);
  },
}));
import { useAutoExplore } from "./useAutoExplore";

let storage: Map<string, string>;
beforeEach(() => {
  vi.useFakeTimers();
  hooks.refs = []; hooks.index = 0; hooks.effects = [];
  storage = new Map();
  vi.stubGlobal("window", {
    setTimeout, clearTimeout,
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) },
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  });
  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => (now += 5));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

function setup() {
  const cells = Array.from({ length: 1000 }, (_, x) => [`${x},2`, "open"]);
  storage.set("text_adventures.auto_explore.game", JSON.stringify({ level: 1, cells }));
  const state = {
    scene: "ruins", player: { health: { current: 30, max: 30 }, inventory: [{ type: "potion", name: "potion of heal", quantity: 5 }], spells: [] },
    dungeon: { level: 1, player_position: { x: 998, y: 2 }, viewport: { width: 18, height: 15, origin: { x: 990, y: 0 }, terrain: "?".repeat(270), entities: [] } },
  } as unknown as GameState;
  const runCommand = vi.fn(async () => {});
  const Render = (connectionStatus: ConnectionStatus = "online", nextState = state) => {
    hooks.index = 0;
    const controls = useAutoExplore({ state: nextState, gameId: "game", connectionStatus, runCommand });
    hooks.effects.splice(0).forEach((effect) => effect());
    return controls;
  };
  const controls = Render();
  controls.start();
  return { render: Render, controls, runCommand, state };
}

describe("cooperative auto exploration", () => {
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
