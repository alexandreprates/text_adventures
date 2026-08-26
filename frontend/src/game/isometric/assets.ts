export const isometricAssetPaths = {
  floor: "/assets/isometric/tiles/floor.png",
  wall: "/assets/isometric/tiles/wall.png",
  wallFront: "/assets/isometric/tiles/wall-front.png",
  adventurer: "/assets/isometric/actors/adventurer-actions.png",
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
