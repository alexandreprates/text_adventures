import type { Position } from "../../lib/types";

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

export type ProjectedPoint = {
  x: number;
  y: number;
};

export function projectPosition(position: Position): ProjectedPoint {
  return {
    x: (position.x - position.y) * (TILE_WIDTH / 2),
    y: (position.x + position.y) * (TILE_HEIGHT / 2),
  };
}

export function interpolatePosition(from: Position, to: Position, progress: number): Position {
  const clamped = Math.max(0, Math.min(1, progress));

  return {
    x: from.x + (to.x - from.x) * clamped,
    y: from.y + (to.y - from.y) * clamped,
  };
}

export function easeOutCubic(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return 1 - (1 - clamped) ** 3;
}

export function depthFor(position: Position, layer = 0): number {
  return (position.x + position.y) * 100 + position.x + layer;
}
