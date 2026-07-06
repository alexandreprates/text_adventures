import { describe, expect, it } from "vitest";
import { commandPlaceholder } from "./viewModels";
import type { GameState } from "./types";

const baseState: GameState = {
  scene: "town",
  scene_display_name: "Town",
  prompt: "Town",
  player: {
    name: "Adventurer",
    health: { current: 30, max: 30 },
    mana: { current: 12, max: 12 },
    gold: 0,
    level: 1,
    xp: 0,
    equipment: {},
    inventory: [],
    spells: [],
    skills: {},
  },
  dungeon: null,
  battle: { active: false, enemy: null },
  pending: { confirmation: false },
};

describe("commandPlaceholder", () => {
  it("uses shorter suggestions for compact viewports", () => {
    expect(commandPlaceholder(baseState)).toBe("go ruins, go blacksmith, inventory");
    expect(commandPlaceholder(baseState, true)).toBe("go ruins, inventory");
    expect(commandPlaceholder({ ...baseState, scene: "ruins", prompt: "Ruins L1" }, true)).toBe(
      "go, attack, loot",
    );
  });
});
