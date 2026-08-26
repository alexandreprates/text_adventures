import { describe, expect, it } from "vitest";

import {
  adventurerFacingFrame,
  adventurerFacingFrames,
  isWarlordClass,
  isometricAssetPaths,
  torchAnimationLayout,
  warlordAnimationLayout,
} from "./assets";

describe("isometricAssetPaths", () => {
  it("includes the authored environment prop pack", () => {
    expect(isometricAssetPaths).toMatchObject({
      wallFront: "/assets/isometric/tiles/wall-front.png",
      adventurerFacings: "/assets/isometric/actors/adventurer-facings.png",
      warlordWalk: "/assets/isometric/actors/warlord-walk.png",
      warlordAttack: "/assets/isometric/actors/warlord-attack.png",
      barrel: "/assets/isometric/props/barrel.png",
      rubble: "/assets/isometric/props/rubble.png",
      banner: "/assets/isometric/props/banner.png",
    });
  });
});

describe("Warlord animation assets", () => {
  it("selects the class family and exposes the shared animation contract", () => {
    expect(isWarlordClass("Warlord")).toBe(true);
    expect(isWarlordClass(" warlord ")).toBe(true);
    expect(isWarlordClass("Adventurer")).toBe(false);
    expect(warlordAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });
});

describe("adventurerFacingFrame", () => {
  it("maps dungeon directions to the matching isometric facing", () => {
    expect(adventurerFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(adventurerFacingFrame("up")).toBe(0);
    expect(adventurerFacingFrame("right")).toBe(1);
    expect(adventurerFacingFrame("down")).toBe(2);
    expect(adventurerFacingFrame("left")).toBe(3);
    expect(adventurerFacingFrame("unknown")).toBe(1);
  });
});

describe("torchAnimationLayout", () => {
  it("pins every frame to the bottom spike anchor", () => {
    expect(torchAnimationLayout).toEqual({
      frameWidth: 64,
      frameHeight: 96,
      frameCount: 4,
      drawWidth: 48,
      drawHeight: 72,
      anchor: { x: 32, y: 72 },
    });
  });
});
