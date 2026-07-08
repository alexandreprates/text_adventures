import { expect, test, type Locator, type Page } from "@playwright/test";

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
    swordsmanship: { level: 1, xp: 0, next_level_xp: 250 },
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

type MockSocketStatus = "offline" | "error";

async function mockGame(
  page: Page,
  payload: MockGamePayload,
  options: { socketStatus?: MockSocketStatus } = {},
) {
  await page.addInitScript(({ payload, socketStatus }) => {
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

          if (socketStatus === "offline") {
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
  }, { payload, socketStatus: options.socketStatus || null });

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
        sentActions.push(JSON.parse(String(data)) as Record<string, unknown>);
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
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Character" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Inventory" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Spellbook" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Ruins" }));

  await page.getByRole("button", { name: "Switch to text mode" }).click();

  await expectControlHeightAtLeast(page.getByRole("button", { name: "Switch to button mode" }));
  await expectControlHeightAtLeast(page.locator("#command-input"));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Send" }));
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

  await page.getByRole("button", { name: "Inventory" }).click();
  await expect(characterButton).toHaveAttribute("aria-pressed", "false");
  await expect(characterPanel).toHaveCount(0);
  await expect(page.locator(".platform-live-collection").getByText("Potion of Heal")).toBeVisible();
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

test("keeps mobile Ruins action controls at comfortable touch target heights", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGame(page, ruinsPayload);
  await page.goto("/");

  await expectControlHeightAtLeast(page.getByRole("button", { name: "Switch to text mode" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Character" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Inventory" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Spellbook" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: /^Auto$/ }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Auto speed 1x" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Auto speed 2x" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Auto speed 3x" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Explore" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Go Town" }));
  await expectControlHeightAtLeast(page.getByRole("button", { name: "Go Deep" }));
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
