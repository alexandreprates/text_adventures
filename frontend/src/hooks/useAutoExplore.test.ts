import { describe, expect, it } from "vitest";
import { autoExploreResupplyTradeCommand } from "./useAutoExplore";
import type { GameState } from "../lib/types";

function tavernState(overrides: Partial<GameState> = {}): GameState {
  return {
    scene: "tavern",
    scene_display_name: "Tavern",
    prompt: "Tavern",
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
    trade: {
      merchant: "tavern",
      display_name: "Tavern",
      player_items: [],
      merchant_items: [
        {
          name: "potion of heal",
          display_name: "Potion of Heal",
          type: "potion",
          buy_price: 1,
          trade_enabled: true,
        },
      ],
    },
    ...overrides,
  };
}

describe("autoExploreResupplyTradeCommand", () => {
  it("sells all junk and buys five heal potions when the gold allows it", () => {
    const state = tavernState({
      player: {
        ...tavernState().player,
        gold: 2,
      },
      trade: {
        ...tavernState().trade!,
        player_items: [
          {
            name: "cracked fang",
            display_name: "Cracked Fang",
            type: "junk",
            quantity: 2,
            sell_price: 1,
            trade_enabled: true,
          },
          {
            name: "bent nail",
            display_name: "Bent Nail",
            type: "junk",
            quantity: 1,
            sell_price: 1,
            trade_enabled: true,
          },
        ],
      },
    });

    expect(autoExploreResupplyTradeCommand(state)).toBe(
      "trade sell=cracked fang:2|bent nail:1;buy=potion of heal:5",
    );
  });

  it("buys the maximum affordable heal potions after selling junk", () => {
    const state = tavernState({
      player: {
        ...tavernState().player,
        gold: 1,
      },
      trade: {
        ...tavernState().trade!,
        player_items: [
          {
            name: "chipped claw",
            display_name: "Chipped Claw",
            type: "junk",
            quantity: 1,
            sell_price: 1,
            trade_enabled: true,
          },
        ],
        merchant_items: [
          {
            name: "potion of heal",
            display_name: "Potion of Heal",
            type: "potion",
            buy_price: 2,
            trade_enabled: true,
          },
        ],
      },
    });

    expect(autoExploreResupplyTradeCommand(state)).toBe(
      "trade sell=chipped claw:1;buy=potion of heal:1",
    );
  });

  it("does not emit a trade when no junk or potion budget is available", () => {
    expect(autoExploreResupplyTradeCommand(tavernState())).toBeNull();
  });
});
