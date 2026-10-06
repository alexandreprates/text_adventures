import { describe, expect, it } from "vitest";
import { PlayerMovement } from "./movement";

describe("confirmed player movement", () => {
  it("moves at constant speed for the full step instead of easing to an early stop", () => {
    const movement = new PlayerMovement();
    movement.moveTo({ x: 0, y: 0 }, 0, 520);
    movement.moveTo({ x: 1, y: 0 }, 100, 520);

    expect(movement.positionAt(230)).toEqual({ x: 0.25, y: 0 });
    expect(movement.positionAt(360)).toEqual({ x: 0.5, y: 0 });
    expect(movement.positionAt(490)).toEqual({ x: 0.75, y: 0 });
    expect(movement.positionAt(620)).toEqual({ x: 1, y: 0 });
    expect(movement.isMovingAt(619)).toBe(true);
    expect(movement.isMovingAt(620)).toBe(false);
  });

  it("keeps an in-progress step when the same position is rendered again", () => {
    const movement = new PlayerMovement();
    movement.moveTo({ x: 0, y: 0 }, 0, 520);
    movement.moveTo({ x: 1, y: 0 }, 100, 520);
    movement.moveTo({ x: 1, y: 0 }, 360, 173);

    expect(movement.positionAt(360)).toEqual({ x: 0.5, y: 0 });
    expect(movement.positionAt(490)).toEqual({ x: 0.75, y: 0 });
  });

  it("starts an interrupted step at the displayed position without jumping to the old target", () => {
    const movement = new PlayerMovement();
    movement.moveTo({ x: 0, y: 0 }, 0, 260);
    movement.moveTo({ x: 1, y: 0 }, 100, 260);
    const before = movement.positionAt(230);
    movement.moveTo({ x: 1, y: 1 }, 230, 260);

    expect(movement.positionAt(230)).toEqual(before);
    expect(movement.positionAt(360)).toEqual({ x: 0.75, y: 0.5 });
    expect(movement.positionAt(490)).toEqual({ x: 1, y: 1 });
  });

  it("snaps safely for reduced motion, floor changes, and reconnects", () => {
    const movement = new PlayerMovement();
    movement.moveTo({ x: 0, y: 0 }, 0, 260);
    movement.moveTo({ x: 1, y: 0 }, 100, 260);
    movement.moveTo({ x: 8, y: 9 }, 150, 260, true);

    expect(movement.positionAt(150)).toEqual({ x: 8, y: 9 });
    expect(movement.isMovingAt(150)).toBe(false);
  });

  it("uses elapsed time equally at 30, 60, and 120 Hz and settles after a background pause", () => {
    for (const fps of [30, 60, 120]) {
      const movement = new PlayerMovement();
      movement.moveTo({ x: 0, y: 0 }, 0, 500);
      movement.moveTo({ x: -1, y: 0 }, 0, 500);
      for (let time = 0; time < 250; time += 1000 / fps) movement.positionAt(time);
      expect(movement.positionAt(250)).toEqual({ x: -0.5, y: 0 });
      expect(movement.positionAt(10_000)).toEqual({ x: -1, y: 0 });
      expect(movement.isMovingAt(10_000)).toBe(false);
    }
  });
});
