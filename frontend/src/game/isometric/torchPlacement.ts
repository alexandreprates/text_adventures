import { torchAnimationLayout } from "./assets";
import type { ProjectedPoint } from "./projection";

export function torchDrawPosition(wall: ProjectedPoint): ProjectedPoint {
  const scaleX = torchAnimationLayout.drawWidth / torchAnimationLayout.frameWidth;
  const scaleY = torchAnimationLayout.drawHeight / torchAnimationLayout.frameHeight;

  return {
    x: wall.x
      + torchAnimationLayout.wallTargetOffset.x
      - torchAnimationLayout.wallMount.x * scaleX,
    y: wall.y
      + torchAnimationLayout.wallTargetOffset.y
      - torchAnimationLayout.wallMount.y * scaleY,
  };
}

export function torchFlamePosition(wall: ProjectedPoint): ProjectedPoint {
  const draw = torchDrawPosition(wall);
  const scaleX = torchAnimationLayout.drawWidth / torchAnimationLayout.frameWidth;
  const scaleY = torchAnimationLayout.drawHeight / torchAnimationLayout.frameHeight;

  return {
    x: draw.x + torchAnimationLayout.flame.x * scaleX,
    y: draw.y + torchAnimationLayout.flame.y * scaleY,
  };
}
