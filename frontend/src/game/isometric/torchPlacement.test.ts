import { describe, expect, it } from "vitest";

import { torchDrawPosition, torchFlamePosition } from "./torchPlacement";

describe("torch placement", () => {
  const wall = { x: 320, y: 180 };

  it("mounts the rear plate above the inner face of the right wall", () => {
    expect(torchDrawPosition(wall)).toEqual({ x: 270.25, y: 145.5 });
  });

  it("keeps volumetric lighting attached to the rendered flame", () => {
    expect(torchFlamePosition(wall)).toEqual({ x: 293.5, y: 162 });
  });
});
