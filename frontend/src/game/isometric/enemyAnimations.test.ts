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

  it("registers dedicated Orc Raider attack and death sheets", () => {
    expect(enemyAnimationRegistry.orc_raider).toEqual({
      attack: {
        path: "/assets/isometric/enemies/orc_raider-attack.png",
        baselines: [121, 119, 117, 104],
      },
      death: {
        path: "/assets/isometric/enemies/orc_raider-death.png",
        baselines: [119, 116, 103, 106],
      },
    });
    expect(enemyAnimationFor("ORC_RAIDER")).toBe(enemyAnimationRegistry.orc_raider);
  });

  it("registers dedicated Orc Berserker attack and death sheets", () => {
    expect(enemyAnimationRegistry.orc_berserker).toEqual({
      attack: {
        path: "/assets/isometric/enemies/orc_berserker-attack.png",
        baselines: [117, 116, 106, 106],
      },
      death: {
        path: "/assets/isometric/enemies/orc_berserker-death.png",
        baselines: [118, 125, 108, 108],
      },
    });
    expect(enemyAnimationFor("orc_berserker")).toBe(enemyAnimationRegistry.orc_berserker);
  });

  it("registers dedicated Kobold Trapper attack and death sheets", () => {
    expect(enemyAnimationRegistry.kobold_trapper).toEqual({
      attack: {
        path: "/assets/isometric/enemies/kobold_trapper-attack.png",
        baselines: [116, 115, 86, 88],
      },
      death: {
        path: "/assets/isometric/enemies/kobold_trapper-death.png",
        baselines: [114, 112, 88, 90],
      },
    });
    expect(enemyAnimationFor("kobold_trapper")).toBe(enemyAnimationRegistry.kobold_trapper);
  });

  it("registers dedicated Kobold Sparkmage attack and death sheets", () => {
    expect(enemyAnimationRegistry.kobold_sparkmage).toEqual({
      attack: {
        path: "/assets/isometric/enemies/kobold_sparkmage-attack.png",
        baselines: [116, 114, 105, 105],
      },
      death: {
        path: "/assets/isometric/enemies/kobold_sparkmage-death.png",
        baselines: [120, 120, 88, 92],
      },
    });
    expect(enemyAnimationFor("kobold_sparkmage")).toBe(enemyAnimationRegistry.kobold_sparkmage);
  });

  it("registers dedicated Gnoll Hunter attack and death sheets", () => {
    expect(enemyAnimationRegistry.gnoll_hunter).toEqual({
      attack: {
        path: "/assets/isometric/enemies/gnoll_hunter-attack.png",
        baselines: [109, 107, 97, 99],
      },
      death: {
        path: "/assets/isometric/enemies/gnoll_hunter-death.png",
        baselines: [113, 113, 105, 105],
      },
    });
    expect(enemyAnimationFor("gnoll_hunter")).toBe(enemyAnimationRegistry.gnoll_hunter);
  });

  it("registers dedicated Gnoll Bonecaller attack and death sheets", () => {
    expect(enemyAnimationRegistry.gnoll_bonecaller).toEqual({
      attack: {
        path: "/assets/isometric/enemies/gnoll_bonecaller-attack.png",
        baselines: [119, 119, 106, 111],
      },
      death: {
        path: "/assets/isometric/enemies/gnoll_bonecaller-death.png",
        baselines: [116, 115, 79, 80],
      },
    });
    expect(enemyAnimationFor("gnoll_bonecaller")).toBe(enemyAnimationRegistry.gnoll_bonecaller);
  });

  it("registers dedicated Wight Knight attack and death sheets", () => {
    expect(enemyAnimationRegistry.wight_knight).toEqual({
      attack: {
        path: "/assets/isometric/enemies/wight_knight-attack.png",
        baselines: [120, 120, 107, 106],
      },
      death: {
        path: "/assets/isometric/enemies/wight_knight-death.png",
        baselines: [118, 116, 96, 104],
      },
    });
    expect(enemyAnimationFor("wight_knight")).toBe(enemyAnimationRegistry.wight_knight);
  });

  it("registers dedicated Ghoul Stalker attack and death sheets", () => {
    expect(enemyAnimationRegistry.ghoul_stalker).toEqual({
      attack: {
        path: "/assets/isometric/enemies/ghoul_stalker-attack.png",
        baselines: [125, 121, 108, 103],
      },
      death: {
        path: "/assets/isometric/enemies/ghoul_stalker-death.png",
        baselines: [125, 122, 88, 89],
      },
    });
    expect(enemyAnimationFor("ghoul_stalker")).toBe(enemyAnimationRegistry.ghoul_stalker);
  });

  it("registers dedicated Zombie Brute attack and death sheets", () => {
    expect(enemyAnimationRegistry.zombie_brute).toEqual({
      attack: {
        path: "/assets/isometric/enemies/zombie_brute-attack.png",
        baselines: [124, 123, 108, 114],
      },
      death: {
        path: "/assets/isometric/enemies/zombie_brute-death.png",
        baselines: [124, 121, 101, 107],
      },
    });
    expect(enemyAnimationFor("zombie_brute")).toBe(enemyAnimationRegistry.zombie_brute);
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
