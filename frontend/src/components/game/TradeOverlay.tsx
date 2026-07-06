import { useEffect, useMemo, useState } from "react";
import type { GameAction, GameState, Item } from "../../lib/types";
import {
  eligibleJunkItems,
  emptyTradeSelections,
  maxTradeQuantity,
  pruneTradeSelections,
  selectAllJunk,
  selectedQuantity,
  setTradeQuantity,
  signedGold,
  tradeItemDescription,
  tradeItemName,
  tradeItemPrice,
  tradePayload,
  tradeSummaryMessage,
  tradeTotals,
  type TradeSelections,
} from "../../lib/trade";

type TradeOverlayProps = {
  open: boolean;
  state: GameState | null;
  onClose: () => void;
  onSubmitAction: (action: GameAction) => Promise<unknown>;
};

type TradePane = "buy" | "sell" | "summary";

export function TradeOverlay({ open, state, onClose, onSubmitAction }: TradeOverlayProps) {
  const [selections, setSelections] = useState<TradeSelections>(emptyTradeSelections);
  const [submitting, setSubmitting] = useState(false);
  const [mobilePaneSelection, setMobilePaneSelection] = useState<{
    merchant: string | null;
    pane: TradePane;
  }>({ merchant: null, pane: "buy" });
  const trade = state?.trade;
  const defaultMobilePane = trade?.merchant_items?.length ? "buy" : "sell";
  const mobilePane =
    mobilePaneSelection.merchant === trade?.merchant
      ? mobilePaneSelection.pane
      : defaultMobilePane;
  const prunedSelections = useMemo(
    () => (open ? pruneTradeSelections(state, selections) : emptyTradeSelections),
    [open, selections, state],
  );
  const totals = useMemo(() => tradeTotals(state, prunedSelections), [state, prunedSelections]);
  const confirmDisabled = totals.itemCount === 0 || totals.finalGold < 0 || submitting;
  const confirmLabel = submitting
    ? "Trading..."
    : totals.itemCount === 0
      ? "Select items"
      : totals.finalGold < 0
        ? "Need more gold"
        : "Confirm Trade";

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open || !trade) return null;

  async function submitTradeSelection() {
    if (totals.itemCount === 0 || totals.finalGold < 0) return;

    setSubmitting(true);
    try {
      await onSubmitAction({
        type: "trade",
        buy: tradePayload(prunedSelections.buy),
        sell: tradePayload(prunedSelections.sell),
      });
      setSelections(emptyTradeSelections);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shop-overlay" role="dialog" aria-modal="true" aria-labelledby="shop-title">
      <section className="shop-window">
        <header className="shop-head">
          <div>
            <h2 className="shop-title" id="shop-title">
              === {trade.display_name.toUpperCase()} TRADE ===
            </h2>
            <p className="shop-subtitle">
              Sell eligible items on the left. Buy merchant stock on the right.
            </p>
          </div>
          <button className="shop-close" type="button" aria-label="Close trade" onClick={onClose}>
            x
          </button>
        </header>

        <nav className="shop-tabs" aria-label="Trade sections">
          <button
            type="button"
            aria-pressed={mobilePane === "buy"}
            onClick={() => setMobilePaneSelection({ merchant: trade.merchant, pane: "buy" })}
          >
            Buy
          </button>
          <button
            type="button"
            aria-pressed={mobilePane === "sell"}
            onClick={() => setMobilePaneSelection({ merchant: trade.merchant, pane: "sell" })}
          >
            Sell
          </button>
          <button
            type="button"
            aria-pressed={mobilePane === "summary"}
            onClick={() => setMobilePaneSelection({ merchant: trade.merchant, pane: "summary" })}
          >
            Summary
          </button>
        </nav>

        <div className="shop-grid" data-mobile-pane={mobilePane}>
          <section className="trade-list trade-list-sell" aria-labelledby="player-trade-title">
            <h3 className="trade-label" id="player-trade-title">
              PLAYER ITEMS
            </h3>
            <p className="trade-hint">Only items this merchant accepts are enabled.</p>
            <TradeItemList
              items={trade.player_items || []}
              mode="sell"
              selections={prunedSelections}
              onChange={setSelections}
            />
          </section>

          <aside className="trade-summary" aria-label="Trade summary">
            <div className="gold-box">
              <span className="gold-label">CURRENT GOLD</span>
              <strong className="gold-value">{totals.currentGold}g</strong>
            </div>
            <div className="balance-lines">
              <div className="balance-line">
                <span>Sold</span>
                <strong>+{totals.sold}g</strong>
              </div>
              <div className="balance-line negative">
                <span>Bought</span>
                <strong>-{totals.bought}g</strong>
              </div>
              <div className="balance-line projected">
                <span>Transaction</span>
                <strong>{signedGold(totals.net)}</strong>
              </div>
              <div className="balance-line">
                <span>After trade</span>
                <strong>{totals.finalGold}g</strong>
              </div>
            </div>
            <div className="trade-actions">
              <button
                className="primary"
                type="button"
                disabled={confirmDisabled}
                onClick={() => void submitTradeSelection()}
              >
                {confirmLabel}
              </button>
              <button
                type="button"
                disabled={!eligibleJunkItems(state).length || submitting}
                onClick={() => setSelections((current) => selectAllJunk(state, current))}
              >
                Sell all junk
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setSelections(emptyTradeSelections)}
              >
                Clear Selection
              </button>
              <button type="button" disabled={submitting} onClick={onClose}>
                Cancel
              </button>
            </div>
          </aside>

          <section className="trade-list trade-list-buy" aria-labelledby="merchant-trade-title">
            <h3 className="trade-label" id="merchant-trade-title">
              MERCHANT STOCK
            </h3>
            <p className="trade-hint">Choose what will be added to your inventory.</p>
            <TradeItemList
              items={trade.merchant_items || []}
              mode="buy"
              selections={prunedSelections}
              onChange={setSelections}
            />
          </section>
        </div>

        <footer className="shop-foot">
          <span>{tradeSummaryMessage(totals)}</span>
          <strong>Net: {signedGold(totals.net)}</strong>
        </footer>
      </section>
    </div>
  );
}

type TradeItemListProps = {
  items: Item[];
  mode: keyof TradeSelections;
  selections: TradeSelections;
  onChange: (selections: TradeSelections) => void;
};

function TradeItemList({ items, mode, selections, onChange }: TradeItemListProps) {
  if (!items.length) {
    return (
      <div className="item-list">
        <p className="item-description">
          {mode === "sell" ? "Nothing eligible in your bags." : "Nothing for sale."}
        </p>
      </div>
    );
  }

  return (
    <div className="item-list">
      {items.map((item) => {
        const quantity = selectedQuantity(selections[mode], item);
        const maxQuantity = maxTradeQuantity(item, mode);
        const disabled = !item.trade_enabled;

        return (
          <article
            className={[
              "trade-item",
              quantity > 0 ? "selected" : "",
              disabled ? "disabled" : "",
            ].join(" ")}
            key={item.name}
          >
            <span className="item-copy">
              <span className="item-line">
                <span className="item-name">{tradeItemName(item, mode)}</span>
                <strong className="item-price">{tradeItemPrice(item, mode)}</strong>
              </span>
              <span className="item-description">{tradeItemDescription(item)}</span>
            </span>

            <div className="trade-quantity">
              <button
                className="quantity-step"
                type="button"
                disabled={disabled || quantity <= 0}
                aria-label={`Decrease ${item.display_name || item.name}`}
                onClick={() => onChange(setTradeQuantity(selections, mode, item, quantity - 1))}
              >
                -
              </button>
              <span className="quantity-value">{quantity}</span>
              <button
                className="quantity-step"
                type="button"
                disabled={disabled || quantity >= maxQuantity}
                aria-label={`Increase ${item.display_name || item.name}`}
                onClick={() => onChange(setTradeQuantity(selections, mode, item, quantity + 1))}
              >
                +
              </button>
              <span className="quantity-limit">
                {mode === "sell" ? `available ${maxQuantity}` : "available"}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
