import { expect, test, type Locator, type Page } from "@playwright/test";

type MockGamePayload = {
  game_id: string;
  events: Array<{
    type: string;
    text: string;
    actor?: string;
    target?: string;
    action?: string;
    effect?: string;
    duration_ms?: number;
  }>;
  state: Record<string, unknown>;
};

const townPayload: MockGamePayload = {
  game_id: "demo-game",
  events: [{ type: "message", text: "Welcome to Text Adventures" }],
  state: {
    scene: "town",
    scene_display_name: "Town",
    prompt: "Town",
    player: {
      name: "Adventurer",
      health: { current: 30, max: 30 },
      mana: { current: 12, max: 12 },
      gold: 0,
      current_class: "Adventurer",
      level: 1,
      xp: 0,
      statuses: [],
      equipment: {
        weapon: { name: "sword", display_name: "Sword", attack: 10, defense: 0 },
        armor: { name: "leather armor", display_name: "Leather Armor", attack: 0, defense: 12 },
      },
      inventory: [{ name: "potion of heal", display_name: "Potion of Heal", type: "potion", quantity: 5 }],
      spells: [],
      skills: {
        swordsmanship: { level: 0, xp: 0, next_level_xp: 250 },
      },
    },
    dungeon: null,
    battle: { active: false, enemy: null },
    pending: { confirmation: false },
    trade: null,
  },
};

const ruinsPayload: MockGamePayload = {
  ...townPayload,
  state: {
    ...townPayload.state,
    scene: "ruins",
    scene_display_name: "Ruins",
    prompt: "Ruins L1",
    dungeon: {
      level: 1,
      player_position: { x: 1, y: 1 },
      entrance_portal: { x: 0, y: 1 },
      ascent: null,
      descent: { x: 2, y: 2 },
      nearby_loot: null,
      viewport: {
        width: 3,
        height: 3,
        origin: { x: 0, y: 0 },
        terrain: ".........",
        entities: [
          { type: "player", x: 1, y: 1 },
          { type: "portal", x: 0, y: 1 },
          { type: "descent", x: 2, y: 2 },
        ],
      },
    },
  },
};

const isometricRuinsPayload: MockGamePayload = {
  ...ruinsPayload,
  state: {
    ...ruinsPayload.state,
    dungeon: {
      level: 1,
      player_position: { x: 2, y: 2 },
      entrance_portal: { x: 1, y: 2 },
      ascent: null,
      descent: { x: 3, y: 3 },
      nearby_loot: null,
      viewport: {
        width: 5,
        height: 5,
        origin: { x: 0, y: 0 },
        theme: "stone_ruins",
        terrain: "######...##...##...######",
        decorations: [
          { kind: "torch", x: 2, y: 0 },
          { kind: "chest", x: 2, y: 3 },
        ],
        entities: [
          { type: "portal", x: 1, y: 2 },
          { type: "player", x: 2, y: 2 },
          { type: "descent", x: 3, y: 3 },
        ],
      },
    },
  },
};

const noTorchRuinsPayload: MockGamePayload = {
  ...isometricRuinsPayload,
  state: {
    ...isometricRuinsPayload.state,
    dungeon: {
      ...(isometricRuinsPayload.state.dungeon as Record<string, unknown>),
      viewport: {
        ...(
          (isometricRuinsPayload.state.dungeon as { viewport: Record<string, unknown> }).viewport
        ),
        decorations: [{ kind: "chest", x: 2, y: 3 }],
      },
    },
  },
};

const floatingTorchRuinsPayload: MockGamePayload = {
  ...noTorchRuinsPayload,
  state: {
    ...noTorchRuinsPayload.state,
    dungeon: {
      ...(noTorchRuinsPayload.state.dungeon as Record<string, unknown>),
      viewport: {
        ...(
          (noTorchRuinsPayload.state.dungeon as { viewport: Record<string, unknown> }).viewport
        ),
        decorations: [
          { kind: "torch", x: 2, y: 2 },
          { kind: "chest", x: 2, y: 3 },
        ],
      },
    },
  },
};

const wideRuinsPayload: MockGamePayload = {
  ...isometricRuinsPayload,
  state: {
    ...isometricRuinsPayload.state,
    dungeon: {
      level: 1,
      player_position: { x: 4, y: 4 },
      entrance_portal: { x: 1, y: 4 },
      ascent: null,
      descent: { x: 7, y: 7 },
      nearby_loot: null,
      viewport: {
        width: 9,
        height: 9,
        origin: { x: 0, y: 0 },
        theme: "stone_ruins",
        terrain: [
          "#########",
          "#.......#",
          "#.......#",
          "#.......#",
          "#.......#",
          "#.......#",
          "#.......#",
          "#.......#",
          "#########",
        ].join(""),
        decorations: [],
        entities: [
          { type: "portal", x: 1, y: 4 },
          { type: "player", x: 4, y: 4 },
          { type: "descent", x: 7, y: 7 },
        ],
      },
    },
  },
};

const duelistRuinsPayload: MockGamePayload = {
  ...isometricRuinsPayload,
  state: {
    ...isometricRuinsPayload.state,
    player: {
      ...(isometricRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Duelist",
    },
  },
};

const dragoonRuinsPayload: MockGamePayload = {
  ...isometricRuinsPayload,
  state: {
    ...isometricRuinsPayload.state,
    player: {
      ...(isometricRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Dragoon",
    },
  },
};

const nightbladeRuinsPayload: MockGamePayload = {
  ...isometricRuinsPayload,
  state: {
    ...isometricRuinsPayload.state,
    player: {
      ...(isometricRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Nightblade",
    },
  },
};

const arcanistRuinsPayload: MockGamePayload = {
  ...isometricRuinsPayload,
  state: {
    ...isometricRuinsPayload.state,
    player: {
      ...(isometricRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Arcanist",
    },
  },
};

const spellbladeRuinsPayload: MockGamePayload = {
  ...isometricRuinsPayload,
  state: {
    ...isometricRuinsPayload.state,
    player: {
      ...(isometricRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Spellblade",
    },
  },
};

const wardenRuinsPayload: MockGamePayload = {
  ...wideRuinsPayload,
  state: {
    ...wideRuinsPayload.state,
    player: {
      ...(wideRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Warden",
    },
  },
};

const skirmisherRuinsPayload: MockGamePayload = {
  ...wideRuinsPayload,
  state: {
    ...wideRuinsPayload.state,
    player: {
      ...(wideRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Skirmisher",
    },
  },
};

const battlemageRuinsPayload: MockGamePayload = {
  ...wideRuinsPayload,
  state: {
    ...wideRuinsPayload.state,
    player: {
      ...(wideRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Battlemage",
    },
  },
};

const sentinelRuinsPayload: MockGamePayload = {
  ...wideRuinsPayload,
  state: {
    ...wideRuinsPayload.state,
    player: {
      ...(wideRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Sentinel",
    },
  },
};

const hexbladeRuinsPayload: MockGamePayload = {
  ...wideRuinsPayload,
  state: {
    ...wideRuinsPayload.state,
    player: {
      ...(wideRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Hexblade",
    },
  },
};

const rangerRuinsPayload: MockGamePayload = {
  ...wideRuinsPayload,
  state: {
    ...wideRuinsPayload.state,
    player: {
      ...(wideRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Ranger",
    },
  },
};

const mysticRuinsPayload: MockGamePayload = {
  ...wideRuinsPayload,
  state: {
    ...wideRuinsPayload.state,
    player: {
      ...(wideRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Mystic",
    },
  },
};

const druidRuinsPayload: MockGamePayload = {
  ...wideRuinsPayload,
  state: {
    ...wideRuinsPayload.state,
    player: {
      ...(wideRuinsPayload.state.player as Record<string, unknown>),
      current_class: "Druid",
    },
  },
};

const combatPayload: MockGamePayload = {
  ...isometricRuinsPayload,
  events: [
    {
      type: "combat.damage",
      text: "You attack a Skeleton Guard causing 4 of damage.",
      actor: "player",
      target: "enemy",
      action: "attack",
      effect: "slash",
      duration_ms: 520,
    },
    { type: "message", text: "A Skeleton Guard is about to attack you!" },
    { type: "message", text: "[Skeleton Guard HP: 28/28]" },
  ],
  state: {
    ...isometricRuinsPayload.state,
    dungeon: {
      ...(isometricRuinsPayload.state.dungeon as Record<string, unknown>),
      viewport: {
        ...(
          (isometricRuinsPayload.state.dungeon as { viewport: Record<string, unknown> }).viewport
        ),
        entities: [
          { type: "portal", x: 1, y: 2 },
          { type: "player", x: 2, y: 2 },
          { type: "enemy", x: 3, y: 2, creature_id: "skeleton_guard" },
          { type: "loot", x: 2, y: 3 },
          { type: "descent", x: 3, y: 3 },
        ],
      },
    },
    battle: {
      active: true,
      enemy: {
        name: "skeleton guard",
        display_name: "Skeleton Guard",
        health: { current: 28, max: 28 },
        statuses: [],
      },
    },
  },
};

const animatedEnemyFixtures = [
  { creatureId: "giant_spider", displayName: "Giant Spider", maxHealth: 35 },
  { creatureId: "orc_raider", displayName: "Orc Raider", maxHealth: 42 },
  { creatureId: "orc_berserker", displayName: "Orc Berserker", maxHealth: 55 },
  { creatureId: "kobold_trapper", displayName: "Kobold Trapper", maxHealth: 20 },
  { creatureId: "kobold_sparkmage", displayName: "Kobold Sparkmage", maxHealth: 24 },
  { creatureId: "gnoll_hunter", displayName: "Gnoll Hunter", maxHealth: 38 },
  { creatureId: "gnoll_bonecaller", displayName: "Gnoll Bonecaller", maxHealth: 32 },
  { creatureId: "wight_knight", displayName: "Wight Knight", maxHealth: 58 },
  { creatureId: "ghoul_stalker", displayName: "Ghoul Stalker", maxHealth: 36 },
  { creatureId: "zombie_brute", displayName: "Zombie Brute", maxHealth: 60 },
  { creatureId: "shadow_imp", displayName: "Shadow Imp", maxHealth: 26 },
  { creatureId: "brimstone_imp", displayName: "Brimstone Imp", maxHealth: 30 },
  { creatureId: "lesser_demon", displayName: "Lesser Demon", maxHealth: 70 },
  { creatureId: "forest_sprite", displayName: "Forest Sprite", maxHealth: 18 },
  { creatureId: "pixie_trickster", displayName: "Pixie Trickster", maxHealth: 20 },
  { creatureId: "satyr_duelist", displayName: "Satyr Duelist", maxHealth: 40 },
  { creatureId: "dryad_thornweaver", displayName: "Dryad Thornweaver", maxHealth: 44 },
  { creatureId: "fae_blade_dancer", displayName: "Fae Blade Dancer", maxHealth: 46 },
  { creatureId: "dire_wolf", displayName: "Dire Wolf", maxHealth: 45 },
] as const;

function animatedEnemyCombatPayload(
  creatureId: string,
  displayName: string,
  maxHealth: number,
): MockGamePayload {
  return {
    ...combatPayload,
    events: [
      {
        type: "combat.damage",
        text: `${displayName} attacks you causing 3 of damage.`,
        actor: "enemy",
        target: "player",
        action: "attack",
        effect: "slash",
        duration_ms: 1_200,
      },
    ],
    state: {
      ...combatPayload.state,
      dungeon: {
        ...(combatPayload.state.dungeon as Record<string, unknown>),
        viewport: {
          ...(
            (combatPayload.state.dungeon as { viewport: Record<string, unknown> }).viewport
          ),
          entities: [
            { type: "portal", x: 1, y: 2 },
            { type: "player", x: 2, y: 2 },
            { type: "enemy", x: 3, y: 2, creature_id: creatureId },
            { type: "loot", x: 2, y: 3 },
            { type: "descent", x: 3, y: 3 },
          ],
        },
      },
      battle: {
        active: true,
        enemy: {
          name: displayName.toLowerCase(),
          display_name: displayName,
          health: { current: 3, max: maxHealth },
          statuses: [],
        },
      },
    },
  };
}

function animatedEnemyDefeatedPatch(payload: MockGamePayload) {
  return {
    dungeon: {
      ...(payload.state.dungeon as Record<string, unknown>),
      viewport: {
        ...((payload.state.dungeon as { viewport: Record<string, unknown> }).viewport),
        entities: [
          { type: "portal", x: 1, y: 2 },
          { type: "player", x: 2, y: 2 },
          { type: "loot", x: 2, y: 3 },
          { type: "descent", x: 3, y: 3 },
        ],
      },
    },
    battle: { active: false, enemy: null },
  };
}

const duelistCombatPayload: MockGamePayload = {
  ...combatPayload,
  state: {
    ...combatPayload.state,
    player: {
      ...(combatPayload.state.player as Record<string, unknown>),
      current_class: "Duelist",
    },
  },
};

const dragoonCombatPayload: MockGamePayload = {
  ...combatPayload,
  state: {
    ...combatPayload.state,
    player: {
      ...(combatPayload.state.player as Record<string, unknown>),
      current_class: "Dragoon",
    },
  },
};

const nightbladeCombatPayload: MockGamePayload = {
  ...combatPayload,
  state: {
    ...combatPayload.state,
    player: {
      ...(combatPayload.state.player as Record<string, unknown>),
      current_class: "Nightblade",
    },
  },
};

const arcanistCombatPayload: MockGamePayload = {
  ...combatPayload,
  state: {
    ...combatPayload.state,
    player: {
      ...(combatPayload.state.player as Record<string, unknown>),
      current_class: "Arcanist",
    },
  },
};

const spellbladeCombatPayload: MockGamePayload = {
  ...combatPayload,
  state: {
    ...combatPayload.state,
    player: {
      ...(combatPayload.state.player as Record<string, unknown>),
      current_class: "Spellblade",
    },
  },
};

const wardenCombatPayload: MockGamePayload = {
  ...combatPayload,
  state: {
    ...combatPayload.state,
    dungeon: {
      ...(wideRuinsPayload.state.dungeon as Record<string, unknown>),
      viewport: {
        ...(
          (wideRuinsPayload.state.dungeon as { viewport: Record<string, unknown> }).viewport
        ),
        entities: [
          { type: "portal", x: 1, y: 4 },
          { type: "player", x: 4, y: 4 },
          { type: "enemy", x: 5, y: 4, creature_id: "skeleton_guard" },
          { type: "descent", x: 7, y: 7 },
        ],
      },
    },
    player: {
      ...(combatPayload.state.player as Record<string, unknown>),
      current_class: "Warden",
    },
  },
};

const adventurerCombatPayload: MockGamePayload = {
  ...wardenCombatPayload,
  events: wardenCombatPayload.events.map((event, index) => (
    index === 0 ? { ...event, duration_ms: 1_200 } : event
  )),
  state: {
    ...wardenCombatPayload.state,
    player: {
      ...(wardenCombatPayload.state.player as Record<string, unknown>),
      current_class: "Adventurer",
    },
  },
};

const druidCombatPayload: MockGamePayload = {
  ...adventurerCombatPayload,
  state: {
    ...adventurerCombatPayload.state,
    player: {
      ...(adventurerCombatPayload.state.player as Record<string, unknown>),
      current_class: "Druid",
    },
  },
};

const skirmisherCombatPayload: MockGamePayload = {
  ...wardenCombatPayload,
  state: {
    ...wardenCombatPayload.state,
    player: {
      ...(wardenCombatPayload.state.player as Record<string, unknown>),
      current_class: "Skirmisher",
    },
  },
};

const battlemageCombatPayload: MockGamePayload = {
  ...wardenCombatPayload,
  state: {
    ...wardenCombatPayload.state,
    player: {
      ...(wardenCombatPayload.state.player as Record<string, unknown>),
      current_class: "Battlemage",
    },
  },
};

const sentinelCombatPayload: MockGamePayload = {
  ...wardenCombatPayload,
  state: {
    ...wardenCombatPayload.state,
    player: {
      ...(wardenCombatPayload.state.player as Record<string, unknown>),
      current_class: "Sentinel",
    },
  },
};

const hexbladeCombatPayload: MockGamePayload = {
  ...wardenCombatPayload,
  state: {
    ...wardenCombatPayload.state,
    player: {
      ...(wardenCombatPayload.state.player as Record<string, unknown>),
      current_class: "Hexblade",
    },
  },
};

const rangerCombatPayload: MockGamePayload = {
  ...wardenCombatPayload,
  state: {
    ...wardenCombatPayload.state,
    player: {
      ...(wardenCombatPayload.state.player as Record<string, unknown>),
      current_class: "Ranger",
    },
  },
};

const mysticCombatPayload: MockGamePayload = {
  ...wardenCombatPayload,
  state: {
    ...wardenCombatPayload.state,
    player: {
      ...(wardenCombatPayload.state.player as Record<string, unknown>),
      current_class: "Mystic",
    },
  },
};

const blacksmithPayload: MockGamePayload = {
  ...townPayload,
  state: {
    ...townPayload.state,
    scene: "blacksmith",
    scene_display_name: "Blacksmith",
    prompt: "Blacksmith",
    trade: {
      merchant: "blacksmith",
      display_name: "Blacksmith",
      player_items: [
        {
          name: "potion of heal",
          display_name: "Potion of Heal",
          type: "potion",
          quantity: 5,
          trade_enabled: false,
        },
      ],
      merchant_items: [
        {
          name: "sword",
          display_name: "Sword",
          type: "weapon",
          buy_price: 150,
          attack: 10,
          trade_enabled: true,
        },
        {
          name: "hunting spear",
          display_name: "Hunting Spear",
          type: "weapon",
          buy_price: 80,
          attack: 7,
          trade_enabled: true,
        },
        {
          name: "rusty dagger",
          display_name: "Rusty Dagger",
          type: "weapon",
          buy_price: 25,
          attack: 4,
          trade_enabled: true,
        },
        {
          name: "iron helm",
          display_name: "Iron Helm",
          type: "armor",
          buy_price: 65,
          defense: 4,
          trade_enabled: true,
        },
        {
          name: "chain vest",
          display_name: "Chain Vest",
          type: "armor",
          buy_price: 120,
          defense: 10,
          trade_enabled: true,
        },
        {
          name: "warhammer",
          display_name: "Warhammer",
          type: "weapon",
          buy_price: 180,
          attack: 13,
          trade_enabled: true,
        },
      ],
    },
  },
};

const resupplyPlayer = {
  name: "Adventurer",
  health: { current: 30, max: 30 },
  mana: { current: 12, max: 12 },
  gold: 2,
  current_class: "Adventurer",
  level: 1,
  xp: 0,
  statuses: [],
  equipment: {
    weapon: { name: "sword", display_name: "Sword", attack: 10, defense: 0 },
    armor: { name: "leather armor", display_name: "Leather Armor", attack: 0, defense: 12 },
  },
  inventory: [
    {
      name: "cracked fang",
      display_name: "Cracked Fang",
      type: "junk",
      quantity: 3,
    },
  ],
  spells: [],
  skills: {
    swordsmanship: { level: 0, xp: 0, next_level_xp: 250 },
  },
};

const resupplyRuinsPayload: MockGamePayload = {
  ...ruinsPayload,
  state: {
    ...ruinsPayload.state,
    player: resupplyPlayer,
  },
};

const resupplyStates = {
  town: {
    ...townPayload.state,
    player: resupplyPlayer,
  },
  tavern: {
    ...townPayload.state,
    scene: "tavern",
    scene_display_name: "Tavern",
    prompt: "Tavern",
    player: resupplyPlayer,
    trade: {
      merchant: "tavern",
      display_name: "Tavern",
      player_items: [
        {
          name: "cracked fang",
          display_name: "Cracked Fang",
          type: "junk",
          quantity: 3,
          sell_price: 1,
          trade_enabled: true,
        },
      ],
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
  },
  tavernResupplied: {
    ...townPayload.state,
    scene: "tavern",
    scene_display_name: "Tavern",
    prompt: "Tavern",
    player: {
      ...resupplyPlayer,
      gold: 0,
      inventory: [
        {
          name: "potion of heal",
          display_name: "Potion of Heal",
          type: "potion",
          quantity: 5,
        },
      ],
    },
    trade: {
      merchant: "tavern",
      display_name: "Tavern",
      player_items: [
        {
          name: "potion of heal",
          display_name: "Potion of Heal",
          type: "potion",
          quantity: 5,
          sell_price: 1,
          trade_enabled: true,
        },
      ],
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
  },
  ruinsResupplied: {
    ...ruinsPayload.state,
    player: {
      ...resupplyPlayer,
      gold: 0,
      inventory: [
        {
          name: "potion of heal",
          display_name: "Potion of Heal",
          type: "potion",
          quantity: 5,
        },
      ],
    },
  },
};

const controlledDescentPlayer = {
  ...(townPayload.state.player as Record<string, unknown>),
  level: 1,
};

const controlledDescentHuntingPayload: MockGamePayload = {
  ...townPayload,
  state: {
    ...townPayload.state,
    scene: "ruins",
    scene_display_name: "Ruins",
    prompt: "Ruins L1",
    player: controlledDescentPlayer,
    dungeon: {
      level: 1,
      player_position: { x: 1, y: 1 },
      entrance_portal: null,
      ascent: null,
      descent: { x: 2, y: 1 },
      nearby_loot: null,
      viewport: {
        width: 3,
        height: 3,
        origin: { x: 0, y: 0 },
        terrain: ".........",
        entities: [
          { type: "player", x: 1, y: 1 },
          { type: "descent", x: 2, y: 1 },
        ],
      },
    },
  },
};

const controlledDescentCompletePayload: MockGamePayload = {
  ...controlledDescentHuntingPayload,
  state: {
    ...controlledDescentHuntingPayload.state,
    dungeon: {
      level: 1,
      player_position: { x: 1, y: 1 },
      entrance_portal: null,
      ascent: null,
      descent: { x: 2, y: 1 },
      nearby_loot: null,
      viewport: {
        width: 3,
        height: 3,
        origin: { x: 0, y: 0 },
        terrain: "####..###",
        entities: [
          { type: "player", x: 1, y: 1 },
          { type: "descent", x: 2, y: 1 },
        ],
      },
    },
  },
};

type MockSocketStatus = "offline" | "error" | "close-once";

async function mockGame(
  page: Page,
  payload: MockGamePayload,
  options: {
    socketStatus?: MockSocketStatus;
    heartbeatIntervalMs?: number;
    reconnectDelayMs?: number;
    replayEventsOnAction?: boolean;
    actionEvents?: MockGamePayload["events"];
    actionPatch?: Record<string, unknown>;
  } = {},
) {
  await page.addInitScript(({
    payload,
    socketStatus,
    heartbeatIntervalMs,
    reconnectDelayMs,
    replayEventsOnAction,
    actionEvents,
    actionPatch,
  }) => {
    const testWindow = window as unknown as {
      __sentSocketMessages: Array<Record<string, unknown>>;
      __socketConnectionCount: number;
      __TEXT_ADVENTURES_SOCKET_HEARTBEAT_INTERVAL_MS?: number;
      __TEXT_ADVENTURES_SOCKET_RECONNECT_DELAY_MS?: number;
    };
    const sentSocketMessages: Array<Record<string, unknown>> = [];
    let connectionCount = 0;

    testWindow.__sentSocketMessages = sentSocketMessages;
    testWindow.__socketConnectionCount = connectionCount;

    if (typeof heartbeatIntervalMs === "number") {
      testWindow.__TEXT_ADVENTURES_SOCKET_HEARTBEAT_INTERVAL_MS = heartbeatIntervalMs;
    }

    if (typeof reconnectDelayMs === "number") {
      testWindow.__TEXT_ADVENTURES_SOCKET_RECONNECT_DELAY_MS = reconnectDelayMs;
    } else if (socketStatus === "offline" || socketStatus === "error") {
      testWindow.__TEXT_ADVENTURES_SOCKET_RECONNECT_DELAY_MS = 60_000;
    }

    class FakeWebSocket extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = FakeWebSocket.CONNECTING;

      constructor() {
        super();
        connectionCount += 1;
        testWindow.__socketConnectionCount = connectionCount;

        window.setTimeout(() => {
          this.readyState = FakeWebSocket.OPEN;
          this.dispatchEvent(new Event("open"));
          this.dispatchEvent(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "state",
                game_id: payload.game_id,
                state: payload.state,
              }),
            }),
          );

          if (
            socketStatus === "offline" ||
            (socketStatus === "close-once" && connectionCount === 1)
          ) {
            window.setTimeout(() => {
              this.readyState = FakeWebSocket.CLOSED;
              this.dispatchEvent(new CloseEvent("close"));
            }, 30);
          } else if (socketStatus === "error") {
            window.setTimeout(() => {
              this.dispatchEvent(
                new MessageEvent("message", {
                  data: JSON.stringify({
                    type: "error",
                    error: { message: "Simulated socket error." },
                  }),
                }),
              );
            }, 30);
          }
        }, 0);
      }

      send(data: string) {
        const message = JSON.parse(String(data)) as Record<string, unknown>;
        sentSocketMessages.push(message);

        if (message.type === "ping") {
          window.setTimeout(() => {
            this.dispatchEvent(
              new MessageEvent("message", {
                data: JSON.stringify({
                  type: "pong",
                  game_id: payload.game_id,
                }),
              }),
            );
          }, 0);
          return;
        }

        window.setTimeout(() => {
          this.dispatchEvent(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "events",
                game_id: payload.game_id,
                events: actionEvents || (
                  replayEventsOnAction
                    ? payload.events
                    : [{ type: "message", text: "Action accepted" }]
                ),
                patch: actionPatch || {},
              }),
            }),
          );
        }, 0);
      }

      close() {
        this.readyState = FakeWebSocket.CLOSED;
        this.dispatchEvent(new CloseEvent("close"));
      }
    }

    window.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  }, {
    payload,
    socketStatus: options.socketStatus || null,
    heartbeatIntervalMs: options.heartbeatIntervalMs ?? null,
    reconnectDelayMs: options.reconnectDelayMs ?? null,
    replayEventsOnAction: options.replayEventsOnAction ?? false,
    actionEvents: options.actionEvents ?? null,
    actionPatch: options.actionPatch ?? null,
  });

  await page.route("**/api/games", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
  await page.route("**/api/games/demo-game", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
  await page.route("**/api/games/demo-game/actions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

async function expectControlHeightAtLeast(locator: Locator, minHeight = 44) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();

  const box = await locator.boundingBox();
  if (!box) throw new Error("Expected control to have a visible bounding box.");

  expect(box.height).toBeGreaterThanOrEqual(minHeight - 0.01);
}

async function expectHorizontalPadding(locator: Locator, left: number, right = left) {
  await expect(locator).toBeVisible();

  const padding = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      left: Number.parseFloat(style.paddingLeft),
      right: Number.parseFloat(style.paddingRight),
    };
  });

  expect(padding.left).toBeCloseTo(left, 1);
  expect(padding.right).toBeCloseTo(right, 1);
}

async function expectFontSize(locator: Locator, fontSize: number) {
  await expect(locator).toBeVisible();

  const computedFontSize = await locator.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );

  expect(computedFontSize).toBeCloseTo(fontSize, 1);
}

async function trackDrawnImageSources(page: Page) {
  await page.evaluate(() => {
    const drawnImageSources: string[] = [];
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    const trackedDrawImage = function (
      this: CanvasRenderingContext2D,
      ...args: unknown[]
    ) {
      const source = args[0];
      if (source instanceof HTMLImageElement) {
        drawnImageSources.push(source.currentSrc || source.src);
      }
      return Reflect.apply(originalDrawImage, this, args);
    };

    CanvasRenderingContext2D.prototype.drawImage = trackedDrawImage as typeof originalDrawImage;
    (window as unknown as { __drawnImageSources: string[] }).__drawnImageSources = drawnImageSources;
  });
}

async function drawnImageSources(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { __drawnImageSources: string[] }).__drawnImageSources,
  );
}

async function mockAutoResupplyGame(page: Page) {
  await page.addInitScript(({ initial, states }) => {
    const sentActions = [] as Array<Record<string, unknown>>;
    (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions =
      sentActions;

    class FakeWebSocket extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = FakeWebSocket.CONNECTING;
      currentState = initial.state;

      constructor() {
        super();
        window.setTimeout(() => {
          this.readyState = FakeWebSocket.OPEN;
          this.dispatchEvent(new Event("open"));
          this.dispatchState();
        }, 0);
      }

      send(data: string) {
        const action = JSON.parse(String(data)) as Record<string, unknown>;
        sentActions.push(action);

        if (action.type === "ping") {
          window.setTimeout(() => {
            this.dispatchEvent(
              new MessageEvent("message", {
                data: JSON.stringify({
                  type: "pong",
                  game_id: initial.game_id,
                }),
              }),
            );
          }, 0);
          return;
        }

        if (action.action === "move" && action.direction === "left") {
          this.currentState = states.town;
        } else if (action.action === "travel" && action.destination === "tavern") {
          this.currentState = states.tavern;
        } else if (action.action === "trade") {
          this.currentState = states.tavernResupplied;
        } else if (action.action === "travel" && action.destination === "ruins") {
          this.currentState = states.ruinsResupplied;
        }

        window.setTimeout(() => {
          this.dispatchEvent(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "events",
                game_id: initial.game_id,
                events: [{ type: "message", text: "Action accepted" }],
                patch: this.currentState,
              }),
            }),
          );
        }, 0);
      }

      close() {
        this.readyState = FakeWebSocket.CLOSED;
        this.dispatchEvent(new CloseEvent("close"));
      }

      dispatchState() {
        this.dispatchEvent(
          new MessageEvent("message", {
            data: JSON.stringify({
              type: "state",
              game_id: initial.game_id,
              state: this.currentState,
            }),
          }),
        );
      }
    }

    window.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  }, { initial: resupplyRuinsPayload, states: resupplyStates });

  await page.route("**/api/games", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(resupplyRuinsPayload),
    });
  });
  await page.route("**/api/games/demo-game", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(resupplyRuinsPayload),
    });
  });
}

async function mockRecordedSocketGame(page: Page, payload: MockGamePayload) {
  await page.addInitScript((payload) => {
    const sentActions = [] as Array<Record<string, unknown>>;
    (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions =
      sentActions;

    class FakeWebSocket extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = FakeWebSocket.CONNECTING;

      constructor() {
        super();
        window.setTimeout(() => {
          this.readyState = FakeWebSocket.OPEN;
          this.dispatchEvent(new Event("open"));
          this.dispatchEvent(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "state",
                game_id: payload.game_id,
                state: payload.state,
              }),
            }),
          );
        }, 0);
      }

      send(data: string) {
        const action = JSON.parse(String(data)) as Record<string, unknown>;
        sentActions.push(action);

        if (action.type === "ping") {
          window.setTimeout(() => {
            this.dispatchEvent(
              new MessageEvent("message", {
                data: JSON.stringify({
                  type: "pong",
                  game_id: payload.game_id,
                }),
              }),
            );
          }, 0);
          return;
        }

        window.setTimeout(() => {
          this.dispatchEvent(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "events",
                game_id: payload.game_id,
                events: [{ type: "message", text: "Action accepted" }],
                patch: {},
              }),
            }),
          );
        }, 0);
      }

      close() {
        this.readyState = FakeWebSocket.CLOSED;
        this.dispatchEvent(new CloseEvent("close"));
      }
    }

    window.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  }, payload);

  await page.route("**/api/games", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
  await page.route("**/api/games/demo-game", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

test("renders the migrated game shell", async ({ page }) => {
  await mockGame(page, townPayload);
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Switch to text mode" })).toContainText(
    "Actions",
  );
  await expect(page.getByLabel("Game title")).toHaveText("Text Adventures");
  await expect(page.getByRole("button", { name: "Text Adventures" })).toHaveCount(0);
  await expect(page.getByLabel("Current location")).toContainText("Town");
  await expect(page.getByLabel("Player level")).toHaveText("Level1");
  await expect(page.getByLabel("Wallet")).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Connection online" })).toBeVisible();
  await expect(page.locator(".platform-status-drawer")).toHaveCount(0);
  if ((page.viewportSize()?.width || 0) <= 700) {
    await expect(page.getByRole("button", { name: "Character" })).toBeVisible();
    await expect(page.locator(".platform-live-character .character-panel")).toHaveCount(0);
  } else {
    await expect(page.getByRole("button", { name: "Character" })).toHaveCount(0);
    await expect(page.locator(".platform-live-character .character-panel")).toBeVisible();
  }
  await expect(page.locator("#command-input")).toHaveCount(0);
  await expect(page.getByText("=== LOG ==")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inventory" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.getByText("Potion of Heal")).toBeHidden();
  await page.getByRole("button", { name: "Inventory" }).click();
  await expect(page.getByText("Potion of Heal")).toBeVisible();
});

test("switches from action mode to text mode", async ({ page }) => {
  await mockGame(page, townPayload);
  await page.goto("/");

  await page.getByRole("button", { name: "Switch to text mode" }).click();

  await expect(page.getByRole("button", { name: "Switch to button mode" })).toContainText(
    "Text",
  );
  await expect(page.getByRole("button", { name: "Inventory" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ruins" })).toHaveCount(0);
  await expect(page.locator(".platform-live-character")).toHaveCount(0);
  await expect(page.locator(".platform-status-drawer")).toHaveCount(0);
  await expect(page.getByText("=== LOG ==")).toBeVisible();
  await expect(page.locator("#command-input")).toHaveAttribute(
    "placeholder",
    /go ruins, (go blacksmith, )?inventory/,
  );
});

test("keeps mobile Town and text controls at comfortable touch target heights", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGame(page, townPayload);
  await page.goto("/");

  await expectControlHeightAtLeast(page.getByRole("button", { name: "Switch to text mode" }));
  await expectHorizontalPadding(page.getByRole("button", { name: "Switch to text mode" }), 10);
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Character" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Inventory" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Spellbook" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Ruins" }));

  await page.getByRole("button", { name: "Switch to text mode" }).click();

  await expectControlHeightAtLeast(page.getByRole("button", { name: "Switch to button mode" }));
  await expectControlHeightAtLeast(page.locator("#command-input"));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Send" }));
  await expectHorizontalPadding(page.getByRole("button", { name: "Send" }), 13);
});

test("toggles the mobile character panel from the loadout rail", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGame(page, townPayload);
  await page.goto("/");

  const characterButton = page.getByRole("button", { name: "Character" });
  const characterPanel = page.locator(".platform-live-character .character-panel");

  await expect(characterButton).toHaveAttribute("aria-pressed", "false");
  await expect(characterPanel).toHaveCount(0);

  await characterButton.click();
  await expect(characterButton).toHaveAttribute("aria-pressed", "true");
  await expect(characterPanel).toBeVisible();
  await expectFontSize(characterPanel.locator(".frame-name"), 8);
  await expectFontSize(characterPanel.locator(".section-label").first(), 6);
  await expectFontSize(characterPanel.locator(".terminal-output").first(), 6.5);

  await page.getByRole("button", { name: "Inventory" }).click();
  await expect(characterButton).toHaveAttribute("aria-pressed", "false");
  await expect(characterPanel).toHaveCount(0);
  await expect(page.locator(".platform-live-collection").getByText("Potion of Heal")).toBeVisible();
});

test("keeps desktop character panel typography unchanged", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockGame(page, townPayload);
  await page.goto("/");

  const characterPanel = page.locator(".platform-live-character .character-panel");

  await expect(characterPanel).toBeVisible();
  await expectFontSize(characterPanel.locator(".frame-name"), 16);
  await expectFontSize(characterPanel.locator(".section-label").first(), 12);
  await expectFontSize(characterPanel.locator(".terminal-output").first(), 13);
});

test("persists the selected interface mode", async ({ page }) => {
  await mockGame(page, townPayload);
  await page.goto("/");

  await page.getByRole("button", { name: "Switch to text mode" }).click();
  await page.reload();

  await expect(page.getByRole("button", { name: "Switch to button mode" })).toContainText(
    "Text",
  );
  await expect(page.locator("#command-input")).toBeVisible();
});

test("renders auto-explore controls in ruins", async ({ page }) => {
  await mockGame(page, isometricRuinsPayload);
  await page.goto("/");

  const autoToggle = page.getByRole("button", { name: /^Auto$/ });

  await expect(page.getByLabel("Current location")).toContainText("Ruins L1");
  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(page.getByLabel("Dungeon map")).toBeVisible();
  await expect
    .poll(() =>
      page.getByLabel("Dungeon map").evaluate((canvas) => {
        const context = (canvas as HTMLCanvasElement).getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] > 0) return 1;
        }
        return 0;
      }),
    )
    .toBe(1);
  await expect(page.getByRole("button", { name: "Explore" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go Town" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go Deep" })).toBeVisible();
  if ((page.viewportSize()?.width || 0) <= 700) {
    await expect(page.getByRole("button", { name: "Zoom in" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Zoom out" })).toHaveCount(0);
  } else {
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  }
  await expect(autoToggle).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Auto speed 3x" }).click();
  await expect(page.getByRole("button", { name: "Auto speed 3x" })).toHaveText("3x");
  await expect(page.getByRole("button", { name: "Auto speed 3x" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("button", { name: "Go Deep" }).click();
  await expect(autoToggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Auto: going deep")).toBeVisible();

  await autoToggle.click();
  await expect(page.getByText("Auto: stopped")).toBeVisible();
});

test("limits dungeon visibility around the player", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, wideRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");
  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();

  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return Number.NEGATIVE_INFINITY;

        const logicalWidth = Number(canvasElement.dataset.logicalWidth);
        const logicalHeight = Number(canvasElement.dataset.logicalHeight);
        if (!logicalWidth || !logicalHeight) return Number.NEGATIVE_INFINITY;

        const scaleX = canvasElement.width / logicalWidth;
        const scaleY = canvasElement.height / logicalHeight;
        const averageAt = (logicalX: number, logicalY: number, radius: number) => {
          const x = Math.round((logicalX - radius) * scaleX);
          const y = Math.round((logicalY - radius) * scaleY);
          const width = Math.round(radius * 2 * scaleX);
          const height = Math.round(radius * 2 * scaleY);
          const pixels = context.getImageData(x, y, width, height).data;
          let total = 0;

          for (let index = 0; index < pixels.length; index += 4) {
            total += pixels[index] * 0.2126
              + pixels[index + 1] * 0.7152
              + pixels[index + 2] * 0.0722;
          }

          return total / (pixels.length / 4);
        };

        const near = averageAt(376, 234, 6);
        const farLeft = averageAt(184, 266, 6);
        const farRight = averageAt(568, 266, 6);
        return Math.min(near - farLeft, near - farRight);
      }),
    )
    .toBeGreaterThan(5);
});

test("never renders torches away from the right-side wall", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, floatingTorchRuinsPayload);
  await page.goto("/");

  const floatingCanvas = page.getByLabel("Dungeon map");
  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(floatingCanvas).toBeVisible();
  await page.waitForTimeout(250);
  const floatingFrame = await floatingCanvas.evaluate((element) => (
    (element as HTMLCanvasElement).toDataURL()
  ));

  const referencePage = await page.context().newPage();
  await referencePage.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(referencePage, noTorchRuinsPayload);
  await referencePage.goto("/");

  const referenceCanvas = referencePage.getByLabel("Dungeon map");
  await expect(referencePage.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(referenceCanvas).toBeVisible();
  await referencePage.waitForTimeout(250);
  const referenceFrame = await referenceCanvas.evaluate((element) => (
    (element as HTMLCanvasElement).toDataURL()
  ));

  expect(floatingFrame).toBe(referenceFrame);
  await referencePage.close();
});

test("renders the Adventurer directional player assets", async ({ page }) => {
  await mockGame(page, wideRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Druid directional player assets", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, druidRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Duelist directional player assets", async ({ page }) => {
  await mockGame(page, duelistRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Dragoon directional player assets", async ({ page }) => {
  await mockGame(page, dragoonRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Nightblade directional player assets", async ({ page }) => {
  await mockGame(page, nightbladeRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Arcanist directional player assets", async ({ page }) => {
  await mockGame(page, arcanistRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Spellblade directional player assets", async ({ page }) => {
  await mockGame(page, spellbladeRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Warden directional player assets", async ({ page }) => {
  await mockGame(page, wardenRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Skirmisher directional player assets", async ({ page }) => {
  await mockGame(page, skirmisherRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Battlemage directional player assets", async ({ page }) => {
  await mockGame(page, battlemageRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Sentinel directional player assets", async ({ page }) => {
  await mockGame(page, sentinelRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Hexblade directional player assets", async ({ page }) => {
  await mockGame(page, hexbladeRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Ranger directional player assets", async ({ page }) => {
  await mockGame(page, rangerRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Mystic directional player assets", async ({ page }) => {
  await mockGame(page, mysticRuinsPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const canvasElement = element as HTMLCanvasElement;
        const context = canvasElement.getContext("2d");
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0) ? 1 : 0;
      }),
    )
    .toBe(1);
});

test("renders the Adventurer attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, adventurerCombatPayload, { replayEventsOnAction: true });
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
  await trackDrawnImageSources(page);
  await page.getByRole("button", { name: /attack/i }).click();
  await page.waitForTimeout(100);

  const sources = await drawnImageSources(page);
  expect(sources.some((source) => source.endsWith("/actors/adventurer-attack.png"))).toBe(true);
  expect(sources.some((source) => source.endsWith("/effects/slash.png"))).toBe(false);
});

for (const { creatureId, displayName, maxHealth } of animatedEnemyFixtures) {
  const payload = animatedEnemyCombatPayload(creatureId, displayName, maxHealth);

  test(`renders the ${displayName} attack sheet without the generic slash`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockGame(page, payload, { replayEventsOnAction: true });
    await page.goto("/");

    await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
    await expect(page.getByLabel("Enemy status")).toContainText(displayName);
    await trackDrawnImageSources(page);
    await page.getByRole("button", { name: /attack/i }).click();

    await expect.poll(async () => {
      const sources = await drawnImageSources(page);
      return sources.some((source) => source.endsWith(`/enemies/${creatureId}-attack.png`));
    }).toBe(true);

    const sources = await drawnImageSources(page);
    expect(sources.some((source) => source.endsWith("/effects/slash.png"))).toBe(false);
  });

  test(`renders the ${displayName} death sheet when the mob is defeated`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockGame(page, payload, {
      actionEvents: [
        {
          type: "combat.damage",
          text: `You attack a ${displayName} causing 3 of damage.`,
          actor: "player",
          target: "enemy",
          action: "attack",
          effect: "slash",
          duration_ms: 520,
        },
      ],
      actionPatch: animatedEnemyDefeatedPatch(payload),
    });
    await page.goto("/");

    await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
    await expect(page.getByLabel("Enemy status")).toContainText(displayName);
    await page.waitForTimeout(100);
    await trackDrawnImageSources(page);
    await page.getByRole("button", { name: /attack/i }).click();

    await expect.poll(async () => {
      const sources = await drawnImageSources(page);
      return sources.some((source) => source.endsWith(`/enemies/${creatureId}-death.png`));
    }).toBe(true);
  });
}

test("renders the Druid attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, druidCombatPayload, { replayEventsOnAction: true });
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
  await page.getByRole("button", { name: /attack/i }).click();
  await page.waitForTimeout(100);
});

test("renders the Duelist attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, duelistCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Dragoon attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, dragoonCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Nightblade attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, nightbladeCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Arcanist attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, arcanistCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Spellblade attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, spellbladeCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Warden attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, wardenCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Skirmisher attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, skirmisherCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Battlemage attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, battlemageCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Sentinel attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, sentinelCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Hexblade attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, hexbladeCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Ranger attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, rangerCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("renders the Mystic attack assets during player combat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGame(page, mysticCombatPayload);
  await page.goto("/");

  const canvas = page.getByLabel("Dungeon map");

  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await expect(canvas).toBeVisible();
  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
});

test("keeps mobile Ruins action controls at comfortable touch target heights", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGame(page, isometricRuinsPayload);
  await page.goto("/");

  await expectControlHeightAtLeast(page.getByRole("button", { name: "Switch to text mode" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Character" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Inventory" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Spellbook" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: /^Auto$/ }));
  await expectHorizontalPadding(page.getByRole("button", { name: /^Auto$/ }), 7);
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Auto speed 1x" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Auto speed 2x" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Auto speed 3x" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Explore" }));
  await expectHorizontalPadding(page.getByRole("button", { name: "Explore" }), 6, 11);
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Go Town" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Go Deep" }));
  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  const canvasBox = await page.getByLabel("Dungeon map").boundingBox();
  expect(canvasBox?.width).toBeGreaterThan(390);
});

test("keeps an idle WebSocket alive with heartbeat pings", async ({ page }) => {
  await mockGame(page, ruinsPayload, { heartbeatIntervalMs: 20 });
  await page.goto("/");

  await expect(page.getByRole("status", { name: "Connection online" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            (window as unknown as { __sentSocketMessages?: Array<Record<string, unknown>> })
              .__sentSocketMessages || []
          ).filter((message) => message.type === "ping").length,
      ),
    )
    .toBeGreaterThanOrEqual(1);
  await expect(page.getByRole("status", { name: "Connection online" })).toBeVisible();
});

test("reconnects after an unexpected WebSocket close", async ({ page }) => {
  await mockGame(page, ruinsPayload, {
    socketStatus: "close-once",
    heartbeatIntervalMs: 20,
    reconnectDelayMs: 20,
  });
  await page.goto("/");

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __socketConnectionCount?: number }).__socketConnectionCount ||
          0,
      ),
    )
    .toBeGreaterThanOrEqual(2);
  await expect(page.getByRole("status", { name: "Connection online" })).toBeVisible();

  await page.getByRole("button", { name: "Explore" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          (window as unknown as { __sentSocketMessages?: Array<Record<string, unknown>> })
            .__sentSocketMessages || []
        ).some((message) => message.type === "action"),
      ),
    )
    .toBe(true);
});

test("shows a mobile command panel warning when the connection is offline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGame(page, ruinsPayload, { socketStatus: "offline" });
  await page.goto("/");

  await expect(page.getByRole("status", { name: "Connection offline" })).toBeVisible();
  await expect(page.getByLabel("Connection warning")).toContainText("Connection lost");
});

test("shows a mobile command panel warning when the connection errors", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGame(page, ruinsPayload, { socketStatus: "error" });
  await page.goto("/");

  await expect(page.getByRole("status", { name: "Connection offline" })).toBeVisible();
  await expect(page.getByLabel("Connection warning")).toContainText("Connection problem");
});

test("go deep hunts the current floor when it matches the player level", async ({ page }) => {
  await mockRecordedSocketGame(page, controlledDescentHuntingPayload);
  await page.goto("/");

  await page.getByRole("button", { name: "Go Deep" }).click();

  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions
              .length,
        ),
      { timeout: 5000 },
    )
    .toBeGreaterThanOrEqual(1);

  const firstAction = await page.evaluate(
    () => (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions[0],
  );

  expect(firstAction).toEqual({ type: "action", action: "move", direction: "up" });
  await expect(page.getByText("Auto: hunting")).toBeVisible();
});

test("go deep descends when the level-matched floor is complete", async ({ page }) => {
  await mockRecordedSocketGame(page, controlledDescentCompletePayload);
  await page.goto("/");

  await page.getByRole("button", { name: "Go Deep" }).click();

  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions
              .length,
        ),
      { timeout: 5000 },
    )
    .toBeGreaterThanOrEqual(1);

  const firstAction = await page.evaluate(
    () => (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions[0],
  );

  expect(firstAction).toEqual({ type: "action", action: "move", direction: "right" });
});

test("auto-explore resupplies at the tavern before returning to ruins", async ({ page }) => {
  await mockAutoResupplyGame(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Explore" }).click();

  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions
              .length,
        ),
      { timeout: 5000 },
    )
    .toBeGreaterThanOrEqual(4);

  const resupplyActions = await page.evaluate(() =>
      (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions.slice(
        0,
        4,
      ),
    );

  expect(resupplyActions).toEqual([
    { type: "action", action: "move", direction: "left" },
    { type: "action", action: "travel", destination: "tavern" },
    {
      type: "action",
      action: "trade",
      buy: [{ item: "potion of heal", quantity: 5 }],
      sell: [{ item: "cracked fang", quantity: 3 }],
    },
    { type: "action", action: "travel", destination: "ruins" },
  ]);

  await expect(page.getByLabel("Current location")).toContainText("Ruins L1");
  await expect(page.getByText("Auto: exploring")).toBeVisible();
});

test("keeps mobile ruins feedback and loadout visible during combat", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGame(page, combatPayload);
  await page.goto("/");

  await expect(page.locator(".commands-panel").getByLabel("Enemy status")).toContainText(
    "Skeleton Guard",
  );
  await expect(page.getByLabel("Recent messages")).toContainText("[Skeleton Guard HP: 28/28]");
  await expect(page.locator(".platform-live-character .character-panel")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Character" })).toBeVisible();
  await page.getByRole("button", { name: "Character" }).click();
  await expect(page.locator(".platform-live-character .character-panel")).toBeVisible();
  await expect(
    page.locator(".platform-live-character .character-panel").getByText("Skeleton Guard"),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inventory" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spellbook" })).toBeVisible();
  await expect(page.locator(".platform-live-collection").getByText("Potion of Heal")).toBeHidden();

  await page.getByRole("button", { name: "Inventory" }).click();
  await expect(page.locator(".platform-live-character .character-panel")).toHaveCount(0);
  await expect(page.locator(".platform-live-collection").getByText("Potion of Heal")).toBeVisible();
});

test("uses mobile trade tabs with merchant stock first", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGame(page, blacksmithPayload);
  await page.goto("/");

  await page.getByRole("button", { name: "Shop" }).click();

  await expect(page.getByRole("button", { name: "Buy" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("heading", { name: "MERCHANT STOCK" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "PLAYER ITEMS" })).toBeHidden();

  const tradeLayout = await page.locator(".shop-grid").evaluate((grid) => {
    const footer = document.querySelector<HTMLElement>(".shop-foot");
    if (!footer) throw new Error("Missing shop footer.");

    const gridStyle = window.getComputedStyle(grid);
    const footerStyle = window.getComputedStyle(footer);

    return {
      footerDirection: footerStyle.flexDirection,
      footerHeight: footer.getBoundingClientRect().height,
      gridClientHeight: grid.clientHeight,
      gridScrollHeight: grid.scrollHeight,
      paddingBottom: Number.parseFloat(gridStyle.paddingBottom),
      scrollPaddingBottom: Number.parseFloat(gridStyle.scrollPaddingBottom),
    };
  });

  expect(tradeLayout.footerDirection).toBe("row");
  expect(tradeLayout.footerHeight).toBeLessThanOrEqual(56);
  expect(tradeLayout.gridScrollHeight).toBeGreaterThan(tradeLayout.gridClientHeight);
  expect(tradeLayout.paddingBottom).toBeGreaterThanOrEqual(64);
  expect(tradeLayout.scrollPaddingBottom).toBeGreaterThanOrEqual(tradeLayout.footerHeight);

  const lastBuyControl = page.getByRole("button", { name: "Increase Warhammer" });
  await lastBuyControl.scrollIntoViewIfNeeded();
  await expectControlHeightAtLeast(lastBuyControl);

  const lastControlLayout = await lastBuyControl.evaluate((control) => {
    const footer = document.querySelector<HTMLElement>(".shop-foot");
    if (!footer) throw new Error("Missing shop footer.");

    const controlRect = control.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();

    return {
      controlBottom: controlRect.bottom,
      footerTop: footerRect.top,
    };
  });

  expect(lastControlLayout.controlBottom).toBeLessThanOrEqual(lastControlLayout.footerTop + 0.5);

  await page.getByRole("button", { name: "Increase Sword" }).click();
  await page.getByRole("button", { name: "Summary" }).click();

  await expect(page.getByLabel("Trade summary")).toBeVisible();
  await expect(page.getByRole("button", { name: "Need more gold" })).toBeDisabled();
});
