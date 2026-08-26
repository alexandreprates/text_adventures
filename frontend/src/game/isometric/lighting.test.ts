import { describe, expect, it } from "vitest";

import {
  dungeonLightingLayout,
  lightBeamGeometry,
  torchPulseAt,
} from "./lighting";

describe("dungeon lighting", () => {
  it("keeps the vision mask local and shaped for the isometric projection", () => {
    expect(dungeonLightingLayout.visionInnerRadius).toBeLessThan(
      dungeonLightingLayout.visionOuterRadius,
    );
    expect(dungeonLightingLayout.visionVerticalScale).toBeGreaterThan(0);
    expect(dungeonLightingLayout.visionVerticalScale).toBeLessThan(1);
  });

  it("uses a stable torch intensity for reduced motion and a bounded flicker otherwise", () => {
    expect(torchPulseAt(0, true)).toBe(0.92);
    expect(torchPulseAt(Math.PI * 115)).toBeCloseTo(1);
    expect(torchPulseAt(Math.PI * 345)).toBeCloseTo(0.84);
  });

  it("builds a widening beam toward the visible room", () => {
    const beam = lightBeamGeometry(
      { x: 10, y: 20 },
      { x: 110, y: 20 },
      80,
      4,
      24,
    );

    expect(beam.endCenter).toEqual({ x: 90, y: 20 });
    expect(beam.sourceLeft.y - beam.sourceRight.y).toBe(8);
    expect(beam.endLeft.y - beam.endRight.y).toBe(48);
  });
});
