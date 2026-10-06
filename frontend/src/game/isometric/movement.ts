import type { Position } from "../../lib/types";
import { interpolatePosition } from "./projection";

export const MANUAL_MOVE_DURATION_MS = 260;

/** Interpolate confirmed positions without restarting on unrelated state updates. */
export class PlayerMovement {
  private from: Position | null = null;
  private target: Position | null = null;
  private startedAt = 0;
  private durationMs = MANUAL_MOVE_DURATION_MS;

  moveTo(target: Position, time: number, durationMs: number, snap = false): void {
    if (snap || !this.target) {
      this.from = { ...target };
      this.target = { ...target };
      this.startedAt = time;
      return;
    }
    if (this.target.x === target.x && this.target.y === target.y) return;

    this.from = this.positionAt(time);
    this.target = { ...target };
    this.startedAt = time;
    this.durationMs = Math.max(1, durationMs);
  }

  positionAt(time: number): Position | null {
    if (!this.from || !this.target) return this.target;
    return interpolatePosition(this.from, this.target, this.progressAt(time));
  }

  progressAt(time: number): number {
    return Math.max(0, Math.min(1, (time - this.startedAt) / this.durationMs));
  }

  isMovingAt(time: number): boolean {
    return Boolean(this.from && this.target &&
      (this.from.x !== this.target.x || this.from.y !== this.target.y) && this.progressAt(time) < 1);
  }
}
