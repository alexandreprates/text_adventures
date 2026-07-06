import type { CollectionTab, Item, PlayerState, Spell } from "../../lib/types";
import {
  inventoryCommandValue,
  inventoryItemLabel,
  spellCommandValue,
} from "../../lib/viewModels";

type CollectionPanelProps = {
  player: PlayerState | null;
  activeTab: CollectionTab;
  onItemCommand: (command: string) => void;
};

export function CollectionPanel({ player, activeTab, onItemCommand }: CollectionPanelProps) {
  const title = activeTab === "inventory" ? "=== INVENTORY ==" : "=== SPELLS ====";

  return (
    <section className="terminal-panel inventory-panel" aria-labelledby="inventory-title">
      <div className="panel-title" id="inventory-title">
        {title}
      </div>
      {activeTab === "inventory" ? (
        <ul>
          {(player?.inventory || []).length ? (
            player?.inventory.map((item) => (
              <li key={item.name}>
                <button
                  className="collection-item-command"
                  type="button"
                  onClick={() => onItemCommand(inventoryCommandValue(item))}
                >
                  <span className="collection-item-name">
                    {item.quantity || 1}x {inventoryItemLabel(item)}
                  </span>
                  <span className="collection-action">{itemActionLabel(item)}</span>
                </button>
                <span className="item-type">{item.type || ""}</span>
              </li>
            ))
          ) : (
            <li>
              <span className="collection-empty-copy">Find loot in the Ruins</span>
              <span className="item-type" />
            </li>
          )}
        </ul>
      ) : (
        <ul>
          {(player?.spells || []).length ? (
            player?.spells.map((spell) => (
              <li key={spell.name}>
                <button
                  className="collection-item-command"
                  type="button"
                  onClick={() => onItemCommand(spellCommandValue(spell))}
                >
                  <span className="collection-item-name">
                    {spell.display_name} Lv {spell.level}
                  </span>
                  <span className="collection-action">{spellActionLabel(spell)}</span>
                </button>
                <span className="item-type">{spell.mp_cost || 0} MP</span>
              </li>
            ))
          ) : (
            <li>
              <span className="collection-empty-copy">Buy tomes at the Temple</span>
              <span className="item-type" />
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function itemActionLabel(item: Item): string {
  if (item.type === "weapon" || item.type === "armor") return "Equip";
  if (item.type === "tome" || item.type === "potion") return "Use";
  if (item.type === "junk") return "Drop";

  return "Command";
}

function spellActionLabel(spell: Spell): string {
  if (spell.kind === "healing") return "Cast";

  return "Cast";
}
