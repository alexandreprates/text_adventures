import { describe, expect, it } from "vitest";
import { setTradeQuantity, tradePayload, tradeTotals } from "./trade";
import type { GameState } from "./types";

const tradeState: GameState = {
  scene: "blacksmith",
  scene_display_name: "Blacksmith",
  prompt: "Blacksmith",
  player: {
    name: "Adventurer",
    health: { current: 30, max: 30 },
    gold: 100,
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
    merchant: "blacksmith",
    display_name: "Blacksmith",
    player_items: [
      { name: "rusty dagger", display_name: "Rusty Dagger", quantity: 2, sell_price: 3, trade_enabled: true },
    ],
    merchant_items: [
      { name: "iron dagger", display_name: "Iron Dagger", buy_price: 20, trade_enabled: true },
    ],
  },
};

describe("trade helpers", () => {
  it("calculates selected trade totals and payloads", () => {
    let selections = { buy: {}, sell: {} };
    selections = setTradeQuantity(selections, "sell", tradeState.trade!.player_items[0], 2);
    selections = setTradeQuantity(selections, "buy", tradeState.trade!.merchant_items[0], 1);

    expect(tradeTotals(tradeState, selections)).toMatchObject({
      currentGold: 100,
      sold: 6,
      bought: 20,
      net: -14,
      finalGold: 86,
      itemCount: 3,
    });
    expect(tradePayload(selections.sell)).toEqual([{ item: "rusty dagger", quantity: 2 }]);
  });
});
