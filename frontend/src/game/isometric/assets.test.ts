import { describe, expect, it } from "vitest";

import {
  adventurerFacingFrame,
  adventurerFacingFrames,
  animatedPlayerClass,
  arcanistAnimationLayout,
  arcanistFacingFrame,
  arcanistFacingFrames,
  blademasterAnimationLayout,
  blademasterFacingFrame,
  blademasterFacingFrames,
  directionalClassAnimationLayout,
  dragoonAnimationLayout,
  dragoonFacingFrame,
  dragoonFacingFrames,
  duelistAnimationLayout,
  duelistFacingFrame,
  duelistFacingFrames,
  isArcanistClass,
  isBlademasterClass,
  isDragoonClass,
  isDuelistClass,
  isNightbladeClass,
  isWarlordClass,
  isometricAssetPaths,
  nightbladeAnimationLayout,
  nightbladeFacingFrame,
  nightbladeFacingFrames,
  torchAnimationLayout,
  warlordAnimationLayout,
  warlordFacingFrame,
  warlordFacingFrames,
} from "./assets";

describe("isometricAssetPaths", () => {
  it("includes the authored environment prop pack", () => {
    expect(isometricAssetPaths).toMatchObject({
      wallFront: "/assets/isometric/tiles/wall-front.png",
      adventurerFacings: "/assets/isometric/actors/adventurer-facings.png",
      warlordWalk: "/assets/isometric/actors/warlord-walk.png",
      warlordAttack: "/assets/isometric/actors/warlord-attack.png",
      blademasterWalk: "/assets/isometric/actors/blademaster-walk.png",
      blademasterAttack: "/assets/isometric/actors/blademaster-attack.png",
      duelistWalk: "/assets/isometric/actors/duelist-walk.png",
      duelistAttack: "/assets/isometric/actors/duelist-attack.png",
      dragoonWalk: "/assets/isometric/actors/dragoon-walk.png",
      dragoonAttack: "/assets/isometric/actors/dragoon-attack.png",
      nightbladeWalk: "/assets/isometric/actors/nightblade-walk.png",
      nightbladeAttack: "/assets/isometric/actors/nightblade-attack.png",
      arcanistWalk: "/assets/isometric/actors/arcanist-walk.png",
      arcanistAttack: "/assets/isometric/actors/arcanist-attack.png",
      barrel: "/assets/isometric/props/barrel.png",
      rubble: "/assets/isometric/props/rubble.png",
      banner: "/assets/isometric/props/banner.png",
    });
  });
});

describe("animatedPlayerClass", () => {
  it("selects the directional animation family for supported classes", () => {
    expect(animatedPlayerClass("Arcanist")).toBe("arcanist");
    expect(animatedPlayerClass(" Blademaster ")).toBe("blademaster");
    expect(animatedPlayerClass("Dragoon")).toBe("dragoon");
    expect(animatedPlayerClass("Duelist")).toBe("duelist");
    expect(animatedPlayerClass("Nightblade")).toBe("nightblade");
    expect(animatedPlayerClass("Warlord")).toBe("warlord");
    expect(animatedPlayerClass("Adventurer")).toBeNull();
  });
});

describe("Arcanist animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isArcanistClass("Arcanist")).toBe(true);
    expect(isArcanistClass(" arcanist ")).toBe(true);
    expect(isArcanistClass("Nightblade")).toBe(false);
    expect(arcanistAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(arcanistAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Arcanist sheet's projected facings", () => {
    expect(arcanistFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(arcanistFacingFrame("up")).toBe(0);
    expect(arcanistFacingFrame("right")).toBe(1);
    expect(arcanistFacingFrame("down")).toBe(2);
    expect(arcanistFacingFrame("left")).toBe(3);
    expect(arcanistFacingFrame("unknown")).toBe(1);
  });
});

describe("Nightblade animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isNightbladeClass("Nightblade")).toBe(true);
    expect(isNightbladeClass(" nightblade ")).toBe(true);
    expect(isNightbladeClass("Dragoon")).toBe(false);
    expect(nightbladeAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(nightbladeAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Nightblade sheet's projected facings", () => {
    expect(nightbladeFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(nightbladeFacingFrame("up")).toBe(0);
    expect(nightbladeFacingFrame("right")).toBe(1);
    expect(nightbladeFacingFrame("down")).toBe(2);
    expect(nightbladeFacingFrame("left")).toBe(3);
    expect(nightbladeFacingFrame("unknown")).toBe(1);
  });
});

describe("Dragoon animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isDragoonClass("Dragoon")).toBe(true);
    expect(isDragoonClass(" dragoon ")).toBe(true);
    expect(isDragoonClass("Duelist")).toBe(false);
    expect(dragoonAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(dragoonAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Dragoon sheet's projected facings", () => {
    expect(dragoonFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(dragoonFacingFrame("up")).toBe(0);
    expect(dragoonFacingFrame("right")).toBe(1);
    expect(dragoonFacingFrame("down")).toBe(2);
    expect(dragoonFacingFrame("left")).toBe(3);
    expect(dragoonFacingFrame("unknown")).toBe(1);
  });
});

describe("Duelist animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isDuelistClass("Duelist")).toBe(true);
    expect(isDuelistClass(" duelist ")).toBe(true);
    expect(isDuelistClass("Blademaster")).toBe(false);
    expect(duelistAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(duelistAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Duelist sheet's projected facings", () => {
    expect(duelistFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(duelistFacingFrame("up")).toBe(0);
    expect(duelistFacingFrame("right")).toBe(1);
    expect(duelistFacingFrame("down")).toBe(2);
    expect(duelistFacingFrame("left")).toBe(3);
    expect(duelistFacingFrame("unknown")).toBe(1);
  });
});

describe("Blademaster animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isBlademasterClass("Blademaster")).toBe(true);
    expect(isBlademasterClass(" blademaster ")).toBe(true);
    expect(isBlademasterClass("Warlord")).toBe(false);
    expect(blademasterAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(blademasterAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Blademaster sheet's projected facings", () => {
    expect(blademasterFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(blademasterFacingFrame("up")).toBe(0);
    expect(blademasterFacingFrame("right")).toBe(1);
    expect(blademasterFacingFrame("down")).toBe(2);
    expect(blademasterFacingFrame("left")).toBe(3);
    expect(blademasterFacingFrame("unknown")).toBe(1);
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

  it("maps dungeon movement to the Warlord sheet's projected facings", () => {
    expect(warlordFacingFrames).toEqual({ up: 3, right: 2, down: 1, left: 0 });
    expect(warlordFacingFrame("up")).toBe(3);
    expect(warlordFacingFrame("right")).toBe(2);
    expect(warlordFacingFrame("down")).toBe(1);
    expect(warlordFacingFrame("left")).toBe(0);
    expect(warlordFacingFrame("unknown")).toBe(2);
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
