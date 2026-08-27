import { describe, expect, it } from "vitest";

import { isForegroundWall, isRightWallTorchAnchor } from "./wallTopology";

const room = [
  "#####",
  "#...#",
  "#...#",
  "#...#",
  "#####",
].join("");

describe("isForegroundWall", () => {
  it("cuts away front and lower walls while retaining the rear architecture", () => {
    expect(isForegroundWall(room, 5, 5, 4, 2)).toBe(true);
    expect(isForegroundWall(room, 5, 5, 2, 4)).toBe(true);
    expect(isForegroundWall(room, 5, 5, 4, 4)).toBe(true);
    expect(isForegroundWall(room, 5, 5, 2, 0)).toBe(false);
    expect(isForegroundWall(room, 5, 5, 0, 2)).toBe(false);
  });

  it("does not classify floor or unrevealed tiles as foreground walls", () => {
    expect(isForegroundWall(room, 5, 5, 2, 2)).toBe(false);
    expect(isForegroundWall(undefined, 5, 5, 4, 2)).toBe(false);
  });
});

describe("isRightWallTorchAnchor", () => {
  it("accepts only a wall tile exposing the room's visible right-side face", () => {
    expect(isRightWallTorchAnchor(room, 5, 5, 2, 0)).toBe(true);
    expect(isRightWallTorchAnchor(room, 5, 5, 4, 2)).toBe(false);
    expect(isRightWallTorchAnchor(room, 5, 5, 2, 2)).toBe(false);
  });

  it("rejects missing terrain and walls without adjacent floor", () => {
    expect(isRightWallTorchAnchor(undefined, 5, 5, 2, 0)).toBe(false);
    expect(isRightWallTorchAnchor(room, 5, 5, 0, 0)).toBe(false);
  });
});
