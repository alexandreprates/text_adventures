import { describe, expect, it } from "vitest";
import { animationPhaseAt, combatCueForEvent, latestCombatCue } from "./animation";

describe("isometric event animation", () => {
  it("maps structured combat events without parsing prose", () => {
    expect(
      combatCueForEvent({
        type: "combat.damage",
        text: "Localized text can change freely.",
        actor: "player",
        action: "cast",
        effect: "magic",
        duration_ms: 640,
      }),
    ).toEqual({ actor: "player", effect: "magic", durationMs: 640 });
  });

  it("ignores legacy prose-only events and selects the latest valid cue", () => {
    const legacy = { type: "combat.damage", text: "You attack something." };
    const structured = {
      type: "combat.damage",
      text: "An enemy attacks.",
      actor: "enemy",
      effect: "slash",
    };

    expect(combatCueForEvent(legacy)).toBeNull();
    expect(latestCombatCue([structured, legacy])).toEqual({
      actor: "enemy",
      effect: "slash",
      durationMs: 520,
    });
  });

  it("maps normalized progress across a three-phase animation", () => {
    expect(animationPhaseAt(0, 3)).toBe(0);
    expect(animationPhaseAt(0.34, 3)).toBe(1);
    expect(animationPhaseAt(0.67, 3)).toBe(2);
    expect(animationPhaseAt(1, 3)).toBe(2);
  });
});
