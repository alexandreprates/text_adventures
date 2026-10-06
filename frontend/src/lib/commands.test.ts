import { describe, expect, it } from "vitest";
import { actionFromCommand, autoCompatibleManualCommand, manualAutoExploreGoal, quickCommandsFor } from "./commands";
import { inventoryCommandValue, mergeStatePatch } from "./viewModels";
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
  const scroll = { name: "town portal scroll", type: "scroll", effect: "town_portal", quantity: 1 };

  it("uses portal scrolls from inventory and stops auto-explore before teleporting", () => {
    const state = { ...baseState, player: { ...baseState.player, inventory: [scroll] } };
    expect(inventoryCommandValue(scroll)).toBe("use town portal scroll");
    expect(actionFromCommand(inventoryCommandValue(scroll))).toEqual({ type: "use", item: "town portal scroll" });
    expect(autoCompatibleManualCommand(" USE  town  portal scroll ", state)).toBe(false);
    expect(autoCompatibleManualCommand("use potion of heal", state)).toBe(true);
    expect(autoCompatibleManualCommand("equip sword", state)).toBe(true);
  });

  it("offers the return portal only while the server reports a saved destination", () => {
    const state = { ...baseState, town_portal: { level: 4, player_position: { x: 4, y: 2 } } };
    expect(quickCommandsFor(state)).toContainEqual({ label: "Return to dungeon", command: "go ruins", kind: "primary" });
    const returned = mergeStatePatch(state, { town_portal: null });
    expect(quickCommandsFor(returned)).toContainEqual({ label: "Ruins", command: "go ruins", kind: "primary" });
  });

  it("does not suggest a portal scroll in battle", () => {
    const state = { ...baseState, battle: { active: true }, player: { ...baseState.player, inventory: [scroll] } };
    expect(quickCommandsFor(state).map((command) => command.command)).not.toContain("use town portal scroll");
  });
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

  it("maps combined trade commands to structured actions", () => {
    expect(
      actionFromCommand("trade sell=cracked fang:2|bent nail;buy=potion of heal:5"),
    ).toEqual({
      type: "trade",
      sell: [
        { item: "cracked fang", quantity: 2 },
        { item: "bent nail", quantity: 1 },
      ],
      buy: [{ item: "potion of heal", quantity: 5 }],
    });

    expect(() => actionFromCommand("trade buy=potion of heal:0")).toThrow(
      "Trade quantity must be positive.",
    );
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
