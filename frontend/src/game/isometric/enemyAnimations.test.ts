import { describe, expect, it } from "vitest";

import {
  enemyAnimationCell,
  enemyAnimationFor,
  enemyAnimationLayout,
  enemyAnimationRegistry,
} from "./enemyAnimations";

describe("enemy animations", () => {
  it("registers dedicated Giant Spider attack and death sheets", () => {
    expect(enemyAnimationRegistry.giant_spider).toEqual({
      attack: {
        path: "/assets/isometric/enemies/giant_spider-attack.png",
        baselines: [103, 112, 94, 96],
      },
      death: {
        path: "/assets/isometric/enemies/giant_spider-death.png",
        baselines: [112, 109, 79, 76],
      },
    });
    expect(enemyAnimationFor(" giant_spider ")).toBe(enemyAnimationRegistry.giant_spider);
    expect(enemyAnimationFor("unknown")).toBeNull();
  });

  it("maps four phases across the shared two-by-two sheet", () => {
    expect(enemyAnimationLayout).toMatchObject({
      frameWidth: 128,
      frameHeight: 128,
      columns: 2,
      rows: 2,
      phaseCount: 4,
    });
    expect([0, 1, 2, 3].map(enemyAnimationCell)).toEqual([
      { column: 0, row: 0 },
      { column: 1, row: 0 },
      { column: 0, row: 1 },
      { column: 1, row: 1 },
    ]);
  });
});
