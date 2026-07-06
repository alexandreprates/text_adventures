import { describe, expect, it } from "vitest";
import { actionFromCommand, manualAutoExploreGoal, quickCommandsFor } from "./commands";
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

describe("actionFromCommand", () => {
  it("maps movement and item commands to structured actions", () => {
    expect(actionFromCommand("go right")).toEqual({ type: "move", direction: "right" });
    expect(actionFromCommand("go blacksmith")).toEqual({
      type: "travel",
      destination: "blacksmith",
    });
    expect(actionFromCommand("cast fireball")).toEqual({ type: "cast", spell: "fireball" });
    expect(actionFromCommand("use potion of heal")).toEqual({
      type: "use",
      item: "potion of heal",
    });
  });

  it("keeps context command sets focused by scene", () => {
    expect(quickCommandsFor(baseState).map((command) => command.command)).toContain("go ruins");
    expect(
      quickCommandsFor({
        ...baseState,
        scene: "ruins",
        prompt: "Ruins L1",
        dungeon: {
          level: 1,
          viewport: { width: 3, height: 3, terrain: ".........", entities: [] },
        },
      }).map((command) => command.command),
    ).toEqual(["go up", "go left", "go right", "go down", "look", "loot", "attack", "go town"]);
  });

  it("recognizes typed auto-explore goals only inside ruins", () => {
    expect(manualAutoExploreGoal("explore", baseState)).toBeNull();
    expect(
      manualAutoExploreGoal("go deep", {
        ...baseState,
        scene: "ruins",
        prompt: "Ruins L1",
        dungeon: {
          level: 1,
          viewport: { width: 3, height: 3, terrain: ".........", entities: [] },
        },
      }),
    ).toBe("descent");
  });
});
