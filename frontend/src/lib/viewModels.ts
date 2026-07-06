import type {
  DungeonViewport,
  GameEvent,
  GamePayload,
  GameState,
  Item,
  PlayerState,
  Position,
  Spell,
  StatePatch,
  ViewportEntity,
} from "./types";

export const locationArts: Record<string, { src: string; alt: string }> = {
  town: {
    src: "/assets/locations/village-hub.png",
    alt: "Village hub with paths to the tavern, temple, shops, and ruins",
  },
  tavern: {
    src: "/assets/locations/tavern-interior.png",
    alt: "Warm tavern interior with fireplace, bar, tables, potion shelves, and rented rooms",
  },
  priest: {
    src: "/assets/locations/temple-sanctuary.png",
    alt: "Temple sanctuary with altar, healing fountain, candles, stained glass, and tome shelves",
  },
  blacksmith: {
    src: "/assets/locations/blacksmith-workshop.png",
    alt: "Blacksmith workshop with forge, anvil, tools, and weapon racks",
  },
  armorsmith: {
    src: "/assets/locations/armorsmith-shop.png",
    alt: "Armorsmith shop with armor stands, shields, helmets, and trading counter",
  },
};

export const locationPanels: Record<string, string[]> = {
  town: ["Town of Nee'Peh", "", "Tavern", "Aluriel's Priest", "Blacksmith", "Armorsmith", "Ruins"],
  tavern: ["Tavern", "", "Rest in a rented room", "Buy or sell potions", "Return to town"],
  priest: ["Aluriel's Priest", "", "Recover health", "Cure poison", "Buy or sell tomes", "Return to town"],
  blacksmith: ["Blacksmith", "", "Show weapons", "Buy weapons", "Sell weapons", "Return to town"],
  armorsmith: ["Armorsmith", "", "Show armors", "Buy armors", "Sell armors", "Return to town"],
};

export function mergeStatePatch(state: GameState | null, patch?: StatePatch): GameState | null {
  if (!patch) return state;
  if (!state) return patch as GameState;

  return {
    ...state,
    ...patch,
    player: patch.player
      ? {
          ...state.player,
          ...patch.player,
        }
      : state.player,
  };
}

export function eventsFromPayload(payload: GamePayload): GameEvent[] {
  if (Array.isArray(payload.events)) return payload.events;
  if (Array.isArray(payload.response?.lines)) {
    return payload.response.lines.map((line) => ({ type: "message", text: line }));
  }

  return [];
}

export function playerDefeated(state: GameState | null): boolean {
  return (state?.player.health.current || 0) <= 0;
}

export function classLine(player: PlayerState): string {
  return player.current_class || "Adventurer";
}

export function labelize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function inventoryItemLabel(item: Item): string {
  const name = item.display_name || item.name;
  if (item.type === "weapon" && Number(item.attack) > 0) return `${name} (DMG ${item.attack})`;
  if (item.type === "armor" && Number(item.defense) > 0) return `${name} (DEF ${item.defense})`;

  return name;
}

export function inventoryCommandValue(item: Item): string {
  if (item.type === "weapon" || item.type === "armor") return `equip ${item.name}`;
  if (item.type === "tome" || item.type === "potion") return `use ${item.name}`;
  if (item.type === "junk") return `drop ${item.name}`;

  return item.name;
}

export function spellCommandValue(spell: Spell): string {
  return `cast ${spell.name}`;
}

export function equipmentLine(
  label: string,
  item: Item | null | undefined,
  fallbackName: string,
  statLabel: string,
  statKey: "attack" | "defense",
): string {
  const name = item?.display_name || fallbackName;
  const statValue = item?.[statKey] || 0;

  return `${label} ${name} (${statLabel} ${statValue})`;
}

export function textRowsFromViewport(viewport: DungeonViewport): string[] {
  const symbols = Array.from(
    String(viewport.terrain || "").padEnd(viewport.width * viewport.height, "?"),
  );
  const entitySymbols: Record<string, string> = {
    player: "x",
    enemy: "E",
    loot: "@",
    portal: "P",
    ascent: "<",
    descent: ">",
  };

  [...(viewport.entities || [])].sort(compareViewportEntities).forEach((entity) => {
    const symbol = entitySymbols[entity.type];
    if (!symbol) return;

    const index = entity.y * viewport.width + entity.x;
    if (index >= 0 && index < symbols.length) symbols[index] = symbol;
  });

  return Array.from({ length: viewport.height }, (_value, rowIndex) => {
    const start = rowIndex * viewport.width;

    return symbols.slice(start, start + viewport.width).join("");
  });
}

export function plainAsciiBar(current: number, max: number): string {
  const width = 10;
  const ratio = max ? Math.max(0, Math.min(1, current / max)) : 0;
  const filled = Math.round(ratio * width);

  return `[${"|".repeat(filled)}${" ".repeat(width - filled)}]`;
}

export function commandPlaceholder(state: GameState | null, compact = false): string {
  if (playerDefeated(state)) return "reload";
  if (state?.pending?.confirmation) return "agree or no";

  const placeholders: Record<string, string> = {
    town: "go ruins, go blacksmith, inventory",
    tavern: "sleep, shop, buy potion of heal",
    priest: "heal, cure, shop, buy tome of fireball",
    blacksmith: "shop, show, buy iron dagger",
    armorsmith: "shop, show, buy padded armor",
    ruins: "go right, attack, loot, cast fireball",
  };
  const compactPlaceholders: Record<string, string> = {
    town: "go ruins, inventory",
    tavern: "sleep, shop",
    priest: "heal, shop",
    blacksmith: "shop, buy dagger",
    armorsmith: "shop, buy armor",
    ruins: "go, attack, loot",
  };

  if (!state) return "connecting";

  return compact
    ? compactPlaceholders[state.scene] || "command"
    : placeholders[state.scene] || "type a command";
}

function compareViewportEntities(left: ViewportEntity, right: ViewportEntity): number {
  return viewportEntityPriority(left.type) - viewportEntityPriority(right.type);
}

function viewportEntityPriority(type: string): number {
  return (
    {
      portal: 10,
      ascent: 10,
      descent: 10,
      loot: 20,
      enemy: 30,
      player: 40,
    }[type] || 0
  );
}

export function samePosition(left?: Position | null, right?: Position | null): boolean {
  return Boolean(left && right && left.x === right.x && left.y === right.y);
}
