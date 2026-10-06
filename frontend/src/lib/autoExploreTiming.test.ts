import { describe, expect, it } from "vitest";
import { autoExploreStepDelay, autoExploreStepDuration } from "./autoExploreTiming";

describe("auto-explore movement cadence", () => {
  it("shares the same step duration across automation and animation at every speed", () => {
    expect([1, 2, 3].map(autoExploreStepDuration)).toEqual([520, 260, 173]);
    expect(autoExploreStepDuration(0)).toBe(520);
  });

  it("includes server latency inside the step interval instead of adding another full delay", () => {
    expect(autoExploreStepDelay(1, 1000, 1120)).toBe(400);
    expect(autoExploreStepDelay(2, 1000, 1120)).toBe(140);
    expect(autoExploreStepDelay(3, 1000, 1120)).toBe(53);
  });

  it("keeps a fixed deadline through rerenders and never queues catch-up steps", () => {
    expect(1120 + autoExploreStepDelay(1, 1000, 1120)).toBe(1520);
    expect(1400 + autoExploreStepDelay(1, 1000, 1400)).toBe(1520);
    expect(autoExploreStepDelay(1, 1000, 3000)).toBe(0);
    expect(autoExploreStepDelay(1, null, 3000)).toBe(520);
  });
});
