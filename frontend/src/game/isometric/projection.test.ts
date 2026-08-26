import { describe, expect, it } from "vitest";
import {
  depthFor,
  easeOutCubic,
  interpolatePosition,
  projectPosition,
} from "./projection";

describe("isometric projection", () => {
  it("projects grid axes onto a 2:1 diamond", () => {
    expect(projectPosition({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(projectPosition({ x: 1, y: 0 })).toEqual({ x: 32, y: 16 });
    expect(projectPosition({ x: 0, y: 1 })).toEqual({ x: -32, y: 16 });
  });

  it("interpolates positions without overshooting", () => {
    expect(interpolatePosition({ x: 1, y: 2 }, { x: 5, y: 6 }, 0.5)).toEqual({ x: 3, y: 4 });
    expect(interpolatePosition({ x: 1, y: 2 }, { x: 5, y: 6 }, 2)).toEqual({ x: 5, y: 6 });
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("orders farther tiles and foreground layers later", () => {
    expect(depthFor({ x: 2, y: 2 })).toBeGreaterThan(depthFor({ x: 1, y: 1 }));
    expect(depthFor({ x: 2, y: 2 }, 20)).toBeGreaterThan(depthFor({ x: 2, y: 2 }, 0));
  });
});
