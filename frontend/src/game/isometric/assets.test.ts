import { describe, expect, it } from "vitest";

import {
  adventurerFacingFrame,
  adventurerFacingFrames,
  isometricAssetPaths,
  torchAnimationLayout,
} from "./assets";

describe("isometricAssetPaths", () => {
  it("includes the authored environment prop pack", () => {
    expect(isometricAssetPaths).toMatchObject({
      wallFront: "/assets/isometric/tiles/wall-front.png",
      adventurerFacings: "/assets/isometric/actors/adventurer-facings.png",
      barrel: "/assets/isometric/props/barrel.png",
      rubble: "/assets/isometric/props/rubble.png",
      banner: "/assets/isometric/props/banner.png",
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
