import type { GameState, Item, TradeLine } from "./types";

export type TradeSelections = {
  buy: Record<string, number>;
  sell: Record<string, number>;
};

export type TradeTotals = {
  currentGold: number;
  sold: number;
  bought: number;
  net: number;
  finalGold: number;
  itemCount: number;
};

export const emptyTradeSelections: TradeSelections = {
  buy: {},
  sell: {},
};

export function tradeTotals(state: GameState | null, selections: TradeSelections): TradeTotals {
  const trade = state?.trade;
  const playerItems = trade?.player_items || [];
  const merchantItems = trade?.merchant_items || [];
  const sold = selectedTradeItems(selections.sell, playerItems).reduce(
    (total, entry) => total + Number(entry.item.sell_price || 0) * entry.quantity,
    0,
  );
  const bought = selectedTradeItems(selections.buy, merchantItems).reduce(
    (total, entry) => total + Number(entry.item.buy_price ?? entry.item.price ?? 0) * entry.quantity,
    0,
  );
  const currentGold = Number(state?.player.gold || 0);

  return {
    currentGold,
    sold,
    bought,
    net: sold - bought,
    finalGold: currentGold + sold - bought,
    itemCount: selectedQuantityTotal(selections.sell) + selectedQuantityTotal(selections.buy),
  };
}

export function setTradeQuantity(
  selections: TradeSelections,
  mode: keyof TradeSelections,
  item: Item,
  nextQuantity: number,
): TradeSelections {
  const quantity = Math.max(0, Math.min(maxTradeQuantity(item, mode), Number(nextQuantity) || 0));
  const nextSelection = { ...selections[mode] };
  if (quantity > 0) {
    nextSelection[item.name] = quantity;
  } else {
    delete nextSelection[item.name];
  }

  return {
    ...selections,
    [mode]: nextSelection,
  };
}

export function pruneTradeSelections(state: GameState | null, selections: TradeSelections): TradeSelections {
  const trade = state?.trade;
  if (!trade) return emptyTradeSelections;

  return {
    sell: pruneSelection(selections.sell, trade.player_items || [], "sell"),
    buy: pruneSelection(selections.buy, trade.merchant_items || [], "buy"),
  };
}

export function eligibleJunkItems(state: GameState | null): Item[] {
  return (state?.trade?.player_items || []).filter(
    (item) =>
      item.type === "junk" &&
      item.trade_enabled &&
      maxTradeQuantity(item, "sell") > 0,
  );
}

export function selectAllJunk(state: GameState | null, selections: TradeSelections): TradeSelections {
  return eligibleJunkItems(state).reduce(
    (nextSelections, item) =>
      setTradeQuantity(nextSelections, "sell", item, maxTradeQuantity(item, "sell")),
    selections,
  );
}

export function tradePayload(selection: Record<string, number>): TradeLine[] {
  return Object.entries(selection).map(([item, quantity]) => ({ item, quantity }));
}

export function selectedQuantity(selection: Record<string, number>, item: Item): number {
  return selection[item.name] || 0;
}

export function maxTradeQuantity(item: Item, mode: keyof TradeSelections): number {
  if (mode === "sell") return Math.max(0, Number(item.quantity || 0));

  return 99;
}

export function tradeItemName(item: Item, mode: keyof TradeSelections): string {
  const name = item.display_name || item.name;
  if (mode === "sell" && Number(item.quantity) > 1) return `${name} x${item.quantity}`;

  return name;
}

export function tradeItemPrice(item: Item, mode: keyof TradeSelections): string {
  if (mode === "sell") return item.trade_enabled ? `+${item.sell_price}g` : "--";

  return `${item.buy_price ?? item.price}g`;
}

export function tradeItemDescription(item: Item): string {
  const details = [item.type].filter(Boolean);
  if (Number(item.attack) > 0) details.push(`DMG ${item.attack}`);
  if (Number(item.defense) > 0) details.push(`DEF ${item.defense}`);
  if (Number(item.recovery) > 0) details.push(`Recovery ${item.recovery}`);
  if (item.weapon_class) details.push(item.weapon_class);
  if (item.armor_class) details.push(item.armor_class);
  if (item.trade_note) details.push(item.trade_note);

  return details.join(" · ");
}

export function signedGold(value: number): string {
  if (value > 0) return `+${value}g`;
  if (value < 0) return `${value}g`;

  return "0g";
}

export function tradeSummaryMessage(totals: TradeTotals): string {
  if (totals.itemCount === 0) return "Select items, then confirm one combined transaction.";
  if (totals.finalGold < 0) return "Not enough gold for this selection.";

  return "Ready to confirm one combined transaction.";
}

function selectedTradeItems(selection: Record<string, number>, items: Item[]) {
  const byName = new Map(items.map((item) => [item.name, item]));

  return Object.entries(selection)
    .map(([name, quantity]) => ({
      item: byName.get(name),
      quantity: Number(quantity) || 0,
    }))
    .filter((entry): entry is { item: Item; quantity: number } => Boolean(entry.item && entry.quantity > 0));
}

function selectedQuantityTotal(selection: Record<string, number>): number {
  return Object.values(selection).reduce((total, quantity) => total + Number(quantity || 0), 0);
}

function pruneSelection(
  selection: Record<string, number>,
  items: Item[],
  mode: keyof TradeSelections,
): Record<string, number> {
  const available = new Map(items.filter((item) => item.trade_enabled).map((item) => [item.name, item]));

  return Object.entries(selection).reduce<Record<string, number>>((nextSelection, [key, quantity]) => {
    const item = available.get(key);
    if (!item) return nextSelection;

    const nextQuantity = Math.min(Number(quantity) || 0, maxTradeQuantity(item, mode));
    if (nextQuantity > 0) nextSelection[key] = nextQuantity;

    return nextSelection;
  }, {});
}
