import type {
  AutoExploreGoal,
  GameAction,
  GameState,
  Item,
  StandaloneAction,
  TradeLine,
} from "./types";

const standaloneActions = new Set([
  "agree",
  "attack",
  "cure",
  "heal",
  "help",
  "inventory",
  "level",
  "look",
  "loot",
  "no",
  "reload",
  "show",
  "skills",
  "sleep",
  "spellbook",
]);

export function actionFromCommand(command: string): GameAction {
  const normalized = command.trim().toLowerCase().replace(/\s+/g, " ");
  const [rawVerb = "", ...targetParts] = normalized.split(" ");
  const target = targetParts.join(" ");
  const verb = normalizeVerb(rawVerb);

  if (standaloneActions.has(verb)) return { type: verb as StandaloneAction };

  if (verb === "go") {
    if (!target) throw actionCommandError("Missing target for go.");

    return ["up", "right", "down", "left"].includes(target)
      ? { type: "move", direction: target }
      : { type: "travel", destination: target };
  }

  if (["buy", "sell", "equip", "use", "drop"].includes(verb)) {
    if (!target) throw actionCommandError(`Missing target for ${verb}.`);

    return { type: verb as "buy" | "sell" | "equip" | "use" | "drop", item: target };
  }

  if (verb === "cast") {
    if (!target) throw actionCommandError("Missing target for cast.");

    return { type: "cast", spell: target };
  }

  if (verb === "trade") return tradeActionFromTarget(target);

  throw actionCommandError(`Unsupported command: ${rawVerb}.`, "unsupported_command");
}

export function isNewGameCommand(command: string): boolean {
  return command.trim().toLowerCase() === "new";
}

export function isShopCommand(command: string): boolean {
  return command.trim().toLowerCase() === "shop";
}

export function manualAutoExploreGoal(
  command: string,
  state: GameState | null,
): AutoExploreGoal | null {
  if (state?.scene !== "ruins") return null;

  const normalized = command.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized === "explore" || normalized === "auto explore") return "explore";
  if (normalized === "go town" || normalized === "auto town") return "town";
  if (normalized === "go deep" || normalized === "auto descent") return "descent";

  return null;
}

export function autoCompatibleManualCommand(command: string): boolean {
  return /^(equip|use)\b/i.test(command.trim());
}

export function commandUpdatesFacing(action: GameAction): string | null {
  return action.type === "move" ? action.direction : null;
}

export type QuickCommand = {
  label: string;
  command: string;
  kind?: "primary" | "danger";
  disabled?: boolean;
};

export function quickCommandsFor(state: GameState | null): QuickCommand[] {
  if (!state) return [];

  if ((state.player.health.current || 0) <= 0) {
    return [
      { label: "Revive in Town", command: "reload", kind: "primary" },
      { label: "New Game", command: "new", kind: "danger" },
    ];
  }

  if (state.pending?.confirmation) {
    return [
      { label: "Confirm", command: "agree", kind: "primary" },
      { label: "Cancel", command: "no", kind: "danger" },
    ];
  }

  if (state.battle?.active) {
    return [
      { label: "Attack", command: "attack", kind: "primary" },
      ...suggestedItemCommands(state.player.inventory, state),
    ];
  }

  if (state.scene === "ruins") {
    return [
      { label: "Up", command: "go up" },
      { label: "Left", command: "go left" },
      { label: "Right", command: "go right" },
      { label: "Down", command: "go down" },
      { label: "Look", command: "look" },
      { label: "Loot", command: "loot", kind: "primary", disabled: !state.dungeon?.nearby_loot },
      { label: "Attack", command: "attack", kind: "primary" },
      { label: "Town", command: "go town" },
    ];
  }

  const travel = [
    { label: "Town", command: "go town" },
    { label: "Ruins", command: "go ruins", kind: "primary" as const },
    { label: "Tavern", command: "go tavern" },
    { label: "Temple", command: "go priest" },
    { label: "Blacksmith", command: "go blacksmith" },
    { label: "Armorsmith", command: "go armorsmith" },
  ];

  const sceneCommands: Record<string, QuickCommand[]> = {
    town: travel.filter((command) => command.label !== "Town"),
    tavern: [
      { label: "Rest", command: "sleep", kind: "primary" },
      { label: "Shop", command: "shop", kind: "primary" },
      { label: "Town", command: "go town" },
    ],
    priest: [
      { label: "Heal", command: "heal", kind: "primary" },
      { label: "Cleanse", command: "cure" },
      { label: "Shop", command: "shop", kind: "primary" },
      { label: "Town", command: "go town" },
    ],
    blacksmith: [
      { label: "Shop", command: "shop", kind: "primary" },
      { label: "Show", command: "show" },
      { label: "Town", command: "go town" },
    ],
    armorsmith: [
      { label: "Shop", command: "shop", kind: "primary" },
      { label: "Show", command: "show" },
      { label: "Town", command: "go town" },
    ],
  };

  return sceneCommands[state.scene] || travel;
}

function normalizeVerb(verb: string): string {
  return {
    recarregar: "reload",
    rent: "sleep",
    rest: "sleep",
    spell: "cast",
  }[verb] || verb;
}

function tradeActionFromTarget(target: string): GameAction {
  const selections = target.split(";").reduce(
    (result, segment) => {
      const [rawKey = "", rawItems = ""] = segment.split("=", 2);
      const key = rawKey.trim();
      if (key !== "buy" && key !== "sell") return result;

      result[key] = tradeLinesFromTarget(rawItems);
      return result;
    },
    { buy: [], sell: [] } as { buy: TradeLine[]; sell: TradeLine[] },
  );

  if (!selections.buy.length && !selections.sell.length) {
    throw actionCommandError("At least one trade item is required.");
  }

  return { type: "trade", buy: selections.buy, sell: selections.sell };
}

function tradeLinesFromTarget(target: string): TradeLine[] {
  return target
    .split("|")
    .map((segment) => tradeLineFromSegment(segment))
    .filter((line): line is TradeLine => Boolean(line));
}

function tradeLineFromSegment(segment: string): TradeLine | null {
  const [rawItem = "", rawQuantity = ""] = segment.split(":", 2);
  const item = rawItem.trim();
  if (!item) return null;

  const quantity = rawQuantity.trim() ? Number(rawQuantity.trim()) : 1;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw actionCommandError("Trade quantity must be positive.");
  }

  return { item, quantity };
}

function suggestedItemCommands(items: Item[], state: GameState): QuickCommand[] {
  const equippedNames = [
    state.player.equipment.weapon?.name,
    state.player.equipment.armor?.name,
  ].filter(Boolean);

  return items
    .filter((item) => !equippedNames.includes(item.name))
    .slice(0, 2)
    .map((item) => {
      if (item.type === "weapon" || item.type === "armor") {
        return {
          label: `Equip ${item.display_name || item.name}`,
          command: `equip ${item.name}`,
          kind: "primary" as const,
        };
      }

      if (item.type === "tome" || item.type === "potion") {
        return {
          label: `Use ${item.display_name || item.name}`,
          command: `use ${item.name}`,
          kind: "primary" as const,
        };
      }

      return {
        label: `Use ${item.display_name || item.name}`,
        command: `use ${item.name}`,
      };
    });
}

function actionCommandError(message: string, code = "invalid_action"): Error {
  const error = new Error(message);
  Object.assign(error, { code });

  return error;
}
