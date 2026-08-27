function terrainAt(
  terrain: string | undefined,
  width: number,
  height: number,
  x: number,
  y: number,
): string {
  if (!terrain || x < 0 || y < 0 || x >= width || y >= height) return "?";
  return terrain[y * width + x] ?? "?";
}

export function isForegroundWall(
  terrain: string | undefined,
  width: number,
  height: number,
  x: number,
  y: number,
): boolean {
  if (terrainAt(terrain, width, height, x, y) !== "#") return false;

  return [
    [x - 1, y],
    [x, y - 1],
    [x - 1, y - 1],
  ].some(([neighborX, neighborY]) => (
    terrainAt(terrain, width, height, neighborX, neighborY) === "."
  ));
}

export function isRightWallTorchAnchor(
  terrain: string | undefined,
  width: number,
  height: number,
  x: number,
  y: number,
): boolean {
  if (terrainAt(terrain, width, height, x, y) !== "#") return false;

  // In the isometric projection, a wall with floor directly below it in the
  // terrain grid exposes the room's visible right-side vertical face.
  return terrainAt(terrain, width, height, x, y + 1) === ".";
}
