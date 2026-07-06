import { expect, test, type Page } from "@playwright/test";

type MockGamePayload = {
  game_id: string;
  events: Array<{ type: string; text: string }>;
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
        swordsmanship: { level: 1, xp: 0, next_level_xp: 250 },
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

const combatPayload: MockGamePayload = {
  ...ruinsPayload,
  events: [
    { type: "message", text: "You see a Skeleton Guard" },
    { type: "message", text: "A Skeleton Guard is about to attack you!" },
    { type: "message", text: "[Skeleton Guard HP: 28/28]" },
  ],
  state: {
    ...ruinsPayload.state,
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
      ],
    },
  },
};

async function mockGame(page: Page, payload: MockGamePayload) {
  await page.addInitScript((payload) => {
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

      send() {
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
  await page.route("**/api/games/demo-game/actions", async (route) => {
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
  await expect(page.getByLabel("Current location")).toContainText("Town");
  await expect(page.locator(".platform-status-drawer")).toHaveCount(0);
  await expect(page.locator(".platform-live-character .character-panel")).toBeVisible();
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
  await mockGame(page, ruinsPayload);
  await page.goto("/");

  const autoToggle = page.getByRole("button", { name: /^Auto$/ });

  await expect(page.getByLabel("Current location")).toContainText("Ruins L1");
  await expect(page.getByRole("button", { name: "Explore" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go Town" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go Deep" })).toBeVisible();
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

test("keeps mobile ruins feedback and loadout visible during combat", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGame(page, combatPayload);
  await page.goto("/");

  await expect(page.getByLabel("Enemy status")).toContainText("Skeleton Guard");
  await expect(page.getByLabel("Recent messages")).toContainText("[Skeleton Guard HP: 28/28]");
  await expect(page.locator(".platform-live-character .character-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Inventory" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spellbook" })).toBeVisible();
  await expect(page.locator(".platform-live-collection").getByText("Potion of Heal")).toBeHidden();

  await page.getByRole("button", { name: "Inventory" }).click();
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

  await page.getByRole("button", { name: "Increase Sword" }).click();
  await page.getByRole("button", { name: "Summary" }).click();

  await expect(page.getByLabel("Trade summary")).toBeVisible();
  await expect(page.getByRole("button", { name: "Need more gold" })).toBeDisabled();
});
