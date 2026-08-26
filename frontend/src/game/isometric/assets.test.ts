import { describe, expect, it } from "vitest";

import {
  adventurerFacingFrame,
  adventurerFacingFrames,
  animatedPlayerClass,
  arcanistAnimationLayout,
  arcanistFacingFrame,
  arcanistFacingFrames,
  battlemageAnimationLayout,
  battlemageFacingFrame,
  battlemageFacingFrames,
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
  isBattlemageClass,
  isBlademasterClass,
  isDragoonClass,
  isDuelistClass,
  isNightbladeClass,
  isSentinelClass,
  isSkirmisherClass,
  isSpellbladeClass,
  isWardenClass,
  isWarlordClass,
  isometricAssetPaths,
  nightbladeAnimationLayout,
  nightbladeFacingFrame,
  nightbladeFacingFrames,
  sentinelAnimationLayout,
  sentinelFacingFrame,
  sentinelFacingFrames,
  skirmisherAnimationLayout,
  skirmisherFacingFrame,
  skirmisherFacingFrames,
  spellbladeAnimationLayout,
  spellbladeFacingFrame,
  spellbladeFacingFrames,
  torchAnimationLayout,
  wardenAnimationLayout,
  wardenFacingFrame,
  wardenFacingFrames,
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
      spellbladeWalk: "/assets/isometric/actors/spellblade-walk.png",
      spellbladeAttack: "/assets/isometric/actors/spellblade-attack.png",
      wardenWalk: "/assets/isometric/actors/warden-walk.png",
      wardenAttack: "/assets/isometric/actors/warden-attack.png",
      skirmisherWalk: "/assets/isometric/actors/skirmisher-walk.png",
      skirmisherAttack: "/assets/isometric/actors/skirmisher-attack.png",
      battlemageWalk: "/assets/isometric/actors/battlemage-walk.png",
      battlemageAttack: "/assets/isometric/actors/battlemage-attack.png",
      sentinelWalk: "/assets/isometric/actors/sentinel-walk.png",
      sentinelAttack: "/assets/isometric/actors/sentinel-attack.png",
      barrel: "/assets/isometric/props/barrel.png",
      rubble: "/assets/isometric/props/rubble.png",
      banner: "/assets/isometric/props/banner.png",
    });
  });
});

describe("animatedPlayerClass", () => {
  it("selects the directional animation family for supported classes", () => {
    expect(animatedPlayerClass("Arcanist")).toBe("arcanist");
    expect(animatedPlayerClass("Battlemage")).toBe("battlemage");
    expect(animatedPlayerClass(" Blademaster ")).toBe("blademaster");
    expect(animatedPlayerClass("Dragoon")).toBe("dragoon");
    expect(animatedPlayerClass("Duelist")).toBe("duelist");
    expect(animatedPlayerClass("Nightblade")).toBe("nightblade");
    expect(animatedPlayerClass("Sentinel")).toBe("sentinel");
    expect(animatedPlayerClass("Skirmisher")).toBe("skirmisher");
    expect(animatedPlayerClass("Spellblade")).toBe("spellblade");
    expect(animatedPlayerClass("Warden")).toBe("warden");
    expect(animatedPlayerClass("Warlord")).toBe("warlord");
    expect(animatedPlayerClass("Adventurer")).toBeNull();
  });
});

describe("Sentinel animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isSentinelClass("Sentinel")).toBe(true);
    expect(isSentinelClass(" sentinel ")).toBe(true);
    expect(isSentinelClass("Warden")).toBe(false);
    expect(sentinelAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(sentinelAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Sentinel sheet's projected facings", () => {
    expect(sentinelFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(sentinelFacingFrame("up")).toBe(0);
    expect(sentinelFacingFrame("right")).toBe(1);
    expect(sentinelFacingFrame("down")).toBe(2);
    expect(sentinelFacingFrame("left")).toBe(3);
    expect(sentinelFacingFrame("unknown")).toBe(1);
  });
});

describe("Battlemage animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isBattlemageClass("Battlemage")).toBe(true);
    expect(isBattlemageClass(" battlemage ")).toBe(true);
    expect(isBattlemageClass("Skirmisher")).toBe(false);
    expect(battlemageAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(battlemageAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Battlemage sheet's projected facings", () => {
    expect(battlemageFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(battlemageFacingFrame("up")).toBe(0);
    expect(battlemageFacingFrame("right")).toBe(1);
    expect(battlemageFacingFrame("down")).toBe(2);
    expect(battlemageFacingFrame("left")).toBe(3);
    expect(battlemageFacingFrame("unknown")).toBe(1);
  });
});

describe("Skirmisher animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isSkirmisherClass("Skirmisher")).toBe(true);
    expect(isSkirmisherClass(" skirmisher ")).toBe(true);
    expect(isSkirmisherClass("Nightblade")).toBe(false);
    expect(skirmisherAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(skirmisherAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Skirmisher sheet's projected facings", () => {
    expect(skirmisherFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(skirmisherFacingFrame("up")).toBe(0);
    expect(skirmisherFacingFrame("right")).toBe(1);
    expect(skirmisherFacingFrame("down")).toBe(2);
    expect(skirmisherFacingFrame("left")).toBe(3);
    expect(skirmisherFacingFrame("unknown")).toBe(1);
  });
});

describe("Warden animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isWardenClass("Warden")).toBe(true);
    expect(isWardenClass(" warden ")).toBe(true);
    expect(isWardenClass("Spellblade")).toBe(false);
    expect(wardenAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(wardenAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Warden sheet's projected facings", () => {
    expect(wardenFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(wardenFacingFrame("up")).toBe(0);
    expect(wardenFacingFrame("right")).toBe(1);
    expect(wardenFacingFrame("down")).toBe(2);
    expect(wardenFacingFrame("left")).toBe(3);
    expect(wardenFacingFrame("unknown")).toBe(1);
  });
});

describe("Spellblade animation assets", () => {
  it("selects the class family and shares the directional animation contract", () => {
    expect(isSpellbladeClass("Spellblade")).toBe(true);
    expect(isSpellbladeClass(" spellblade ")).toBe(true);
    expect(isSpellbladeClass("Arcanist")).toBe(false);
    expect(spellbladeAnimationLayout).toBe(directionalClassAnimationLayout);
    expect(spellbladeAnimationLayout).toEqual({
      frameWidth: 96,
      frameHeight: 128,
      phaseCount: 3,
      idlePhase: 1,
      baseline: 92,
    });
  });

  it("maps dungeon movement to the Spellblade sheet's projected facings", () => {
    expect(spellbladeFacingFrames).toEqual({ up: 0, right: 1, down: 2, left: 3 });
    expect(spellbladeFacingFrame("up")).toBe(0);
    expect(spellbladeFacingFrame("right")).toBe(1);
    expect(spellbladeFacingFrame("down")).toBe(2);
    expect(spellbladeFacingFrame("left")).toBe(3);
    expect(spellbladeFacingFrame("unknown")).toBe(1);
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
