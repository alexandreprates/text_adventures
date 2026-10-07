import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DungeonViewport } from "../../lib/types";
import { IsometricDungeonRenderer } from "./IsometricDungeonRenderer";

beforeEach(() => {
  vi.stubGlobal("window", { devicePixelRatio: 1 });
  vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue: () => "#000" }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const canvas = { dataset: {}, getContext: () => ({ setTransform: vi.fn() }) } as unknown as HTMLCanvasElement;
  const renderer = new IsometricDungeonRenderer(canvas);
  const gate = { pending: false };
  const viewport: DungeonViewport = {
    width: 18, height: 15, origin: { x: -6, y: -5 },
    entities: [{ type: "enemy", x: 1, y: 2, creature_id: "giant_spider" }],
  };
  const options = { dungeonLevel: 1, lootAnimation: gate };
  renderer.render(viewport, options);
  return { renderer, gate, viewport, options };
}

describe("loot presentation lifecycle", () => {
  it("matches a corpse in global coordinates across viewport shifts", () => {
    const { renderer, gate, viewport, options } = fixture();
    renderer.render({ ...viewport, origin: { x: -12, y: -5 }, entities: [{ type: "loot", x: 7, y: 2 }] }, options);
    expect(gate.pending).toBe(true);
    renderer.clear();
    expect(gate.pending).toBe(false);
  });

  it("does not delay unrelated loot when an enemy leaves the viewport", () => {
    const { renderer, gate, viewport, options } = fixture();
    renderer.render({ ...viewport, entities: [{ type: "loot", x: 2, y: 2 }] }, options);
    expect(gate.pending).toBe(false);
  });

  it("releases pending loot on floor changes without carrying a corpse to the new floor", () => {
    const { renderer, gate, viewport, options } = fixture();
    const loot = { ...viewport, entities: [{ type: "loot", x: 1, y: 2 }] };
    renderer.render(loot, options);
    expect(gate.pending).toBe(true);
    renderer.render(loot, { ...options, dungeonLevel: 2 });
    expect(gate.pending).toBe(false);
  });

  it("releases automation when the renderer is destroyed before its next frame", () => {
    const { renderer, gate, viewport, options } = fixture();
    renderer.render({ ...viewport, entities: [{ type: "loot", x: 1, y: 2 }] }, options);
    expect(gate.pending).toBe(true);
    renderer.destroy();
    expect(gate.pending).toBe(false);
  });
});
