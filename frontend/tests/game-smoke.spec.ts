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

type MusicTestWindow = Window & {
  __musicElements: HTMLAudioElement[];
  __musicGains: GainNode[];
  __musicContext: AudioContext;
  __pushGamePatch: (patch: Record<string, unknown>, events: []) => void;
};

test("plays the selected soundtrack, crossfades scenes, and remembers mute", async ({ page }) => {
  await mockGame(page, townPayload, { enableMusic: true });
  await page.addInitScript(() => {
    const observed = window as unknown as MusicTestWindow;
    observed.__musicElements = [];
    observed.__musicGains = [];
    window.Audio = class extends Audio {
      constructor(src?: string) { super(src); observed.__musicElements.push(this); }
    };
    window.AudioContext = class extends AudioContext {
      constructor() { super(); observed.__musicContext = this; }
      createGain() {
        const gain = super.createGain();
        observed.__musicGains.push(gain);
        return gain;
      }
    };
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeAttached();
  expect(await page.evaluate(() => (window as unknown as MusicTestWindow).__musicElements.length)).toBe(0);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mute music", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const w = window as unknown as MusicTestWindow;
    return w.__musicElements[0]?.currentTime > 0 && w.__musicGains[0]?.gain.value === 0.25 && w.__musicElements[1]?.paused;
  })).toBe(true);
  expect(await page.evaluate(() => (window as unknown as MusicTestWindow).__musicElements.map((audio) => audio.loop))).toEqual([true, true]);
  await page.evaluate(() => (window as unknown as MusicTestWindow).__pushGamePatch({ scene: "ruins" }, []));
  await expect.poll(() => page.evaluate(() => {
    const w = window as unknown as MusicTestWindow;
    return w.__musicElements[0].paused && !w.__musicElements[1].paused && w.__musicGains[1].gain.value === 0.25;
  })).toBe(true);
  const time = await page.evaluate(() => (window as unknown as MusicTestWindow).__musicElements[1].currentTime);
  await page.evaluate(() => (window as unknown as MusicTestWindow).__pushGamePatch({ battle: { active: true, enemy: null } }, []));
  expect(await page.evaluate(() => (window as unknown as MusicTestWindow).__musicElements[1].currentTime)).toBeGreaterThanOrEqual(time);
  await page.getByRole("button", { name: "Mute music", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as MusicTestWindow).__musicElements.every((audio) => audio.paused))).toBe(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "Enable music", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Game credits", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as MusicTestWindow).__musicElements.length)).toBe(0);
});

test("shows accessible game and music credits without crowding the mobile header", async ({ page }) => {
  await mockGame(page, townPayload);
  await page.goto("/");
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(size);
    const credits = page.getByRole("button", { name: "Game credits", exact: true });
    await credits.click();
    const dialog = page.getByRole("dialog", { name: "Game credits", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Alexandre Prates", { exact: true })).toBeVisible();
    await expect(dialog.getByText("OpenAI Codex", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Village Consort" })).toHaveAttribute("href", /USUAN1700007/);
    await expect(dialog.getByRole("link", { name: "Darkest Child var A" })).toHaveAttribute("href", /USUAN1100784/);
    await expect(dialog.getByRole("link", { name: /Creative Commons/ })).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(size.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(credits).toBeFocused();
    const overlaps = await page.locator(".platform-top-hud").evaluate((header) => {
      const rects = Array.from(header.children).filter((child) => !child.classList.contains("sr-only")).map((child) => child.getBoundingClientRect());
      return rects.some((a, i) => rects.slice(i + 1).some((b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
    });
    expect(overlaps).toBe(false);
  }
  await page.getByRole("button", { name: "Game credits", exact: true }).click();
  await page.getByRole("button", { name: "Close credits", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Game credits", exact: true })).not.toBeVisible();
});

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

const passiveTownPayload: MockGamePayload = {
  ...townPayload,
  state: {
    ...townPayload.state,
    player: {
      ...(townPayload.state.player as Record<string, unknown>),
      current_class: "Spellblade",
      class_passive: {
        id: "spellblade",
        name: "Arcane Edge",
        description: "+10% sword damage and +10% Combat Magic damage.",
        effects: [
          { affinity: "sword", percent: 10 },
          { affinity: "combat_magic", percent: 10 },
        ],
      },
      spells: [
        {
          name: "fireball",
          display_name: "Fireball",
          level: 1,
          kind: "damage",
          mp_cost: 5,
          description: "Causes 12~22 of damage",
        },
      ],
    },
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

test("uses a town scroll from inventory and exposes the preserved return trip", async ({ page }) => {
  const scroll = { name: "town portal scroll", display_name: "Town Portal Scroll", type: "scroll", effect: "town_portal", quantity: 1 };
  const initial = {
    ...isometricRuinsPayload,
    state: { ...isometricRuinsPayload.state, player: { ...(townPayload.state.player as object), inventory: [scroll] } },
  };
  await mockGame(page, initial, {
    actionPatch: {
      scene: "town", scene_display_name: "Town", prompt: "Town",
      player: { inventory: [] }, town_portal: { level: 1, player_position: { x: 2, y: 2 } },
    },
    actionEvents: [{ type: "travel.changed_scene", text: "You teleport to the town of Nee'Peh." }],
  });
  await page.goto("/");
  await expect(page.getByLabel("Dungeon map", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await page.getByRole("button", { name: /1x Town Portal Scroll Use/ }).click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeAttached();
  await expect(page.getByRole("button", { name: /1x Town Portal Scroll Use/ })).toHaveCount(0);
  const returnButton = page.getByRole("button", { name: /^Return to dungeon/ });
  await expect(returnButton).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await returnButton.click();
  const sent = await page.evaluate(() => (window as unknown as { __sentSocketMessages: Array<{ action: unknown }> }).__sentSocketMessages);
  expect(sent).toEqual([
    expect.objectContaining({ action: "use", item: "town portal scroll" }),
    expect.objectContaining({ action: "travel", destination: "ruins" }),
  ]);
  await expect(page.getByRole("status", { name: "Connection online", exact: true })).toBeVisible();
  await page.evaluate((state) => {
    (window as unknown as MusicTestWindow).__pushGamePatch({ ...state, town_portal: null }, []);
  }, isometricRuinsPayload.state);
  await expect(page.getByLabel("Dungeon map", { exact: true })).toBeVisible();
  await expect(returnButton).toHaveCount(0);
});

test("disables portal scrolls in town and in battle", async ({ page }) => {
  const scroll = { name: "town portal scroll", display_name: "Town Portal Scroll", type: "scroll", effect: "town_portal", quantity: 1 };
  await mockGame(page, { ...townPayload, state: { ...townPayload.state, player: { ...(townPayload.state.player as object), inventory: [scroll] } } });
  await page.goto("/");
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  const use = page.getByRole("button", { name: /1x Town Portal Scroll Use/ });
  await expect(use).toBeDisabled();
  await page.evaluate(() => (window as unknown as MusicTestWindow).__pushGamePatch({ scene: "ruins", battle: { active: true, enemy: null } }, []));
  await expect(use).toBeDisabled();
  await page.evaluate(() => (window as unknown as MusicTestWindow).__pushGamePatch({ battle: { active: false, enemy: null } }, []));
  await expect(use).toBeEnabled();
});

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
  { creatureId: "owlbear_cub", displayName: "Owlbear Cub", maxHealth: 62 },
  { creatureId: "cave_troll", displayName: "Cave Troll", maxHealth: 90 },
  { creatureId: "hill_giant_youth", displayName: "Hill Giant Youth", maxHealth: 110 },
  { creatureId: "minotaur_guardian", displayName: "Minotaur Guardian", maxHealth: 95 },
  { creatureId: "ogre_marauder", displayName: "Ogre Marauder", maxHealth: 85 },
  { creatureId: "lizardfolk_scout", displayName: "Lizardfolk Scout", maxHealth: 38 },
  { creatureId: "naga_apprentice", displayName: "Naga Apprentice", maxHealth: 52 },
  { creatureId: "yuan_ti_cutthroat", displayName: "Yuan-ti Cutthroat", maxHealth: 48 },
  { creatureId: "basilisk_hatchling", displayName: "Basilisk Hatchling", maxHealth: 65 },
  { creatureId: "harpy_screecher", displayName: "Harpy Screecher", maxHealth: 36 },
  { creatureId: "griffin_fledgling", displayName: "Griffin Fledgling", maxHealth: 74 },
  { creatureId: "manticore_whelp", displayName: "Manticore Whelp", maxHealth: 78 },
  { creatureId: "wyvern_juvenile", displayName: "Wyvern Juvenile", maxHealth: 105 },
  { creatureId: "dragon_wyrmling", displayName: "Dragon Wyrmling", maxHealth: 120 },
  { creatureId: "elemental_spark", displayName: "Elemental Spark", maxHealth: 28 },
  { creatureId: "fire_elemental_ling", displayName: "Fire Elemental Ling", maxHealth: 50 },
  { creatureId: "ice_elemental_ling", displayName: "Ice Elemental Ling", maxHealth: 50 },
  { creatureId: "earth_elemental_ling", displayName: "Earth Elemental Ling", maxHealth: 75 },
  { creatureId: "air_elemental_ling", displayName: "Air Elemental Ling", maxHealth: 44 },
  { creatureId: "dark_elf_assassin", displayName: "Dark Elf Assassin", maxHealth: 58 },
  { creatureId: "dark_elf_arcanist", displayName: "Dark Elf Arcanist", maxHealth: 52 },
  { creatureId: "dwarven_ghost", displayName: "Dwarven Ghost", maxHealth: 54 },
  { creatureId: "cursed_paladin", displayName: "Cursed Paladin", maxHealth: 88 },
  { creatureId: "enchanted_armor", displayName: "Enchanted Armor", maxHealth: 80 },
  { creatureId: "crystal_golem", displayName: "Crystal Golem", maxHealth: 100 },
  { creatureId: "lich_acolyte", displayName: "Lich Acolyte", maxHealth: 72 },
  { creatureId: "goblin_skirmisher", displayName: "Goblin Skirmisher", maxHealth: 18 },
  { creatureId: "goblin_hexer", displayName: "Goblin Hexer", maxHealth: 22 },
  { creatureId: "hobgoblin_soldier", displayName: "Hobgoblin Soldier", maxHealth: 34 },
  { creatureId: "skeleton_guard", displayName: "Skeleton Guard", maxHealth: 28 },
  { creatureId: "skeleton_archer", displayName: "Skeleton Archer", maxHealth: 24 },
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

type MockSocketStatus = "offline" | "error" | "close-once" | "fail-twice";

async function mockGame(
  page: Page,
  payload: MockGamePayload,
  options: {
    enableMusic?: boolean;
    showInstallPrompt?: boolean;
    socketStatus?: MockSocketStatus;
    heartbeatIntervalMs?: number;
    reconnectDelayMs?: number;
    closeEventDelayMs?: number;
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
    closeEventDelayMs,
    replayEventsOnAction,
    actionEvents,
    actionPatch,
    showInstallPrompt,
    enableMusic,
  }) => {
    if (!enableMusic) localStorage.setItem("text_adventures.music_enabled", "false");
    if (!showInstallPrompt) {
      localStorage.setItem("text_adventures.install_prompt_dismissed_until", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }
    const testWindow = window as unknown as {
      __sentSocketMessages: Array<Record<string, unknown>>;
      __socketConnectionCount: number;
      __pushGamePatch?: (patch: Record<string, unknown>, events: MockGamePayload["events"]) => void;
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
        testWindow.__pushGamePatch = (patch, events) => {
          this.dispatchEvent(new MessageEvent("message", {
            data: JSON.stringify({ type: "events", game_id: payload.game_id, patch, events }),
          }));
        };
        connectionCount += 1;
        testWindow.__socketConnectionCount = connectionCount;

        window.setTimeout(() => {
          if (socketStatus === "fail-twice" && connectionCount <= 2) {
            this.readyState = FakeWebSocket.CLOSED;
            this.dispatchEvent(new Event("error"));
            this.dispatchEvent(new CloseEvent("close"));
            return;
          }

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
        window.setTimeout(() => {
          this.dispatchEvent(new CloseEvent("close"));
        }, closeEventDelayMs);
      }
    }

    window.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  }, {
    payload,
    socketStatus: options.socketStatus || null,
    heartbeatIntervalMs: options.heartbeatIntervalMs ?? null,
    reconnectDelayMs: options.reconnectDelayMs ?? null,
    closeEventDelayMs: options.closeEventDelayMs ?? 0,
    replayEventsOnAction: options.replayEventsOnAction ?? false,
    actionEvents: options.actionEvents ?? null,
    actionPatch: options.actionPatch ?? null,
    showInstallPrompt: options.showInstallPrompt ?? false,
    enableMusic: options.enableMusic ?? false,
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

async function mockAutoResupplyGame(page: Page, options: { portal?: boolean; affordable?: boolean; combat?: boolean } = {}) {
  const scroll = { name: "town portal scroll", type: "scroll", effect: "town_portal", quantity: 1, buy_price: 5, trade_enabled: true };
  const replacement = options.portal && options.affordable !== false ? [scroll] : [];
  const portal = options.portal ? { level: 1, player_position: { x: 1, y: 1 } } : null;
  const player = { ...resupplyPlayer, gold: replacement.length ? 7 : 2 };
  const suppliedPlayer = { ...resupplyStates.ruinsResupplied.player, inventory: [...resupplyStates.ruinsResupplied.player.inventory, ...replacement] };
  const initial = {
    ...resupplyRuinsPayload,
    state: {
      ...resupplyRuinsPayload.state,
      player: { ...player, inventory: [...player.inventory, ...(options.portal ? [scroll] : [])] },
      battle: options.combat ? combatPayload.state.battle : { active: false, enemy: null },
    },
  };
  const stock = [...resupplyStates.tavern.trade.merchant_items, ...(options.portal ? [scroll] : [])];
  const states = {
    town: { ...resupplyStates.town, player, town_portal: portal },
    tavern: { ...resupplyStates.tavern, player, town_portal: portal, trade: { ...resupplyStates.tavern.trade, merchant_items: stock } },
    tavernResupplied: { ...resupplyStates.tavernResupplied, player: suppliedPlayer, town_portal: portal, trade: { ...resupplyStates.tavernResupplied.trade, merchant_items: stock } },
    ruinsResupplied: { ...resupplyStates.ruinsResupplied, player: suppliedPlayer, town_portal: null },
  };
  await page.addInitScript(({ initial, states }) => {
    localStorage.setItem("text_adventures.install_prompt_dismissed_until", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const sentActions = [] as Array<Record<string, unknown>>;
    (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions =
      sentActions;

    class FakeWebSocket extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = FakeWebSocket.CONNECTING;
      currentState: Record<string, unknown> = initial.state;

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

        if (action.action === "attack") {
          this.currentState = { ...this.currentState, battle: { active: false, enemy: null } };
        } else if (action.action === "use" && action.item === "town portal scroll") {
          this.currentState = states.town;
        } else if (action.action === "move" && action.direction === "left") {
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
  }, { initial, states });

  await page.route("**/api/games", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(initial),
    });
  });
  await page.route("**/api/games/demo-game", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(initial),
    });
  });
}

async function mockRecordedSocketGame(page: Page, payload: MockGamePayload) {
  await page.addInitScript((payload) => {
    localStorage.setItem("text_adventures.install_prompt_dismissed_until", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
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

async function useMobileInstallGuide(page: Page, platform: "android" | "ios" = "android") {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((system) => {
    Object.defineProperty(navigator, "userAgent", {
      value: system === "ios" ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" : "Mozilla/5.0 (Linux; Android 15; Pixel 8)",
      configurable: true,
    });
  }, platform);
  await mockGame(page, townPayload, { showInstallPrompt: true });
}

test("shows a mobile installation guide with accessible controls and remembers dismissal", async ({ page }) => {
  await useMobileInstallGuide(page);
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Install Text Adventures" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Open your browser’s", { exact: false })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close installation guide" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Continue playing" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Close installation guide" })).toBeFocused();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(16);
    expect(bounds!.y).toBeGreaterThanOrEqual(16);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width - 16);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height - 16);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await dialog.getByRole("button", { name: "Continue playing" }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByLabel("Game title")).toBeVisible();
  await expect(dialog).toBeHidden();
  await page.evaluate(() => localStorage.setItem("text_adventures.install_prompt_dismissed_until", String(Date.now() - 1)));
  await page.reload();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("explains home-screen installation on iPhone", async ({ page }) => {
  await useMobileInstallGuide(page, "ios");
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Install Text Adventures" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Share", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Add to Home Screen", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Open as Web App", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Install app", exact: true })).toHaveCount(0);
});

for (const outcome of ["accepted", "dismissed", "error"] as const) {
  test(`handles ${outcome} from the native mobile installation prompt`, async ({ page }) => {
    await useMobileInstallGuide(page);
    await page.goto("/");
    const dialog = page.getByRole("dialog", { name: "Install Text Adventures" });
    await expect(dialog).toBeVisible();
    await page.evaluate((choice) => {
      Object.assign(window, { __installPromptCalls: 0 });
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, {
        prompt: async () => {
          const testWindow = window as Window & { __installPromptCalls?: number };
          testWindow.__installPromptCalls = (testWindow.__installPromptCalls ?? 0) + 1;
          if (choice === "error") throw new Error("Installation blocked");
        },
        userChoice: Promise.resolve({ outcome: choice }),
      });
      window.dispatchEvent(event);
      if (!event.defaultPrevented) throw new Error("Native promotion was not intercepted");
    }, outcome);
    const calls = () => page.evaluate(() => (window as Window & { __installPromptCalls?: number }).__installPromptCalls);
    await expect(dialog.getByRole("button", { name: "Install app", exact: true })).toBeVisible();
    expect(await calls()).toBe(0);
    await dialog.getByRole("button", { name: "Install app", exact: true }).click();
    expect(await calls()).toBe(1);
    if (outcome === "error") {
      await expect(dialog.getByRole("alert")).toContainText("Installation could not start");
      await expect(dialog.getByRole("button", { name: "Install app", exact: true })).toHaveCount(0);
      await dialog.getByRole("button", { name: "Continue playing" }).click();
    }
    await expect(dialog).toBeHidden();
  });
}

for (const mode of ["desktop", "standalone", "ios-standalone", "insecure"] as const) {
  test(`hides the mobile installation guide in ${mode} mode`, async ({ page }) => {
    await mockGame(page, townPayload, { showInstallPrompt: true });
    await page.addInitScript((displayMode) => {
      Object.defineProperty(navigator, "userAgent", { value: displayMode === "desktop" ? "Desktop Chrome" : "Android" });
      Object.defineProperty(navigator, "userAgentData", { value: { mobile: displayMode !== "desktop" } });
      if (displayMode === "ios-standalone") Object.defineProperty(navigator, "standalone", { value: true });
      if (displayMode === "insecure") Object.defineProperty(window, "isSecureContext", { value: false });
      if (displayMode === "standalone") {
        const matchMedia = window.matchMedia.bind(window);
        window.matchMedia = (query) => {
          const result = matchMedia(query);
          if (query === "(display-mode: standalone)") Object.defineProperty(result, "matches", { value: true });
          return result;
        };
      }
    }, mode);
    await page.goto("/");
    await expect(page.getByLabel("Game title")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Install Text Adventures" })).toHaveCount(0);
  });
}

test("closes the mobile installation guide when the app is installed through the browser", async ({ page }) => {
  await useMobileInstallGuide(page);
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Install Text Adventures" });
  await expect(dialog).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByLabel("Game title")).toBeVisible();
  await expect(dialog).toBeHidden();
});

test("allows dismissing the mobile installation guide when storage is blocked", async ({ page }) => {
  await useMobileInstallGuide(page);
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("Storage blocked"); };
    Storage.prototype.setItem = () => { throw new Error("Storage blocked"); };
  });
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Install Text Adventures" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close installation guide" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByLabel("Game title")).toBeVisible();
});

for (const mode of ["browser", "standalone", "ios"] as const) {
  test(`manages screen sleep in ${mode} mode`, async ({ page }) => {
    await page.addInitScript((displayMode) => {
      const events: string[] = [];
      Object.assign(window, { __wakeLockEvents: events });
      const matchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        const result = matchMedia(query);
        if (query === "(display-mode: standalone)") {
          Object.defineProperty(result, "matches", { value: displayMode === "standalone" });
        }
        return result;
      };
      Object.defineProperty(navigator, "standalone", { value: displayMode === "ios" });
      Object.defineProperty(navigator, "wakeLock", { value: {
        request: async (type: string) => {
          events.push(`request:${type}`);
          const lock = Object.assign(new EventTarget(), {
            released: false,
            release: async () => {
              events.push("release");
              lock.released = true;
              lock.dispatchEvent(new Event("release"));
            },
          });
          return lock;
        },
      } });
    }, mode);
    await mockGame(page, townPayload);
    await page.goto("/");
    await expect(page.getByLabel("Game title")).toHaveText("Text Adventures");
    const events = () => page.evaluate(() =>
      (window as Window & { __wakeLockEvents?: string[] }).__wakeLockEvents,
    );
    await expect.poll(events).toEqual(mode === "browser" ? [] : ["request:screen"]);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(events).toEqual(mode === "browser" ? [] : ["request:screen", "release"]);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(events).toEqual(mode === "browser" ? [] : ["request:screen", "release", "request:screen"]);
    await expect(page.getByLabel("Game title")).toBeVisible();
  });
}

test("provides installable web app metadata and valid home-screen icons", async ({ page }) => {
  await mockGame(page, townPayload);
  await page.goto("/");
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifestResponse = await page.request.get(manifestUrl!);
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({ id: "/", start_url: "/", scope: "/", display: "standalone" });
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"]),
  );
  expect(manifest.icons.some((icon: { purpose: string }) => icon.purpose === "maskable")).toBe(true);
  const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  for (const icon of [...manifest.icons, { src: appleIcon, sizes: "180x180" }]) {
    const dimensions = await page.evaluate(async (src: string) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return `${image.naturalWidth}x${image.naturalHeight}`;
    }, icon.src);
    expect(dimensions).toBe(icon.sizes);
  }
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute("content", "yes");
});

test("offers offline recovery without caching game state or losing the game URL", async ({ page, context }) => {
  await mockGame(page, townPayload);
  await page.goto("/");
  await expect(page.getByLabel("Game title")).toHaveText("Text Adventures");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  for (const path of ["/", "/game/demo-game"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Reconnect to continue" })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(path);
  }
  const cachePaths = await page.evaluate(async () => {
    const names = await caches.keys();
    const requests = await Promise.all(names.map(async (name) => (await caches.open(name)).keys()));
    return requests.flat().map((request) => new URL(request.url).pathname);
  });
  expect(cachePaths).toEqual(["/offline.html"]);
  expect(await page.evaluate(() => fetch("/api/games/uncached-game").then(() => true, () => false))).toBe(false);
  await context.setOffline(false);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByLabel("Game title")).toHaveText("Text Adventures");
  await expect(page).toHaveURL(/\/game\/demo-game$/);
});

test("keeps web app controls inside safe areas as the mobile viewport changes", async ({ page }) => {
  await mockGame(page, isometricRuinsPayload);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByLabel("Game title")).toHaveText("Text Adventures");
  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--safe-area-top", "47px");
    document.documentElement.style.setProperty("--safe-area-bottom", "34px");
  });
  for (const height of [844, 700]) {
    await page.setViewportSize({ width: 390, height });
    const hud = await page.locator(".platform-top-hud").boundingBox();
    const playfield = await page.locator(".platform-live-playfield").boundingBox();
    expect(hud!.y).toBeGreaterThanOrEqual(47);
    expect(playfield!.y + playfield!.height).toBeLessThanOrEqual(height - 34);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--safe-area-top", "0px");
    document.documentElement.style.setProperty("--safe-area-left", "47px");
    document.documentElement.style.setProperty("--safe-area-right", "47px");
    document.documentElement.style.setProperty("--safe-area-bottom", "21px");
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole("button", { name: "Character", exact: true })).toBeVisible();
  await expect(page.getByLabel("Character overview")).toHaveCount(0);
  const landscapeHud = await page.locator(".platform-top-hud").boundingBox();
  expect(landscapeHud!.height).toBeLessThan(120);
  expect(landscapeHud!.x).toBeGreaterThanOrEqual(47);
  expect(landscapeHud!.x + landscapeHud!.width).toBeLessThanOrEqual(844 - 47);
  const canvas = await page.getByLabel("Dungeon map", { exact: true }).boundingBox();
  const commands = await page.locator(".commands-panel").boundingBox();
  expect(canvas!.x + canvas!.width / 2).toBeLessThan(commands!.x);
  await page.getByRole("button", { name: "Character", exact: true }).click();
  await expect(page.getByLabel("Character overview")).toBeVisible();
});

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

test("renders the current class passive in the responsive character panel", async ({ page }) => {
  await mockGame(page, passiveTownPayload);
  await page.goto("/");

  if ((page.viewportSize()?.width || 0) <= 700) {
    await page.getByRole("button", { name: "Character" }).click();
  }

  const characterPanel = page.locator(".platform-live-character .character-panel");
  await expect(characterPanel).toBeVisible();
  await expect(characterPanel.getByText("-- PASSIVE --")).toBeVisible();
  await expect(characterPanel.getByText("Arcane Edge")).toBeVisible();
  await expect(
    characterPanel.getByText("+10% sword damage and +10% Combat Magic damage."),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  const equipmentLabel = characterPanel.getByText("-- EQUIPMENT --");
  await equipmentLabel.scrollIntoViewIfNeeded();
  await expect(equipmentLabel).toBeVisible();
  const equipmentDetails = characterPanel.locator(".status-output");
  await equipmentDetails.scrollIntoViewIfNeeded();
  await expect(equipmentDetails).toBeInViewport();
});

test("lists the current class passive as a non-castable spellbook item", async ({ page }) => {
  await mockGame(page, passiveTownPayload);
  await page.goto("/");

  await page.getByRole("button", { name: "Spellbook" }).click();

  const collection = page.locator(".platform-live-collection");
  await expect(collection).toBeVisible();
  await expect(collection.getByText("Arcane Edge")).toBeVisible();
  await expect(collection.getByText("Passive", { exact: true })).toBeVisible();
  await expect(
    collection.getByText("+10% sword damage and +10% Combat Magic damage."),
  ).toBeVisible();
  await expect(collection.getByRole("button", { name: /Arcane Edge/ })).toHaveCount(0);
  const fireballButton = collection.getByRole("button", { name: /Fireball Lv 1.*Cast/ });
  await fireballButton.scrollIntoViewIfNeeded();
  await expect(fireballButton).toBeInViewport();
  await expect(collection.getByText("Buy tomes at the Temple")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
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

test("keeps the player centered and camera motion continuous across unrelated state updates", async ({ page }) => {
  const dungeon = isometricRuinsPayload.state.dungeon as {
    viewport: { entities: Array<{ type: string; x: number; y: number }> };
  };
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await mockGame(page, isometricRuinsPayload, {
    actionPatch: {
      dungeon: {
        ...dungeon,
        player_position: { x: 3, y: 2 },
        viewport: {
          ...dungeon.viewport,
          entities: dungeon.viewport.entities.map((entity) =>
            entity.type === "player" ? { ...entity, x: 3 } : entity,
          ),
        },
      },
    },
  });
  await page.goto("/");
  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await page.getByRole("button", { name: "Switch to text mode" }).click();
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.evaluate(() => {
    const positions: number[] = [];
    (window as unknown as { __floorPositions: number[] }).__floorPositions = positions;
    const playerCenters: Array<{ x: number; y: number }> = [];
    (window as unknown as { __playerCenters: typeof playerCenters }).__playerCenters = playerCenters;
    let firstFloor = true;
    const originalClear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      firstFloor = true;
      return originalClear.apply(this, args);
    };
    const originalDraw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args: unknown[]) {
      if (firstFloor && args[0] instanceof HTMLImageElement && args[0].src.endsWith("/tiles/floor.png")) {
        positions.push(args[1] as number);
        firstFloor = false;
      }
      if (args[0] instanceof HTMLImageElement && args[0].src.endsWith("/actors/adventurer-walk.png")) {
        playerCenters.push({
          x: (args[5] as number) + (args[7] as number) / 2,
          y: (args[6] as number) + (args[8] as number) / 2,
        });
      }
      return Reflect.apply(originalDraw, this, args);
    } as typeof originalDraw;
  });
  await page.clock.runFor(100);
  await expect.poll(() => page.evaluate(
    () => (window as unknown as { __floorPositions: number[] }).__floorPositions.length,
  )).toBeGreaterThan(0);
  await page.locator("#command-input").fill("go right");
  await page.locator("#command-input").press("Enter");
  await page.clock.runFor(1);
  await expect(page.getByLabel("Connection online")).toBeVisible();
  await page.clock.runFor(100);
  await page.locator("#command-input").fill("look");
  await page.locator("#command-input").press("Enter");
  await page.clock.runFor(1);
  await expect(page.getByLabel("Connection online")).toBeVisible();
  await page.clock.runFor(240);

  const positions = await page.evaluate(
    () => (window as unknown as { __floorPositions: number[] }).__floorPositions,
  );
  expect(positions.length).toBeGreaterThan(15);
  expect(positions[0] - positions.at(-1)!, JSON.stringify(positions)).toBe(32);
  const steps = positions.slice(1).map((position, index) => positions[index] - position);
  expect(steps.every((step) => step >= 0 && step <= 3)).toBe(true);
  const centers = await page.evaluate(
    () => (window as unknown as { __playerCenters: Array<{ x: number; y: number }> }).__playerCenters,
  );
  const center = await page.getByLabel("Dungeon map", { exact: true }).evaluate((canvas) => ({
    x: Number((canvas as HTMLElement).dataset.logicalWidth) / 2,
    y: Number((canvas as HTMLElement).dataset.logicalHeight) / 2,
  }));
  expect(centers.length).toBeGreaterThan(15);
  expect(centers.every((position) => position.x === center.x && position.y === center.y)).toBe(true);
});

for (const direction of ["up", "down"] as const) {
  test(`keeps camera motion continuous while revealing a block ${direction}`, async ({ page }) => {
    const step = direction === "down" ? 1 : -1;
    const startY = direction === "down" ? 4 : 0;
    function viewport(crossed: boolean) {
      const origin = { x: -6, y: -5 + (crossed ? step * 5 : 0) };
      const rows = ["##..##", "#....#", "......", "#....#", "##..##"];
      const terrain = Array.from({ length: 270 }, (_, index) => {
        const x = index % 18 + origin.x;
        const y = Math.floor(index / 18) + origin.y;
        const blockY = Math.floor(y / 5);
        return x >= 0 && x < 6 && (blockY === 0 || (crossed && blockY === step))
          ? rows[((y % 5) + 5) % 5][x] : "?";
      }).join("");
      return {
        width: 18, height: 15, origin, terrain,
        entities: [{ type: "player", x: 3 - origin.x, y: startY + (crossed ? step : 0) - origin.y }],
        decorations: [{ kind: "barrel", x: 1 - origin.x, y: 1 - origin.y }],
      };
    }
    const dungeon = { level: 1, player_position: { x: 3, y: startY }, viewport: viewport(false) };
    await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
    await mockGame(page, { ...ruinsPayload, state: { ...ruinsPayload.state, dungeon } });
    await page.goto("/");
    await expect(page.getByLabel("Dungeon map", { exact: true })).toBeVisible();
    await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
    await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
    await page.evaluate(() => {
      const samples: Array<{ x: number; y: number }> = [];
      (window as unknown as { __barrelPositions: typeof samples }).__barrelPositions = samples;
      const original = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args: unknown[]) {
        if (args[0] instanceof HTMLImageElement && args[0].src.endsWith("/props/barrel.png")) {
          samples.push({ x: args[1] as number, y: args[2] as number });
        }
        return Reflect.apply(original, this, args);
      } as typeof original;
    });
    await page.clock.runFor(100);
    await page.evaluate((dungeon) => {
      (window as unknown as MusicTestWindow).__pushGamePatch({ dungeon }, []);
    }, { ...dungeon, player_position: { x: 3, y: startY + step }, viewport: viewport(true) });
    await page.clock.runFor(320);
    const positions = await page.evaluate(() =>
      (window as unknown as { __barrelPositions: Array<{ x: number; y: number }> }).__barrelPositions,
    );
    expect(positions.length).toBeGreaterThan(15);
    expect(positions.at(-1)!.x - positions[0].x).toBe(32 * step);
    expect(positions.at(-1)!.y - positions[0].y).toBe(-16 * step);
    for (let i = 1; i < positions.length; i++) {
      const dx = (positions[i].x - positions[i - 1].x) * step;
      const dy = (positions[i].y - positions[i - 1].y) * step;
      expect(dx).toBeGreaterThanOrEqual(0);
      expect(dx).toBeLessThanOrEqual(3);
      expect(dy).toBeLessThanOrEqual(0);
      expect(dy).toBeGreaterThanOrEqual(-2);
    }
  });
}

test("keeps the centered player above combat controls on mobile screens", async ({ page }) => {
  await mockGame(page, adventurerCombatPayload);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByLabel("Current location")).toContainText("Ruins L1");
  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--safe-area-top", "47px");
    document.documentElement.style.setProperty("--safe-area-bottom", "34px");
  });
  for (const [width, height] of [[320, 568], [360, 740], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(async () => {
      const geometry = await page.getByLabel("Dungeon map", { exact: true }).evaluate((canvas) => {
        const bounds = canvas.getBoundingClientRect();
        const logicalHeight = Number((canvas as HTMLElement).dataset.logicalHeight);
        return { playerBottom: bounds.y + bounds.height / 2 + (96 / 2) * bounds.height / logicalHeight };
      });
      const commands = await page.locator(".commands-panel").boundingBox();
      return geometry.playerBottom < commands!.y && commands!.y + commands!.height < height - 34;
    }).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("keeps the mobile map stationary when entering and leaving combat", async ({ page }) => {
  const idleBattle = { active: false, enemy: null };
  await mockGame(page, {
    ...adventurerCombatPayload,
    events: [],
    state: { ...adventurerCombatPayload.state, battle: idleBattle },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByText("Loading isometric dungeon…")).toBeHidden();
  const canvas = page.getByLabel("Dungeon map", { exact: true });
  await expect(canvas).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--safe-area-top", "24px");
    document.documentElement.style.setProperty("--safe-area-bottom", "34px");
  });
  const pushBattle = async (battle: unknown, text: string) => {
    await page.evaluate(({ battle, text }) => {
      const testWindow = window as Window & {
        __pushGamePatch?: (patch: Record<string, unknown>, events: MockGamePayload["events"]) => void;
      };
      testWindow.__pushGamePatch!({ battle }, [{ type: "message", text }]);
    }, { battle, text });
  };
  for (const [width, height] of [[320, 568], [360, 740], [390, 844], [430, 932], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    await expect(page.getByRole("button", { name: /^Explore/ })).toBeVisible();
    const before = await canvas.boundingBox();
    await pushBattle(adventurerCombatPayload.state.battle, "[Skeleton Guard HP: 28/28]");
    await expect(page.getByRole("button", { name: /^Attack/ })).toBeVisible();
    await expect(page.getByLabel("Enemy status")).toBeVisible();
    const enemy = await page.getByLabel("Enemy status").boundingBox();
    const controls = await page.locator(".commands-panel").boundingBox();
    const loadout = await page.getByLabel("Loadout", { exact: true }).boundingBox();
    expect(enemy!.y).toBeGreaterThanOrEqual(24);
    expect(enemy!.y + enemy!.height).toBeLessThan(controls!.y);
    expect(enemy!.x + enemy!.width).toBeLessThan(loadout!.x);
    await expect(page.getByLabel("Recent messages")).toContainText("Skeleton Guard");
    expect(await canvas.boundingBox()).toEqual(before);
    await pushBattle(idleBattle, "The enemy was defeated.");
    await expect(page.getByRole("button", { name: /^Explore/ })).toBeVisible();
    expect(await canvas.boundingBox()).toEqual(before);
  }
  await pushBattle(adventurerCombatPayload.state.battle, "A Skeleton Guard approaches.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByLabel("Enemy status")).toBeVisible();
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

test("keeps retrying until the WebSocket connection recovers", async ({ page }) => {
  await mockGame(page, ruinsPayload, {
    socketStatus: "fail-twice",
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
    .toBeGreaterThanOrEqual(3);
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

test("ignores a delayed close event from a superseded WebSocket", async ({ page }) => {
  await mockGame(page, ruinsPayload, {
    heartbeatIntervalMs: 20,
    closeEventDelayMs: 80,
  });
  await page.goto("/");
  await expect(page.getByRole("status", { name: "Connection online" })).toBeVisible();

  await page.getByRole("button", { name: "Switch to text mode" }).click();
  await page.locator("#command-input").fill("new");
  await page.getByRole("button", { name: "Send" }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __socketConnectionCount?: number }).__socketConnectionCount ||
          0,
      ),
    )
    .toBe(2);
  await expect(page.getByRole("status", { name: "Connection online" })).toBeVisible();

  await page.waitForTimeout(120);
  const pingCountAfterStaleClose = await page.evaluate(
    () =>
      (
        (window as unknown as { __sentSocketMessages?: Array<Record<string, unknown>> })
          .__sentSocketMessages || []
      ).filter((message) => message.type === "ping").length,
  );

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
    .toBeGreaterThan(pingCountAfterStaleClose);
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

for (const affordable of [true, false]) {
  test(`auto-explore uses its portal and ${affordable ? "replaces the scroll" : "returns without an unaffordable replacement"}`, async ({ page }) => {
    await mockAutoResupplyGame(page, { portal: true, affordable });
    await page.addInitScript(() => {
      localStorage.setItem("text_adventures.auto_explore.demo-game", JSON.stringify({
        level: 1, cells: [["8,8", "open"]], visited: ["8,8"], failedMoves: ["8,8:up"],
      }));
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Explore" }).click();
    const actions = () => page.evaluate(() =>
      (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions.filter((action) => action.type === "action").slice(0, 4),
    );
    await expect.poll(async () => (await actions()).length).toBe(4);
    expect(await actions()).toEqual([
      { type: "action", action: "use", item: "town portal scroll" },
      { type: "action", action: "travel", destination: "tavern" },
      { type: "action", action: "trade", buy: [
        { item: "potion of heal", quantity: 5 },
        ...(affordable ? [{ item: "town portal scroll", quantity: 1 }] : []),
      ], sell: [{ item: "cracked fang", quantity: 3 }] },
      { type: "action", action: "travel", destination: "ruins" },
    ]);
    await expect(page.getByLabel("Current location")).toContainText("Ruins L1");
    await expect(page.getByText("Auto: exploring")).toBeVisible();
    const memory = await page.evaluate(() => JSON.parse(localStorage.getItem("text_adventures.auto_explore.demo-game")!));
    expect(memory.visited).toContain("8,8");
    expect(memory.failedMoves).toContain("8,8:up");
    expect(memory.cells).toContainEqual(["8,8", "open"]);
  });
}

test("auto-explore finishes combat before using a scroll to resupply", async ({ page }) => {
  await mockAutoResupplyGame(page, { portal: true, combat: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Auto", exact: true }).click();
  await expect.poll(() => page.evaluate(() =>
    (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions.slice(0, 2),
  )).toEqual([
    { type: "action", action: "attack" },
    { type: "action", action: "use", item: "town portal scroll" },
  ]);
});

test("the explicit town goal uses a scroll and stops on arrival", async ({ page }) => {
  await mockAutoResupplyGame(page, { portal: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Go town" }).click();
  await expect(page.getByRole("button", { name: /^Return to dungeon/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Auto", exact: true })).toBeHidden();
  expect(await page.evaluate(() =>
    (window as unknown as { __sentActions: Array<Record<string, unknown>> }).__sentActions,
  )).toEqual([{ type: "action", action: "use", item: "town portal scroll" }]);
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
