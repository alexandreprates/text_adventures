import { describe, expect, it } from "vitest";

import { isometricAssetPaths, torchAnimationLayout } from "./assets";

describe("isometricAssetPaths", () => {
  it("includes the authored environment prop pack", () => {
    expect(isometricAssetPaths).toMatchObject({
      wallFront: "/assets/isometric/tiles/wall-front.png",
      barrel: "/assets/isometric/props/barrel.png",
      rubble: "/assets/isometric/props/rubble.png",
      banner: "/assets/isometric/props/banner.png",
    });
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
