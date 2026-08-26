import type { ProjectedPoint } from "./projection";

export const dungeonLightingLayout = {
  visionInnerRadius: 54,
  visionOuterRadius: 210,
  visionVerticalScale: 0.6,
  playerGlowRadius: 132,
  playerGlowVerticalScale: 0.52,
  torchGlowRadius: 116,
  torchGlowVerticalScale: 0.58,
  torchBeamLength: 132,
  torchBeamSourceHalfWidth: 5,
  torchBeamHalfWidth: 54,
} as const;

export type LightBeamGeometry = {
  sourceLeft: ProjectedPoint;
  sourceRight: ProjectedPoint;
  endLeft: ProjectedPoint;
  endRight: ProjectedPoint;
  endCenter: ProjectedPoint;
};

export function torchPulseAt(time: number, reducedMotion = false): number {
  if (reducedMotion) return 0.92;

  return 0.92 + Math.sin(time / 230) * 0.08;
}

export function lightBeamGeometry(
  source: ProjectedPoint,
  target: ProjectedPoint,
  length: number,
  sourceHalfWidth: number,
  endHalfWidth: number,
): LightBeamGeometry {
  const deltaX = target.x - source.x;
  const deltaY = target.y - source.y;
  const distance = Math.hypot(deltaX, deltaY) || 1;
  const directionX = deltaX / distance;
  const directionY = deltaY / distance;
  const perpendicularX = -directionY;
  const perpendicularY = directionX;
  const endCenter = {
    x: source.x + directionX * length,
    y: source.y + directionY * length,
  };

  return {
    sourceLeft: {
      x: source.x + perpendicularX * sourceHalfWidth,
      y: source.y + perpendicularY * sourceHalfWidth,
    },
    sourceRight: {
      x: source.x - perpendicularX * sourceHalfWidth,
      y: source.y - perpendicularY * sourceHalfWidth,
    },
    endLeft: {
      x: endCenter.x + perpendicularX * endHalfWidth,
      y: endCenter.y + perpendicularY * endHalfWidth,
    },
    endRight: {
      x: endCenter.x - perpendicularX * endHalfWidth,
      y: endCenter.y - perpendicularY * endHalfWidth,
    },
    endCenter,
  };
}
