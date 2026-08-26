export const isometricAssetPaths = {
  floor: "/assets/isometric/tiles/floor.png",
  wall: "/assets/isometric/tiles/wall.png",
  wallFront: "/assets/isometric/tiles/wall-front.png",
  adventurer: "/assets/isometric/actors/adventurer-actions.png",
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
  goblin: "/assets/isometric/enemies/goblin-actions.png",
  skeleton: "/assets/isometric/enemies/skeleton-actions.png",
  chest: "/assets/isometric/props/chest-actions.png",
  torch: "/assets/isometric/props/torch-loop.png",
  barrel: "/assets/isometric/props/barrel.png",
  rubble: "/assets/isometric/props/rubble.png",
  banner: "/assets/isometric/props/banner.png",
  portal: "/assets/isometric/props/portal.png",
  stairsDown: "/assets/isometric/props/stairs-down.png",
  lightPool: "/assets/isometric/effects/light-pool.png",
  slash: "/assets/isometric/effects/slash.png",
  magic: "/assets/isometric/effects/magic.png",
} as const;

export const adventurerFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function adventurerFacingFrame(direction?: string): number {
  if (direction && direction in adventurerFacingFrames) {
    return adventurerFacingFrames[direction as keyof typeof adventurerFacingFrames];
  }

  return adventurerFacingFrames.right;
}

export const directionalClassAnimationLayout = {
  frameWidth: 96,
  frameHeight: 128,
  phaseCount: 3,
  idlePhase: 1,
  baseline: 92,
} as const;

export const warlordAnimationLayout = directionalClassAnimationLayout;
export const blademasterAnimationLayout = directionalClassAnimationLayout;
export const duelistAnimationLayout = directionalClassAnimationLayout;
export const dragoonAnimationLayout = directionalClassAnimationLayout;
export const nightbladeAnimationLayout = directionalClassAnimationLayout;
export const arcanistAnimationLayout = directionalClassAnimationLayout;
export const spellbladeAnimationLayout = directionalClassAnimationLayout;
export const wardenAnimationLayout = directionalClassAnimationLayout;
export const skirmisherAnimationLayout = directionalClassAnimationLayout;
export const battlemageAnimationLayout = directionalClassAnimationLayout;

export const warlordFacingFrames = {
  up: 3,
  right: 2,
  down: 1,
  left: 0,
} as const;

export function warlordFacingFrame(direction?: string): number {
  if (direction && direction in warlordFacingFrames) {
    return warlordFacingFrames[direction as keyof typeof warlordFacingFrames];
  }

  return warlordFacingFrames.right;
}

export const blademasterFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function blademasterFacingFrame(direction?: string): number {
  if (direction && direction in blademasterFacingFrames) {
    return blademasterFacingFrames[direction as keyof typeof blademasterFacingFrames];
  }

  return blademasterFacingFrames.right;
}

export const duelistFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function duelistFacingFrame(direction?: string): number {
  if (direction && direction in duelistFacingFrames) {
    return duelistFacingFrames[direction as keyof typeof duelistFacingFrames];
  }

  return duelistFacingFrames.right;
}

export const dragoonFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function dragoonFacingFrame(direction?: string): number {
  if (direction && direction in dragoonFacingFrames) {
    return dragoonFacingFrames[direction as keyof typeof dragoonFacingFrames];
  }

  return dragoonFacingFrames.right;
}

export const nightbladeFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function nightbladeFacingFrame(direction?: string): number {
  if (direction && direction in nightbladeFacingFrames) {
    return nightbladeFacingFrames[direction as keyof typeof nightbladeFacingFrames];
  }

  return nightbladeFacingFrames.right;
}

export const arcanistFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function arcanistFacingFrame(direction?: string): number {
  if (direction && direction in arcanistFacingFrames) {
    return arcanistFacingFrames[direction as keyof typeof arcanistFacingFrames];
  }

  return arcanistFacingFrames.right;
}

export const spellbladeFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function spellbladeFacingFrame(direction?: string): number {
  if (direction && direction in spellbladeFacingFrames) {
    return spellbladeFacingFrames[direction as keyof typeof spellbladeFacingFrames];
  }

  return spellbladeFacingFrames.right;
}

export const wardenFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function wardenFacingFrame(direction?: string): number {
  if (direction && direction in wardenFacingFrames) {
    return wardenFacingFrames[direction as keyof typeof wardenFacingFrames];
  }

  return wardenFacingFrames.right;
}

export const skirmisherFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function skirmisherFacingFrame(direction?: string): number {
  if (direction && direction in skirmisherFacingFrames) {
    return skirmisherFacingFrames[direction as keyof typeof skirmisherFacingFrames];
  }

  return skirmisherFacingFrames.right;
}

export const battlemageFacingFrames = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
} as const;

export function battlemageFacingFrame(direction?: string): number {
  if (direction && direction in battlemageFacingFrames) {
    return battlemageFacingFrames[direction as keyof typeof battlemageFacingFrames];
  }

  return battlemageFacingFrames.right;
}

export type AnimatedPlayerClass =
  | "arcanist"
  | "battlemage"
  | "blademaster"
  | "dragoon"
  | "duelist"
  | "nightblade"
  | "skirmisher"
  | "spellblade"
  | "warden"
  | "warlord";

export function animatedPlayerClass(playerClass?: string): AnimatedPlayerClass | null {
  const normalizedClass = playerClass?.trim().toLowerCase();
  if (
    normalizedClass === "arcanist"
    || normalizedClass === "battlemage"
    || normalizedClass === "blademaster"
    || normalizedClass === "dragoon"
    || normalizedClass === "duelist"
    || normalizedClass === "nightblade"
    || normalizedClass === "skirmisher"
    || normalizedClass === "spellblade"
    || normalizedClass === "warden"
    || normalizedClass === "warlord"
  ) {
    return normalizedClass;
  }

  return null;
}

export function isWarlordClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "warlord";
}

export function isBlademasterClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "blademaster";
}

export function isDuelistClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "duelist";
}

export function isDragoonClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "dragoon";
}

export function isNightbladeClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "nightblade";
}

export function isArcanistClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "arcanist";
}

export function isSpellbladeClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "spellblade";
}

export function isWardenClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "warden";
}

export function isSkirmisherClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "skirmisher";
}

export function isBattlemageClass(playerClass?: string): boolean {
  return animatedPlayerClass(playerClass) === "battlemage";
}

export const torchAnimationLayout = {
  frameWidth: 64,
  frameHeight: 96,
  frameCount: 4,
  drawWidth: 48,
  drawHeight: 72,
  anchor: { x: 32, y: 72 },
} as const;

export type IsometricAssetName = keyof typeof isometricAssetPaths;
export type IsometricAssets = Record<IsometricAssetName, HTMLImageElement>;

function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Unable to load ${path}`)), {
      once: true,
    });
    image.src = path;
  });
}

export async function loadIsometricAssets(): Promise<IsometricAssets> {
  const entries = await Promise.all(
    Object.entries(isometricAssetPaths).map(async ([name, path]) => {
      return [name, await loadImage(path)] as const;
    }),
  );

  return Object.fromEntries(entries) as IsometricAssets;
}
