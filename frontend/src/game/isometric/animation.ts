import type { GameEvent } from "../../lib/types";

export type CombatAnimationCue = {
  actor: "player" | "enemy";
  effect: "slash" | "magic";
  durationMs: number;
};

export function combatCueForEvent(event: GameEvent): CombatAnimationCue | null {
  if (event.type !== "combat.damage") return null;
  if (event.actor !== "player" && event.actor !== "enemy") return null;

  return {
    actor: event.actor,
    effect: event.effect === "magic" ? "magic" : "slash",
    durationMs: event.duration_ms ?? 520,
  };
}

export function latestCombatCue(events: GameEvent[]): CombatAnimationCue | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const cue = combatCueForEvent(events[index]);
    if (cue) return cue;
  }

  return null;
}
