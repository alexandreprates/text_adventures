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
  mapTitle: document.querySelector("#map-title"),
  serverStatus: document.querySelector("#server-status"),
  topMode: document.querySelector("#top-mode"),
  gameId: document.querySelector("#game-id"),
  characterName: document.querySelector("#character-name"),
  characterClass: document.querySelector("#character-class"),
  clock: document.querySelector("#clock"),
  healthBar: document.querySelector("#health-bar"),
  healthValue: document.querySelector("#health-value"),
  statusValue: document.querySelector("#status-value"),
  mapStage: document.querySelector("#map-stage"),
  locationArt: document.querySelector("#location-art"),
  mapCanvas: document.querySelector("#map-canvas"),
  mapGrid: document.querySelector("#map-grid"),
  quickActions: document.querySelector("#quick-actions"),
  classOutput: document.querySelector("#class-output"),
  statusOutput: document.querySelector("#status-output"),
  enemyPanel: document.querySelector("#enemy-panel"),
  enemyHealthBar: document.querySelector("#enemy-health-bar"),
  enemyHealthValue: document.querySelector("#enemy-health-value"),
  enemyStatusValue: document.querySelector("#enemy-status-value"),
  messageLog: document.querySelector("#message-log"),
  inventoryList: document.querySelector("#inventory-list"),
  collectionTitleLabel: document.querySelector("#collection-title-label"),
  collectionTitleTail: document.querySelector("#collection-title-tail"),
  spellsList: document.querySelector("#spells-list"),
  commandForm: document.querySelector("#command-form"),
  commandInput: document.querySelector("#command-input"),
  tabs: document.querySelectorAll(".terminal-tab[data-tab]"),
  terminalTabs: document.querySelectorAll(".terminal-tab")
};

const DUNGEON_MAP_ZOOM = 1.3;
const COMBAT_FEEDBACK_STEP_MS = 520;
const COLLECTION_TITLES = {
  inventory: ["═══ INVENTARIO", "══"],
  spells: ["═══ MAGIAS", "════"]
};
const LOCATION_ARTS = {
  town: {
    src: "/assets/locations/village-hub.png",
    alt: "Village hub with paths to the tavern, temple, shops, and ruins"
  },
  tavern: {
    src: "/assets/locations/tavern-interior.png",
    alt: "Warm tavern interior with fireplace, bar, tables, potion shelves, and rented rooms"
  },
  priest: {
    src: "/assets/locations/temple-sanctuary.png",
    alt: "Temple sanctuary with altar, healing fountain, candles, stained glass, and tome shelves"
  },
  blacksmith: {
    src: "/assets/locations/blacksmith-workshop.png",
    alt: "Blacksmith workshop with forge, anvil, tools, and weapon racks"
  },
  armorsmith: {
    src: "/assets/locations/armorsmith-shop.png",
    alt: "Armorsmith shop with armor stands, shields, helmets, and trading counter"
  }
};

let currentState = null;
let openingLogLines = [];
let combatFeedbackTimers = [];
const commandHistory = {
  entries: [],
  index: 0,
  draft: ""
};
const dungeonMapRenderer = DungeonMapRenderer.create(elements.mapCanvas);

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
  renderStatus(state);
  renderCollections(state.player);
  updateCommandPlaceholder(state);
  renderLog(payload.response, state.history);
  playCombatFeedback(payload.response);
}

function renderHeader(state) {
  elements.sceneTitle.textContent = state.scene_display_name || state.scene;
  elements.mapTitle.textContent = `═══ ${state.prompt} ═══`;
  elements.gameId.textContent = api.gameId ? `[PARTIDA #${api.gameId.slice(0, 4).toUpperCase()}]` : "[PARTIDA ----]";
  elements.topMode.textContent = state.input_mode.toUpperCase();
}

function renderMap(state) {
  if (state.scene === "ruins" && state.dungeon?.map?.length) {
    showCanvasMap(state.dungeon);
    return;
  }

  showTextMap();
  const locationPanels = {
    town: ["Town of Nee'Peh", "", "Tavern", "Aluriel's Priest", "Blacksmith", "Armorsmith", "Ruins"],
    tavern: ["Tavern", "", "Rest in a rented room", "Buy or sell potions", "Return to town"],
    priest: ["Aluriel's Priest", "", "Recover health", "Cure poison", "Buy or sell tomes", "Return to town"],
    blacksmith: ["Blacksmith", "", "Show weapons", "Buy weapons", "Sell weapons", "Return to town"],
    armorsmith: ["Armorsmith", "", "Show armors", "Buy armors", "Sell armors", "Return to town"]
  };

  elements.mapGrid.textContent = (locationPanels[state.scene] || [state.scene_display_name || state.scene]).join("\n");
  if (LOCATION_ARTS[state.scene]) showLocationArt(state.scene);
}

function showCanvasMap(dungeon) {
  elements.mapStage.classList.add("has-canvas-map");
  elements.mapStage.classList.remove("has-location-art");
  const mapRows = dungeon.map;
  elements.mapGrid.textContent = mapRows.join("\n");
  dungeonMapRenderer.render(mapRows, { enemies: dungeon.visible_enemies || [] });
  resizeCanvasMap();
}

function showTextMap() {
  elements.mapStage.classList.remove("has-canvas-map", "has-location-art");
}

function showLocationArt(scene) {
  const locationArt = LOCATION_ARTS[scene];
  elements.locationArt.src = locationArt.src;
  elements.locationArt.alt = locationArt.alt;
  elements.mapStage.classList.add("has-location-art");
}

function resizeCanvasMap() {
  const canvas = elements.mapCanvas;
  if (!canvas.width || !canvas.height) return;

  const scale = Math.min(
    elements.mapStage.clientWidth / canvas.width,
    elements.mapStage.clientHeight / canvas.height
  ) * DUNGEON_MAP_ZOOM;
  canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
  canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
}

function renderStatus(state) {
  const player = state.player;
  const health = player.health;
  const weapon = player.equipment.weapon?.display_name || "Unarmed";
  const armor = player.equipment.armor?.display_name || "No armor";
  const statuses = player.statuses?.length ? player.statuses.join(", ") : "clear";

  elements.characterName.textContent = player.name.toUpperCase();
  elements.characterClass.textContent = classLine(player);
  elements.healthBar.innerHTML = asciiBar(health.current, health.max, "danger");
  elements.healthValue.textContent = `${health.current}/${health.max}`;
  elements.statusValue.textContent = statuses;
  elements.statusValue.classList.toggle("status-alert", statuses !== "clear");
  elements.statusValue.classList.toggle("status-clear", statuses === "clear");
  renderClassProgress(player.skills);

  elements.statusOutput.textContent = [
    `ARM ${weapon}`,
    `DEF ${armor}`
  ].join("\n");
  renderEnemyStatus(state.battle);
}

function renderEnemyStatus(battle) {
  const enemy = battle?.active ? battle.enemy : null;
  elements.enemyPanel.classList.toggle("hidden", !enemy);
  if (!enemy) return;

  const health = enemy.health;
  const statuses = enemy.statuses?.length ? enemy.statuses.join(", ") : "clear";
  elements.enemyHealthBar.innerHTML = asciiBar(health.current, health.max, "danger");
  elements.enemyHealthValue.textContent = `${health.current}/${health.max}`;
  elements.enemyStatusValue.textContent = statuses;
  elements.enemyStatusValue.classList.toggle("status-alert", statuses !== "clear");
  elements.enemyStatusValue.classList.toggle("status-clear", statuses === "clear");
}

function playCombatFeedback(response) {
  const exchanges = combatExchanges(response?.lines || []);
  clearCombatFeedback();
  if (!exchanges.length) return;

  exchanges.forEach((exchange, index) => {
    combatFeedbackTimers.push(setTimeout(() => showCombatExchange(exchange), index * COMBAT_FEEDBACK_STEP_MS));
  });
  combatFeedbackTimers.push(setTimeout(clearCombatFeedback, exchanges.length * COMBAT_FEEDBACK_STEP_MS));
}

function combatExchanges(lines) {
  return lines.flatMap(line => {
    if (/^You (attack|cast) .+ causing \d+ of damage/.test(line)) {
      return [{ source: "player" }];
    }
    if (/^[A-Z].+ attacks you with .+ causing \d+ of damage/.test(line)) {
      return [{ source: "enemy" }];
    }
    return [];
  });
}

function showCombatExchange(exchange) {
  dungeonMapRenderer.animateAttack(exchange.source);
}

function clearCombatFeedback() {
  combatFeedbackTimers.forEach(timer => clearTimeout(timer));
  combatFeedbackTimers = [];
  dungeonMapRenderer.clearAttackAnimation();
}

function renderCollections(player) {
  renderList(elements.inventoryList, player.inventory, item => ({
    label: item.display_name,
    meta: item.quantity > 1 ? `x${item.quantity}` : "",
    type: item.type || ""
  }));
  renderList(elements.spellsList, player.spells, spell => ({
    label: `${spell.display_name} Lv ${spell.level}`,
    meta: spell.kind,
    type: spell.description
  }));
}

function renderList(target, entries, formatter) {
  target.innerHTML = "";
  if (!entries || entries.length === 0) {
    const empty = document.createElement("li");
    empty.innerHTML = '<span>Nothing here yet</span><span class="item-type"></span>';
    target.appendChild(empty);
    return;
  }

  entries.forEach(entry => {
    const details = formatter(entry);
    const item = document.createElement("li");
    item.innerHTML = [
      `<span>${details.label}</span>`,
      `<span class="item-type">${details.meta || details.type || ""}</span>`
    ].join("");
    if (details.type && details.meta) item.title = details.type;
    target.appendChild(item);
  });
}

function renderLog(response, history) {
  if (!history.length && response?.lines?.length) openingLogLines = response.lines;

  const historyLines = history.flatMap(entry => entry.lines);
  const sourceLines = [...openingLogLines, ...historyLines];
  const lines = sourceLines.filter(isLoggableLine);
  const visibleLines = lines.length ? lines : sourceLines.slice(0, 1);
  elements.messageLog.textContent = visibleLines.map(line => `> ${line || " "}`).join("\n");
  elements.messageLog.scrollTop = elements.messageLog.scrollHeight;
}

function asciiBar(current, max, kind) {
  const width = 10;
  const ratio = max ? Math.max(0, Math.min(1, current / max)) : 0;
  const filled = Math.round(ratio * width);
  const colorClass = kind ? `bar-fill-${kind}` : "bar-fill";
  return [
    '<span class="bar-bracket">[</span>',
    `<span class="${colorClass}">${"|".repeat(filled)}</span>`,
    `<span class="bar-empty">${" ".repeat(width - filled)}</span>`,
    '<span class="bar-bracket">]</span>'
  ].join("");
}

function isLoggableLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[?#.xE@]+$/.test(trimmed)) return false;
  if (/^Ruins Level \d+$/.test(trimmed)) return false;
  if (/^(Here you can:|You can:|Global commands:|Destinations:)$/.test(trimmed)) return false;
  if (/^(agree|no) - /.test(trimmed)) return false;
  if (/^(go|show|buy|sell|sleep|rent room|rest|inventory|spellbook|level|skills|help|look|attack|loot|cast|equip|use|drop)\b/.test(trimmed)) return false;

  return true;
}

function renderQuickActions(state = currentState) {
  elements.quickActions.innerHTML = "";
  quickCommandsFor(state).forEach(([label, command, kind, accessibleLabel]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = commandLabel(label, command, accessibleLabel);
    button.dataset.command = command;
    button.dataset.shortcut = shortcutForCommand(command, label);
    if (accessibleLabel) {
      button.setAttribute("aria-label", accessibleLabel);
      button.title = accessibleLabel;
    }
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
    ["Spellbook", "spellbook"],
    inputModeCommand(state)
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
    ruins: ruinsCommands(state)
  };

  return [
    ...(sceneCommands[state.scene] || travel),
    ...suggestedItemCommands(state.player),
    ...global
  ];
}

function ruinsCommands(state) {
  const commands = [
    ["↑", "go up", null, "Go north"],
    ["→", "go right", null, "Go east"],
    ["↓", "go down", null, "Go south"],
    ["←", "go left", null, "Go west"]
  ];

  if (state.battle?.active) {
    const firstDamageSpell = state.player.spells.find(spell => spell.kind === "damage");
    if (firstDamageSpell) commands.push([`Cast ${firstDamageSpell.display_name}`, `cast ${firstDamageSpell.name}`, "primary"]);
    commands.push(["Attack", "attack", "danger"]);
  } else {
    commands.push(["Attack", "attack"]);
  }

  if (state.dungeon?.nearby_loot) commands.push(["Loot", "loot", "primary"]);

  return commands;
}

function inputModeCommand(state) {
  return state.input_mode === "game" ? ["Text Mode", "text"] : ["Game Mode", "game"];
}

function commandLabel(label, command, accessibleLabel) {
  if (/^go (up|right|down|left)$/.test(command)) return accessibleLabel?.replace(/^Go /, "Move ") || label;
  if (command === "attack") return "Attack";
  if (command === "loot") return "Collect loot";
  if (command === "inventory") return "Open inventory";
  if (command === "spellbook") return "Open spellbook";
  if (command === "game") return "Enable game mode";
  if (command === "text") return "Enable text mode";
  return label;
}

function shortcutForCommand(command, label) {
  const shortcuts = {
    "go up": "w/k/↑",
    "go right": "d/l/→",
    "go down": "s/j/↓",
    "go left": "a/h/←",
    attack: "a",
    loot: "l",
    inventory: "i",
    spellbook: "m",
    game: "g",
    text: "t"
  };

  return shortcuts[command] || label.slice(0, 1).toLowerCase();
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

  if (state.input_mode === "game") {
    elements.commandInput.placeholder = "w/a/s/d, Enter, i, l, c, text";
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

function classLine(player) {
  return player.current_class || "Adventurer";
}

function renderClassProgress(skills = {}) {
  elements.classOutput.innerHTML = "";
  Object.entries(skills).forEach(([name, skill]) => {
    const row = document.createElement("div");
    row.className = "class-row";

    const label = document.createElement("span");
    label.className = "class-name";
    label.textContent = labelize(name);

    const level = document.createElement("span");
    level.className = "class-level";
    level.textContent = String(skill.level);

    const bar = document.createElement("span");
    bar.className = "class-bar";
    bar.textContent = plainAsciiBar(skill.xp, skill.next_level_xp);

    const xp = document.createElement("span");
    xp.className = "class-xp";
    xp.textContent = `${skill.xp}/${skill.next_level_xp}`;

    row.append(label, level, bar, xp);
    elements.classOutput.appendChild(row);
  });
}

function plainAsciiBar(current, max) {
  const width = 5;
  const ratio = max ? Math.max(0, Math.min(1, current / max)) : 0;
  const filled = Math.round(ratio * width);
  return `[${"|".repeat(filled)}${" ".repeat(width - filled)}]`;
}

function healthBar(current, max) {
  const width = 12;
  const filled = max ? Math.round(Math.max(0, Math.min(1, current / max)) * width) : 0;
  return `[${"#".repeat(filled)}${".".repeat(width - filled)}]`;
}

async function startGame() {
  setStatus("Connecting");
  try {
    const payload = await api.createGame();
    selectTab("inventory");
    activateTopTab(0);
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
    syncNavigationForCommand(command);
    setStatus("Online");
  } catch (error) {
    setStatus("Error", true);
    showError(error);
  }
}

function syncNavigationForCommand(command) {
  const normalizedCommand = command.trim().toLowerCase();
  if (normalizedCommand === "inventory") {
    selectTab("inventory");
  } else if (normalizedCommand === "spellbook") {
    selectTab("spells");
  } else {
    selectTab("inventory", { syncTop: false });
    activateTopTab(0);
    elements.commandInput.focus();
  }
}

function showError(error) {
  elements.messageLog.textContent = `! ${error.message}`;
}

function recordCommand(command) {
  if (commandHistory.entries[commandHistory.entries.length - 1] !== command) commandHistory.entries.push(command);
  commandHistory.index = commandHistory.entries.length;
  commandHistory.draft = "";
}

function recallCommand(direction) {
  if (!commandHistory.entries.length) return;

  if (commandHistory.index === commandHistory.entries.length) {
    commandHistory.draft = elements.commandInput.value;
  }

  commandHistory.index = Math.max(
    0,
    Math.min(commandHistory.entries.length, commandHistory.index + direction)
  );
  elements.commandInput.value = commandHistory.entries[commandHistory.index] || commandHistory.draft;
  elements.commandInput.setSelectionRange(elements.commandInput.value.length, elements.commandInput.value.length);
}

elements.commandForm.addEventListener("submit", event => {
  event.preventDefault();
  const command = elements.commandInput.value.trim();
  if (!command) return;
  recordCommand(command);
  elements.commandInput.value = "";
  runCommand(command);
});

elements.commandInput.addEventListener("keydown", event => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    recallCommand(-1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    recallCommand(1);
  }
});

window.addEventListener("resize", () => {
  if (elements.mapStage.classList.contains("has-canvas-map")) resizeCanvasMap();
});

function selectTab(name) {
  const options = arguments[1] || {};
  const syncTop = options.syncTop ?? true;
  elements.tabs.forEach(button => button.classList.toggle("active", button.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.add("hidden"));
  document.querySelector(`#${name}-tab`).classList.remove("hidden");
  updateCollectionTitle(name);
  const topIndex = ["inventory", "spells"].indexOf(name);
  if (syncTop && topIndex >= 0) activateTopTab(topIndex);
}

function updateCollectionTitle(name) {
  const [label, tail] = COLLECTION_TITLES[name] || COLLECTION_TITLES.inventory;
  elements.collectionTitleLabel.textContent = label;
  elements.collectionTitleTail.textContent = tail;
}

elements.terminalTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab) {
      selectTab(tab.dataset.tab);
    } else {
      activateTopTab(index);
      selectTab("inventory", { syncTop: false });
    }
    elements.commandInput.focus();
  });
});

function activateTopTab(index) {
  elements.terminalTabs.forEach((button, buttonIndex) => button.classList.toggle("active", buttonIndex === index));
}

function updateClock() {
  if (!elements.clock) return;
  elements.clock.textContent = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

updateClock();
setInterval(updateClock, 1000);
startGame();
