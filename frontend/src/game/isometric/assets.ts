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

export type AnimatedPlayerClass = "blademaster" | "dragoon" | "duelist" | "warlord";

export function animatedPlayerClass(playerClass?: string): AnimatedPlayerClass | null {
  const normalizedClass = playerClass?.trim().toLowerCase();
  if (
    normalizedClass === "blademaster"
    || normalizedClass === "dragoon"
    || normalizedClass === "duelist"
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
