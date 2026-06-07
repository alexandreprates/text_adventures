const api = {
  gameId: null,
  async createGame() {
    const response = await fetch("/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    return parseResponse(response);
  },
  async sendCommand(command) {
    const response = await fetch(`/games/${this.gameId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command })
    });
    return parseResponse(response);
  }
};

const elements = {
  sceneTitle: document.querySelector("#scene-title"),
  serverStatus: document.querySelector("#server-status"),
  promptLabel: document.querySelector("#prompt-label"),
  gameId: document.querySelector("#game-id"),
  mapGrid: document.querySelector("#map-grid"),
  quickActions: document.querySelector("#quick-actions"),
  hpText: document.querySelector("#hp-text"),
  hpFill: document.querySelector("#hp-fill"),
  levelText: document.querySelector("#level-text"),
  xpText: document.querySelector("#xp-text"),
  goldText: document.querySelector("#gold-text"),
  modeText: document.querySelector("#mode-text"),
  equipmentText: document.querySelector("#equipment-text"),
  battleText: document.querySelector("#battle-text"),
  messageLog: document.querySelector("#message-log"),
  inventoryList: document.querySelector("#inventory-list"),
  spellsList: document.querySelector("#spells-list"),
  skillsList: document.querySelector("#skills-list"),
  commandForm: document.querySelector("#command-form"),
  commandInput: document.querySelector("#command-input"),
  newGameButton: document.querySelector("#new-game-button"),
  tabs: document.querySelectorAll(".tab")
};

const LOG_FALLBACK_LIMIT = 12;

let currentState = null;

async function parseResponse(response) {
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = body.error?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

function setStatus(text, error = false) {
  elements.serverStatus.textContent = text;
  elements.serverStatus.classList.toggle("error", error);
}

function render(payload) {
  api.gameId = payload.game_id || api.gameId;
  const state = payload.state;
  currentState = state;
  renderHeader(state);
  renderMap(state);
  renderPlayer(state.player, state.input_mode);
  renderBattle(state.battle);
  renderCollections(state.player);
  renderQuickActions(state);
  updateCommandPlaceholder(state);
  renderLog(payload.response, state.history);
}

function renderHeader(state) {
  elements.sceneTitle.textContent = state.scene_display_name || state.scene;
  elements.promptLabel.textContent = state.prompt;
  elements.gameId.textContent = api.gameId ? `ID ${api.gameId.slice(0, 8)}` : "No session";
}

function renderMap(state) {
  if (state.scene === "ruins" && state.dungeon?.map?.length) {
    elements.mapGrid.textContent = state.dungeon.map.join("\n");
    return;
  }

  const locationPanels = {
    town: ["Town of Nee'Peh", "", "Tavern", "Aluriel's Priest", "Blacksmith", "Armorsmith", "Ruins"],
    tavern: ["Tavern", "", "Rest in a rented room", "Buy or sell potions", "Return to town"],
    priest: ["Aluriel's Priest", "", "Recover health", "Cure poison", "Buy or sell tomes", "Return to town"],
    blacksmith: ["Blacksmith", "", "Show weapons", "Buy weapons", "Sell weapons", "Return to town"],
    armorsmith: ["Armorsmith", "", "Show armors", "Buy armors", "Sell armors", "Return to town"]
  };

  elements.mapGrid.textContent = (locationPanels[state.scene] || [state.scene_display_name || state.scene]).join("\n");
}

function renderPlayer(player, inputMode) {
  const health = player.health;
  const hpPercent = health.max ? Math.max(0, Math.min(100, (health.current / health.max) * 100)) : 0;
  elements.hpText.textContent = `${health.current}/${health.max}`;
  elements.hpFill.style.width = `${hpPercent}%`;
  elements.levelText.textContent = player.level;
  elements.xpText.textContent = player.xp;
  elements.goldText.textContent = player.gold;
  elements.modeText.textContent = inputMode;

  const weapon = player.equipment.weapon?.display_name || "Unarmed";
  const armor = player.equipment.armor?.display_name || "No armor";
  elements.equipmentText.textContent = `${weapon} | ${armor}`;
}

function renderBattle(battle) {
  if (!battle.active || !battle.enemy) {
    elements.battleText.textContent = "No active enemy";
    return;
  }

  const enemy = battle.enemy;
  elements.battleText.textContent = `${enemy.display_name} HP ${enemy.health.current}/${enemy.health.max}`;
}

function renderCollections(player) {
  renderList(elements.inventoryList, player.inventory, item =>
    `${item.quantity}x ${item.display_name}${item.type ? ` (${item.type})` : ""}`
  );
  renderList(elements.spellsList, player.spells, spell =>
    `${spell.display_name} Lv ${spell.level} - ${spell.description}`
  );
  const skills = Object.entries(player.skills || {}).map(([name, skill]) => ({
    label: `${labelize(name)} Lv ${skill.level} (${skill.xp}/${skill.next_level_xp} XP)`
  }));
  renderList(elements.skillsList, skills, skill => skill.label);
}

function renderList(target, entries, formatter) {
  target.innerHTML = "";
  if (!entries || entries.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Nothing here yet";
    target.appendChild(empty);
    return;
  }

  entries.forEach(entry => {
    const item = document.createElement("li");
    item.textContent = formatter(entry);
    target.appendChild(item);
  });
}

function renderLog(response, history) {
  const sourceLines = response?.lines?.length ? response.lines : history.flatMap(entry => entry.lines).slice(-LOG_FALLBACK_LIMIT);
  const lines = sourceLines.filter(isLoggableLine);
  elements.messageLog.innerHTML = "";
  const visibleLines = lines.length ? lines : sourceLines.slice(0, 1);
  visibleLines.forEach(line => {
    const item = document.createElement("li");
    item.textContent = line || " ";
    elements.messageLog.appendChild(item);
  });
}

function isLoggableLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[?#.xE@]+$/.test(trimmed)) return false;
  if (/^Ruins Level \d+$/.test(trimmed)) return false;
  if (/^(Here you can:|You can:|Global commands:|Destinations:)$/.test(trimmed)) return false;
  if (/^(go|show|buy|sell|sleep|rent room|rest|inventory|spellbook|level|skills|help|look|attack|loot|cast|equip|use|drop)\b/.test(trimmed)) return false;

  return true;
}

function renderQuickActions(state = currentState) {
  elements.quickActions.innerHTML = "";
  quickCommandsFor(state).forEach(([label, command, kind]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (kind) button.dataset.kind = kind;
    button.addEventListener("click", () => runCommand(command));
    elements.quickActions.appendChild(button);
  });
}

function quickCommandsFor(state) {
  if (!state) return [];

  if (state.pending?.confirmation) {
    return [
      ["Agree", "agree", "primary"],
      ["No", "no", "danger"]
    ];
  }

  const global = [
    ["Inventory", "inventory"],
    ["Spellbook", "spellbook"]
  ];
  const travel = [
    ["Town", "go town"],
    ["Ruins", "go ruins"],
    ["Tavern", "go tavern"],
    ["Priest", "go priest"],
    ["Blacksmith", "go blacksmith"],
    ["Armorsmith", "go armorsmith"]
  ];
  const sceneCommands = {
    town: travel.filter(([label]) => label !== "Town"),
    tavern: [["Rest", "rent room", "primary"], ["Show Stock", "show"], ["Town", "go town"]],
    priest: [["Heal", "heal", "primary"], ["Cure", "cure"], ["Show Tomes", "show"], ["Town", "go town"]],
    blacksmith: [["Show Weapons", "show", "primary"], ["Buy Dagger", "buy iron dagger"], ["Town", "go town"]],
    armorsmith: [["Show Armors", "show", "primary"], ["Buy Padded", "buy padded armor"], ["Town", "go town"]],
    ruins: [
      ["North", "go up"],
      ["East", "go right"],
      ["South", "go down"],
      ["West", "go left"],
      ["Attack", "attack", state.battle?.active ? "danger" : "primary"],
      ["Loot", "loot"]
    ]
  };

  return [
    ...(sceneCommands[state.scene] || travel),
    ...suggestedItemCommands(state.player),
    ...global
  ];
}

function suggestedItemCommands(player) {
  const equippedNames = [
    player.equipment.weapon?.name,
    player.equipment.armor?.name
  ].filter(Boolean);

  return player.inventory.filter(item => !equippedNames.includes(item.name)).slice(0, 2).map(item => {
    if (item.type === "weapon" || item.type === "armor") {
      return [`Equip ${item.display_name}`, `equip ${item.name}`, "primary"];
    }
    if (item.type === "tome" || item.type === "potion") {
      return [`Use ${item.display_name}`, `use ${item.name}`, "primary"];
    }

    return [`Use ${item.display_name}`, `use ${item.name}`];
  });
}

function updateCommandPlaceholder(state) {
  if (state.pending?.confirmation) {
    elements.commandInput.placeholder = "agree or no";
    return;
  }

  const placeholders = {
    town: "go ruins, go blacksmith, inventory",
    tavern: "rent room, show, buy potion of heal",
    priest: "heal, cure, show, buy tome of fireball",
    blacksmith: "show, buy iron dagger, sell sword",
    armorsmith: "show, buy padded armor",
    ruins: "go right, attack, loot, cast fireball"
  };
  elements.commandInput.placeholder = placeholders[state.scene] || "type a command";
}

function labelize(value) {
  return value.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

async function startGame() {
  setStatus("Connecting");
  try {
    const payload = await api.createGame();
    render(payload);
    setStatus("Online");
    elements.commandInput.focus();
  } catch (error) {
    setStatus("Offline", true);
    showError(error);
  }
}

async function runCommand(command) {
  if (!api.gameId) return;
  setStatus("Sending");
  try {
    const payload = await api.sendCommand(command);
    render(payload);
    setStatus("Online");
  } catch (error) {
    setStatus("Error", true);
    showError(error);
  }
}

function showError(error) {
  elements.messageLog.innerHTML = "";
  const item = document.createElement("li");
  item.textContent = error.message;
  elements.messageLog.appendChild(item);
}

elements.commandForm.addEventListener("submit", event => {
  event.preventDefault();
  const command = elements.commandInput.value.trim();
  if (!command) return;
  elements.commandInput.value = "";
  runCommand(command);
});

elements.newGameButton.addEventListener("click", startGame);

elements.tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    elements.tabs.forEach(button => button.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.add("hidden"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.tab}-tab`).classList.remove("hidden");
  });
});

renderQuickActions();
startGame();
