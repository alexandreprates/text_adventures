const api = {
  gameId: null,
  socket: null,
  pendingAction: null,
  async createGame() {
    const response = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    return parseResponse(response);
  },
  connectGame(gameId) {
    this.disconnectGame();
    this.gameId = gameId;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws?game_id=${encodeURIComponent(gameId)}`);
    this.socket = socket;

    return new Promise((resolve, reject) => {
      socket.addEventListener("open", () => resolve(socket), { once: true });
      socket.addEventListener("error", () => reject(new Error("WebSocket connection failed.")), { once: true });
      socket.addEventListener("message", event => handleSocketMessage(event));
      socket.addEventListener("close", () => handleSocketClose(socket));
    });
  },
  disconnectGame() {
    if (this.socket) this.socket.close();
    this.socket = null;
    this.pendingAction = null;
  },
  sendAction(action) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("WebSocket is not connected."));
    }
    if (this.pendingAction) {
      return Promise.reject(new Error("Another action is still pending."));
    }

    return new Promise((resolve, reject) => {
      this.pendingAction = { resolve, reject };
      this.socket.send(JSON.stringify(webSocketActionPayload(action)));
    });
  }
};

const elements = {
  sceneTitle: document.querySelector("#scene-title"),
  mapTitle: document.querySelector("#map-title"),
  serverStatus: document.querySelector("#server-status"),
  gameId: document.querySelector("#game-id"),
  characterClass: document.querySelector("#character-class"),
  clock: document.querySelector("#clock"),
  healthBar: document.querySelector("#health-bar"),
  healthValue: document.querySelector("#health-value"),
  statusValue: document.querySelector("#status-value"),
  mapStage: document.querySelector("#map-stage"),
  locationArt: document.querySelector("#location-art"),
  mapCanvas: document.querySelector("#map-canvas"),
  mapGrid: document.querySelector("#map-grid"),
  mapZoomIn: document.querySelector("#map-zoom-in"),
  mapZoomOut: document.querySelector("#map-zoom-out"),
  contextCommands: document.querySelector("#context-commands"),
  autoExploreToggle: document.querySelector("#auto-explore-toggle"),
  autoExploreStatus: document.querySelector("#auto-explore-status"),
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

const DUNGEON_MAP_BASE_ZOOM = 1.3;
const LOCATION_ART_BASE_ZOOM = 1.12;
const MAP_ZOOM_STEP = 0.12;
const MAP_ZOOM_MIN = 0.76;
const MAP_ZOOM_MAX = 1.96;
const COMBAT_FEEDBACK_STEP_MS = 520;
const AUTO_EXPLORE_DELAY_MS = 520;
const AUTO_EXPLORE_PENDING_TIMEOUT_MS = 5000;
const AUTO_EXPLORE_REPEAT_LIMIT = 8;
const AUTO_EXPLORE_DIRECTIONS = ["up", "right", "down", "left"];
const AUTO_EXPLORE_STEPS = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }
};
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
let mapZoom = 1;
let messageLogLines = [];
let combatFeedbackTimers = [];
const autoExplore = {
  enabled: false,
  timer: null,
  knownCells: new Map(),
  visited: new Set(),
  failedMoves: new Set(),
  currentPath: [],
  destinationKey: null,
  goal: "explore",
  goalLevel: null,
  knownLevel: null,
  lastAction: null,
  lastPositionKey: null,
  pendingSince: null,
  repeatCount: 0,
  status: "Auto: stopped"
};
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

function handleSocketMessage(event) {
  const message = JSON.parse(event.data);
  if (message.type === "state") {
    render({ game_id: message.game_id, state: message.state });
    return;
  }
  if (message.type === "events") {
    const state = mergeStatePatch(currentState, message.patch);
    const payload = { game_id: message.game_id, state, events: message.events || [] };
    render(payload);
    resolvePendingAction(payload);
    return;
  }
  if (message.type === "error") {
    const error = new Error(message.error?.message || "WebSocket error.");
    rejectPendingAction(error);
    showError(error);
    stopAutoExplore("error");
  }
}

function handleSocketClose(socket) {
  if (api.socket !== socket) return;

  api.socket = null;
  const error = new Error("Connection lost. Type new to start a new game.");
  rejectPendingAction(error);
  if (currentState) {
    setStatus("Offline", true);
    showError(error);
    elements.commandInput.placeholder = "new";
  }
  stopAutoExplore("connection lost");
}

function resolvePendingAction(payload) {
  const pending = api.pendingAction;
  api.pendingAction = null;
  autoExplore.pendingSince = null;
  if (pending) pending.resolve(payload);
}

function rejectPendingAction(error) {
  const pending = api.pendingAction;
  api.pendingAction = null;
  autoExplore.pendingSince = null;
  if (pending) pending.reject(error);
}

function mergeStatePatch(state, patch) {
  if (!patch) return state;
  if (!state) return patch;

  return {
    ...state,
    ...patch,
    player: {
      ...state.player,
      ...patch.player
    }
  };
}

function webSocketActionPayload(action) {
  const { type, ...fields } = action;
  return { type: "action", action: type, ...fields };
}

function setStatus(text, error = false) {
  elements.serverStatus.textContent = text;
  elements.serverStatus.classList.toggle("error", error);
}

function render(payload) {
  api.gameId = payload.game_id || api.gameId;
  const state = payload.state;
  const events = eventsFromPayload(payload);
  currentState = state;
  updateAutoExploreKnowledge(state);
  renderHeader(state);
  renderMap(state);
  renderStatus(state);
  renderContextCommands(state);
  renderCollections(state.player);
  updateCommandPlaceholder(state);
  renderLog(events);
  playCombatFeedback(events);
  trackAutoExploreResult(state);
  scheduleAutoExplore();
}

function renderHeader(state) {
  elements.sceneTitle.textContent = state.scene_display_name || state.scene;
  elements.mapTitle.textContent = `═══ ${state.prompt} ═══`;
  elements.gameId.textContent = api.gameId ? `[PARTIDA #${api.gameId.slice(0, 4).toUpperCase()}]` : "[PARTIDA ----]";
}

function renderMap(state) {
  if (state.scene === "ruins" && state.dungeon?.viewport) {
    showCanvasMap(state);
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

function showCanvasMap(state) {
  const dungeon = state.dungeon;
  elements.mapStage.classList.add("has-canvas-map");
  elements.mapStage.classList.remove("has-location-art");
  elements.locationArt.style.transform = "";
  const mapRows = textRowsFromViewport(dungeon.viewport);
  elements.mapGrid.textContent = mapRows.join("\n");
  dungeonMapRenderer.render(dungeon.viewport, { playerDead: playerDefeated(state) });
  resizeCanvasMap();
}

function playerDefeated(state) {
  return (state?.player?.health?.current || 0) <= 0;
}

function textRowsFromViewport(viewport) {
  const symbols = Array.from(String(viewport.terrain || "").padEnd(viewport.width * viewport.height, "?"));
  const entitySymbols = { player: "x", enemy: "E", loot: "@", portal: "P", ascent: "<", descent: ">" };
  [...(viewport.entities || [])].sort(compareViewportEntities).forEach(entity => {
    const symbol = entitySymbols[entity.type];
    if (!symbol) return;

    const index = (entity.y * viewport.width) + entity.x;
    if (index >= 0 && index < symbols.length) symbols[index] = symbol;
  });

  return Array.from({ length: viewport.height }, (_, rowIndex) => {
    const start = rowIndex * viewport.width;
    return symbols.slice(start, start + viewport.width).join("");
  });
}

function compareViewportEntities(left, right) {
  return viewportEntityPriority(left.type) - viewportEntityPriority(right.type);
}

function viewportEntityPriority(type) {
  return {
    portal: 10,
    ascent: 10,
    descent: 10,
    loot: 20,
    enemy: 30,
    player: 40
  }[type] || 0;
}

function showTextMap() {
  elements.mapStage.classList.remove("has-canvas-map", "has-location-art");
  elements.locationArt.style.transform = "";
}

function showLocationArt(scene) {
  const locationArt = LOCATION_ARTS[scene];
  elements.locationArt.src = locationArt.src;
  elements.locationArt.alt = locationArt.alt;
  applyLocationArtZoom();
  elements.mapStage.classList.add("has-location-art");
}

function resizeCanvasMap() {
  const canvas = elements.mapCanvas;
  if (!canvas.width || !canvas.height) return;

  const scale = Math.min(
    elements.mapStage.clientWidth / canvas.width,
    elements.mapStage.clientHeight / canvas.height
  ) * DUNGEON_MAP_BASE_ZOOM * mapZoom;
  canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
  canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
}

function applyLocationArtZoom() {
  const scale = LOCATION_ART_BASE_ZOOM * mapZoom;
  elements.locationArt.style.transform = `scale(${scale.toFixed(2)})`;
}

function updateMapZoomControls() {
  elements.mapZoomOut.disabled = mapZoom <= MAP_ZOOM_MIN;
  elements.mapZoomIn.disabled = mapZoom >= MAP_ZOOM_MAX;
}

function setMapZoom(nextZoom) {
  mapZoom = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, Math.round(nextZoom * 100) / 100));
  if (elements.mapStage.classList.contains("has-canvas-map")) resizeCanvasMap();
  if (elements.mapStage.classList.contains("has-location-art")) applyLocationArtZoom();
  updateMapZoomControls();
}

function adjustMapZoom(direction) {
  setMapZoom(mapZoom + (direction * MAP_ZOOM_STEP));
}

function renderStatus(state) {
  const player = state.player;
  const health = player.health;
  const statuses = player.statuses?.length ? player.statuses.join(", ") : "clear";

  elements.characterClass.textContent = classLine(player);
  elements.healthBar.innerHTML = asciiBar(health.current, health.max, "danger");
  elements.healthValue.textContent = `${health.current}/${health.max}`;
  elements.statusValue.textContent = statuses;
  elements.statusValue.classList.toggle("status-alert", statuses !== "clear");
  elements.statusValue.classList.toggle("status-clear", statuses === "clear");
  renderClassProgress(player.skills);

  renderEquipmentPanel(player);
  renderEnemyStatus(state.battle);
}

function renderEquipmentPanel(player) {
  const lines = [
    equipmentLine("ARM", player.equipment.weapon, "Unarmed", "DMG", "attack"),
    equipmentLine("DEF", player.equipment.armor, "No armor", "DEF", "defense")
  ];
  const gold = document.createElement("span");
  gold.className = "gold-line";
  gold.textContent = `Gold    ${player.gold}`;

  elements.statusOutput.textContent = "";
  elements.statusOutput.append(gold, `\n${lines.join("\n")}`);
}

function equipmentLine(label, item, fallbackName, statLabel, statKey) {
  const name = item?.display_name || fallbackName;
  const statValue = item?.[statKey] || 0;
  return `${label} ${name} (${statLabel} ${statValue})`;
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

function playCombatFeedback(events) {
  const exchanges = combatExchanges(events);
  clearCombatFeedback();
  if (!exchanges.length) return;

  exchanges.forEach((exchange, index) => {
    combatFeedbackTimers.push(setTimeout(() => showCombatExchange(exchange), index * COMBAT_FEEDBACK_STEP_MS));
  });
  combatFeedbackTimers.push(setTimeout(clearCombatFeedback, exchanges.length * COMBAT_FEEDBACK_STEP_MS));
}

function combatExchanges(events) {
  return events.flatMap(event => {
    if (event.type !== "combat.damage") return [];

    if (/^You (attack|cast) /.test(event.text)) {
      return [{ source: "player" }];
    }
    if (/^[A-Z].+ attacks you with .+ causing \d+ of damage/.test(event.text)) {
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
    label: `${item.quantity || 1}x ${item.display_name}`,
    meta: item.type || "",
    type: item.type || "",
    commandValue: inventoryCommandValue(item)
  }));
  renderList(elements.spellsList, player.spells, spell => ({
    label: `${spell.display_name} Lv ${spell.level}`,
    meta: spell.kind,
    type: spell.description,
    commandValue: spell.name
  }));
}

function inventoryCommandValue(item) {
  if (item.type === "weapon" || item.type === "armor") return `equip ${item.name}`;
  if (item.type === "tome" || item.type === "potion") return `use ${item.name}`;
  if (item.type === "junk") return `drop ${item.name}`;

  return item.name;
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = "collection-item-command";
    button.textContent = details.label;
    button.addEventListener("click", () => fillCommandInput(details.commandValue || details.label));

    const meta = document.createElement("span");
    meta.className = "item-type";
    meta.textContent = details.meta || details.type || "";

    item.append(button, meta);
    if (details.type && details.meta) item.title = details.type;
    target.appendChild(item);
  });
}

function fillCommandInput(value) {
  elements.commandInput.value = value;
  elements.commandInput.focus();
  elements.commandInput.setSelectionRange(value.length, value.length);
}

function renderLog(events) {
  const eventLines = events.map(event => event.text);
  if (eventLines.length) {
    messageLogLines = [...messageLogLines, ...eventLines].slice(-80);
  }

  const visibleLines = messageLogLines.length ? messageLogLines : [" "];
  elements.messageLog.textContent = visibleLines.map(line => `> ${line || " "}`).join("\n");
  elements.messageLog.scrollTop = elements.messageLog.scrollHeight;
}

function eventsFromPayload(payload) {
  if (Array.isArray(payload.events)) return payload.events;

  return [];
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

function renderContextCommands(state = currentState) {
  elements.contextCommands.innerHTML = "";
  quickCommandsFor(state).forEach(([label, command, kind, accessibleLabel, disabled]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.command = command;
    button.dataset.shortcut = shortcutForCommand(command, label);
    button.disabled = Boolean(disabled);
    if (accessibleLabel) {
      button.setAttribute("aria-label", accessibleLabel);
      button.title = accessibleLabel;
    }
    if (kind) button.dataset.kind = kind;
    button.addEventListener("click", () => handleContextCommand(command));
    elements.contextCommands.appendChild(button);
  });
}

function handleContextCommand(command) {
  if (command.startsWith("auto ")) {
    setAutoExploreGoal(command.slice(5));
    return;
  }

  submitCommand(command);
}

function quickCommandsFor(state) {
  if (!state) return [];

  if (state.pending?.confirmation) {
    return [
      ["Confirmar", "agree", "primary"],
      ["Cancelar", "no", "danger"]
    ];
  }

  if (state.scene === "ruins") return autoExploreCommands(state);
  if (autoExplore.enabled) return autoExploreCommands(state);

  const travel = [
    ["Cidade", "go town"],
    ["Ruinas", "go ruins"],
    ["Taverna", "go tavern"],
    ["Templo", "go priest"],
    ["Ferreiro", "go blacksmith"],
    ["Armeiro", "go armorsmith"]
  ];
  const sceneCommands = {
    town: travel.filter(([label]) => label !== "Cidade"),
    tavern: [["Descansar", "rent room", "primary"], ["Comprar", "buy potion of heal"], ["Vender", "sell"], ["Estoque", "show"], ["Cidade", "go town"]],
    priest: [["Curar", "heal", "primary"], ["Remover Status", "cure"], ["Comprar", "buy tome of fireball"], ["Vender", "sell"], ["Estoque", "show"], ["Cidade", "go town"]],
    blacksmith: [["Comprar", "buy rusty dagger", "primary"], ["Vender", "sell"], ["Estoque", "show"], ["Cidade", "go town"]],
    armorsmith: [["Comprar", "buy padded armor", "primary"], ["Vender", "sell"], ["Estoque", "show"], ["Cidade", "go town"]]
  };
  const battleItemCommands = state.battle?.active ? suggestedItemCommands(state.player) : [];

  return [
    ...(sceneCommands[state.scene] || travel),
    ...battleItemCommands
  ];
}

function autoExploreCommands(state) {
  return [
    ["Explore", "auto explore", "primary"],
    ["Go Town", "auto town", "primary"],
    ["Go Deep", "auto descent", "primary", "Go Deep", !autoExploreDescentFound(state)]
  ];
}

function autoExploreDescentFound(state) {
  const key = positionKey(state?.dungeon?.descent);
  return Boolean(key && autoExplore.knownCells.get(key) === "transition");
}

function shortcutForCommand(command, label) {
  const shortcuts = {
    "go up": "w/k/↑",
    "go right": "d/l/→",
    "go down": "s/j/↓",
    "go left": "a/h/←",
    "auto explore": "e",
    "auto town": "t",
    "auto descent": "d",
    attack: "a",
    loot: "l"
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

function startAutoExplore(goal = "explore") {
  if (!canAutoExplore(currentState)) {
    updateAutoExploreStatus("Auto: enter ruins");
    return;
  }

  resetAutoExploreMemory();
  updateAutoExploreKnowledge(currentState);
  autoExplore.enabled = true;
  autoExplore.goal = goal;
  autoExplore.goalLevel = currentState.dungeon?.level ?? null;
  markAutoExploreVisited(currentState);
  updateAutoExploreStatus(autoExploreGoalStatus(goal));
  renderContextCommands(currentState);
  scheduleAutoExplore();
}

function stopAutoExplore(reason = "stopped") {
  autoExplore.enabled = false;
  autoExplore.goal = "explore";
  autoExplore.goalLevel = null;
  clearAutoExploreTimer();
  autoExplore.pendingSince = null;
  updateAutoExploreStatus(autoExploreStopStatus(reason));
  if (currentState) renderContextCommands(currentState);
}

function setAutoExploreGoal(goal) {
  if (!canAutoExplore(currentState)) {
    updateAutoExploreStatus("Auto: enter ruins");
    return;
  }

  if (!autoExplore.enabled) {
    startAutoExplore(goal);
    return;
  }

  autoExplore.goal = goal;
  autoExplore.goalLevel = currentState.dungeon?.level ?? null;
  autoExplore.currentPath = [];
  autoExplore.destinationKey = null;
  autoExplore.repeatCount = 0;
  updateAutoExploreKnowledge(currentState);
  updateAutoExploreStatus(autoExploreGoalStatus(goal));
  scheduleAutoExplore();
}

function autoExploreGoalStatus(goal) {
  if (goal === "descent") return "Auto: going deep";
  if (goal === "town") return "Auto: going town";

  return "Auto: exploring";
}

function resetAutoExploreMemory() {
  clearAutoExploreTimer();
  autoExplore.knownCells.clear();
  autoExplore.visited.clear();
  autoExplore.failedMoves.clear();
  autoExplore.currentPath = [];
  autoExplore.destinationKey = null;
  autoExplore.goal = "explore";
  autoExplore.goalLevel = null;
  autoExplore.knownLevel = null;
  autoExplore.lastAction = null;
  autoExplore.lastPositionKey = null;
  autoExplore.pendingSince = null;
  autoExplore.repeatCount = 0;
}

function clearAutoExploreTimer() {
  if (!autoExplore.timer) return;

  clearTimeout(autoExplore.timer);
  autoExplore.timer = null;
}

function autoExploreStopStatus(reason) {
  if (reason === "level complete") return "Auto: level complete";
  if (reason === "error") return "Auto: error";
  if (reason === "connection lost") return "Auto: offline";
  if (reason === "unsafe confirmation") return "Auto: confirm";
  if (reason === "dead") return "Auto: stopped";
  if (reason === "town reached") return "Auto: town reached";
  if (reason === "level descended") return "Auto: level descended";
  if (reason === "target unavailable") return "Auto: unavailable";
  if (reason === "no path") return "Auto: no path";

  return "Auto: stopped";
}

function updateAutoExploreStatus(status) {
  autoExplore.status = status;
  elements.autoExploreStatus.textContent = status;
  elements.autoExploreToggle.setAttribute("aria-pressed", autoExplore.enabled ? "true" : "false");
}

function canAutoExplore(state) {
  return state?.scene === "ruins" && Boolean(state.dungeon?.viewport) && playerAlive(state);
}

function playerAlive(state) {
  return (state?.player?.health?.current || 0) > 0;
}

function scheduleAutoExplore() {
  if (!autoExplore.enabled) return;

  clearAutoExploreTimer();
  if (api.pendingAction) {
    if (autoExplore.pendingSince && Date.now() - autoExplore.pendingSince > AUTO_EXPLORE_PENDING_TIMEOUT_MS) {
      stopAutoExplore("error");
      return;
    }
    autoExplore.timer = setTimeout(scheduleAutoExplore, AUTO_EXPLORE_DELAY_MS);
    return;
  }

  autoExplore.timer = setTimeout(runAutoExploreStep, AUTO_EXPLORE_DELAY_MS);
}

function runAutoExploreStep() {
  autoExplore.timer = null;
  if (!autoExplore.enabled) return;
  if (api.pendingAction) {
    scheduleAutoExplore();
    return;
  }

  const decision = nextAutoExploreDecision(currentState);
  if (decision.stopReason) {
    stopAutoExplore(decision.stopReason);
    return;
  }
  if (!decision.command) {
    stopAutoExplore("level complete");
    return;
  }

  updateAutoExploreStatus(decision.status);
  autoExplore.lastAction = decision.command;
  autoExplore.lastPositionKey = positionKey(currentState?.dungeon?.player_position);
  autoExplore.pendingSince = Date.now();
  submitCommand(decision.command, { source: "auto", record: false });
}

function nextAutoExploreDecision(state) {
  if (!canAutoExplore(state)) {
    return { stopReason: playerAlive(state) ? "stopped" : "dead" };
  }
  if (state.pending?.confirmation) return { stopReason: "unsafe confirmation" };

  const healingSpell = autoExploreHealingSpell(state);
  if (healingSpell) {
    return { command: `cast ${healingSpell.name}`, status: "Auto: healing" };
  }

  const healingPotion = autoExploreHealingPotion(state);
  if (healingPotion) {
    return { command: `use ${healingPotion.name}`, status: "Auto: healing" };
  }

  if (state.battle?.active) {
    const spell = state.player.spells.find(candidate => candidate.kind === "damage");
    return {
      command: spell ? `cast ${spell.name}` : "attack",
      status: "Auto: fighting"
    };
  }
  const visibleEnemy = visibleEnemyPosition(state);
  if (visibleEnemy) {
    if (manhattanDistance(state.dungeon.player_position, visibleEnemy) <= 1) {
      return { command: "attack", status: "Auto: fighting" };
    }

    const direction = nextDirectionTowardVisibleEnemy(state, visibleEnemy);
    if (direction) return { command: `go ${direction}`, status: "Auto: hunting" };
  }
  if (autoExplore.goal !== "explore") return nextAutoExploreGoalDecision(state);

  if (state.dungeon?.nearby_loot) {
    return { command: "loot", status: "Auto: looting" };
  }

  const direction = nextAutoExploreDirection(state);
  return direction ?
    { command: `go ${direction}`, status: "Auto: exploring" } :
    { stopReason: "level complete" };
}

function nextAutoExploreGoalDecision(state) {
  const target = autoExploreGoalPosition(state);
  if (!target) return { stopReason: "target unavailable" };

  const direction = nextAutoExploreTargetDirection(state, target);
  if (!direction) return { stopReason: "no path" };

  return {
    command: `go ${direction}`,
    status: autoExploreGoalStatus(autoExplore.goal)
  };
}

function autoExploreGoalPosition(state) {
  if (autoExplore.goal === "town") return state.dungeon?.entrance_portal || state.dungeon?.ascent;
  if (autoExplore.goal === "descent") return state.dungeon?.descent;
  return null;
}

function nextAutoExploreTargetDirection(state, target) {
  const position = state.dungeon?.player_position;
  if (!position) return null;

  if (autoExplore.goal === "town" && samePosition(position, target)) {
    return nextDirectionAwayFromAutoExploreTarget(state, position);
  }

  const path = shortestAutoExplorePath(position, [target], { allowTransitionGoal: true });
  return path.length >= 2 ? directionBetween(position, positionFromKey(path[1])) : null;
}

function nextDirectionAwayFromAutoExploreTarget(state, position) {
  const currentKey = positionKey(position);

  return AUTO_EXPLORE_DIRECTIONS.find(direction => {
    if (autoExplore.failedMoves.has(`${currentKey}:${direction}`)) return false;

    const step = AUTO_EXPLORE_STEPS[direction];
    const nextPosition = { x: position.x + step.x, y: position.y + step.y };
    return (
      walkableKnownPositionKey(positionKey(nextPosition)) &&
      !isLevelTransitionPosition(state, nextPosition)
    );
  }) || null;
}

function autoExploreHealingSpell(state) {
  if (!autoExploreNeedsHealing(state)) return null;

  return state.player.spells.find(spell => (
    spell.kind === "healing" ||
    spell.name === "heal"
  ));
}

function autoExploreHealingPotion(state) {
  if (!autoExploreNeedsHealing(state)) return null;

  return state.player.inventory.find(item => (
    item.type === "potion" &&
    item.name === "potion of heal" &&
    (item.quantity || 0) > 0
  ));
}

function autoExploreNeedsHealing(state) {
  const health = state?.player?.health;
  if (!health?.max) return false;

  return health.current / health.max < 0.2;
}

function nextAutoExploreDirection(state) {
  const position = state.dungeon?.player_position;
  if (!position) return null;

  const frontierDirection = unexploredDirectionFrom(state, position);
  if (frontierDirection) return frontierDirection;

  const nextPosition = nextPositionOnAutoExplorePath(state, position);
  return nextPosition ? directionBetween(position, nextPosition) : null;
}

function nextPositionOnAutoExplorePath(state, position) {
  const currentKey = positionKey(position);
  if (!currentKey) return null;

  while (autoExplore.currentPath[0] === currentKey) {
    autoExplore.currentPath.shift();
  }
  if (autoExplore.currentPath.length && walkableKnownPositionKey(autoExplore.currentPath[0])) {
    return positionFromKey(autoExplore.currentPath[0]);
  }

  const path = pathToNearestAutoExploreFrontier(state, position);
  if (path.length < 2) return null;

  autoExplore.currentPath = path.slice(1);
  autoExplore.destinationKey = path[path.length - 1];
  return positionFromKey(autoExplore.currentPath[0]);
}

function updateAutoExploreKnowledge(state) {
  const viewport = state?.dungeon?.viewport;
  if (!viewport?.origin) return;

  const level = state.dungeon?.level ?? null;
  if (autoExplore.knownLevel !== level) {
    autoExplore.knownCells.clear();
    autoExplore.visited.clear();
    autoExplore.failedMoves.clear();
    autoExplore.currentPath = [];
    autoExplore.destinationKey = null;
    autoExplore.knownLevel = level;
  }

  const terrain = String(viewport.terrain || "").padEnd(viewport.width * viewport.height, "?");
  for (let y = 0; y < viewport.height; y += 1) {
    for (let x = 0; x < viewport.width; x += 1) {
      const tile = terrain[(y * viewport.width) + x];
      if (tile === "?") continue;

      const position = {
        x: viewport.origin.x + x,
        y: viewport.origin.y + y
      };
      autoExplore.knownCells.set(positionKey(position), tile === "#" ? "wall" : "open");
    }
  }

  (viewport.entities || []).forEach(entity => {
    const position = {
      x: viewport.origin.x + entity.x,
      y: viewport.origin.y + entity.y
    };
    const currentPlayerPosition = state.dungeon?.player_position;
    const type = ["ascent", "descent", "portal"].includes(entity.type) && !samePosition(position, currentPlayerPosition) ?
      "transition" :
      "open";
    autoExplore.knownCells.set(positionKey(position), type);
  });
}

function visibleEnemyPosition(state) {
  const viewport = state?.dungeon?.viewport;
  const enemy = viewportEntity(viewport, "enemy");
  if (!viewport?.origin || !enemy) return null;

  return {
    x: viewport.origin.x + enemy.x,
    y: viewport.origin.y + enemy.y
  };
}

function nextDirectionTowardVisibleEnemy(state, enemyPosition) {
  const position = state.dungeon?.player_position;
  if (!position) return null;

  const targetPositions = AUTO_EXPLORE_DIRECTIONS.map(direction => {
    const step = AUTO_EXPLORE_STEPS[direction];
    return { x: enemyPosition.x + step.x, y: enemyPosition.y + step.y };
  }).filter(candidate => {
    return walkableKnownPositionKey(positionKey(candidate)) && !isLevelTransitionPosition(state, candidate);
  });

  const path = shortestAutoExplorePath(position, targetPositions);
  return path.length >= 2 ? directionBetween(position, positionFromKey(path[1])) : null;
}

function pathToNearestAutoExploreFrontier(state, start) {
  return shortestAutoExplorePath(start, autoExploreFrontierPositions(state));
}

function shortestAutoExplorePath(start, targets, options = {}) {
  let bestPath = [];

  targets.forEach(target => {
    const path = findAutoExplorePath(start, target, options);
    if (path.length && (!bestPath.length || path.length < bestPath.length)) {
      bestPath = path;
    }
  });

  return bestPath;
}

function autoExploreFrontierPositions(state) {
  return Array.from(autoExplore.knownCells.entries())
    .filter(([, type]) => type === "open")
    .map(([key]) => positionFromKey(key))
    .filter(position => unexploredDirectionFrom(state, position));
}

function unexploredDirectionFrom(state, position) {
  const currentKey = positionKey(position);
  if (!currentKey) return null;

  return AUTO_EXPLORE_DIRECTIONS.find(direction => {
    const step = AUTO_EXPLORE_STEPS[direction];
    const nextPosition = { x: position.x + step.x, y: position.y + step.y };
    if (autoExplore.failedMoves.has(`${currentKey}:${direction}`)) return false;
    if (isLevelTransitionPosition(state, nextPosition)) return false;
    if (autoExplore.knownCells.has(positionKey(nextPosition))) return false;

    return isBlockExitPosition(state, position, direction);
  });
}

function isLevelTransitionPosition(state, position) {
  return (
    samePosition(position, state.dungeon?.ascent) ||
    samePosition(position, state.dungeon?.descent) ||
    samePosition(position, state.dungeon?.entrance_portal)
  );
}

function findAutoExplorePath(start, goal, options = {}) {
  const startKey = positionKey(start);
  const goalKey = positionKey(goal);
  if (!startKey || !goalKey || !walkableKnownPositionKey(startKey) || !walkableAutoExploreGoalKey(goalKey, options)) return [];

  const openSet = new Set([startKey]);
  const cameFrom = new Map();
  const gScore = new Map([[startKey, 0]]);
  const fScore = new Map([[startKey, manhattanDistance(start, goal)]]);

  while (openSet.size) {
    const currentKey = lowestScoreKey(openSet, fScore);
    if (currentKey === goalKey) return reconstructAutoExplorePath(cameFrom, currentKey);

    openSet.delete(currentKey);
    autoExploreNeighbors(currentKey, goalKey, options).forEach(neighborKey => {
      const tentativeScore = (gScore.get(currentKey) ?? Infinity) + 1;
      if (tentativeScore >= (gScore.get(neighborKey) ?? Infinity)) return;

      cameFrom.set(neighborKey, currentKey);
      gScore.set(neighborKey, tentativeScore);
      fScore.set(neighborKey, tentativeScore + manhattanDistance(positionFromKey(neighborKey), goal));
      openSet.add(neighborKey);
    });
  }

  return [];
}

function autoExploreNeighbors(key, goalKey = null, options = {}) {
  const position = positionFromKey(key);
  return AUTO_EXPLORE_DIRECTIONS.map(direction => {
    const step = AUTO_EXPLORE_STEPS[direction];
    const nextPosition = { x: position.x + step.x, y: position.y + step.y };
    const nextKey = positionKey(nextPosition);
    const walkable = nextKey === goalKey ?
      walkableAutoExploreGoalKey(nextKey, options) :
      walkableKnownPositionKey(nextKey);
    return blockedAutoExploreEdge(key, direction) || !walkable ? null : nextKey;
  }).filter(Boolean);
}

function blockedAutoExploreEdge(key, direction) {
  return autoExplore.failedMoves.has(`${key}:${direction}`);
}

function walkableKnownPositionKey(key) {
  return autoExplore.knownCells.get(key) === "open";
}

function walkableAutoExploreGoalKey(key, options = {}) {
  return walkableKnownPositionKey(key) || (
    options.allowTransitionGoal &&
    autoExplore.knownCells.get(key) === "transition"
  );
}

function lowestScoreKey(keys, scores) {
  return Array.from(keys).reduce((bestKey, key) => {
    return (scores.get(key) ?? Infinity) < (scores.get(bestKey) ?? Infinity) ? key : bestKey;
  });
}

function reconstructAutoExplorePath(cameFrom, currentKey) {
  const path = [currentKey];
  while (cameFrom.has(currentKey)) {
    currentKey = cameFrom.get(currentKey);
    path.unshift(currentKey);
  }

  return path;
}

function manhattanDistance(left, right) {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function isBlockExitPosition(state, position, direction) {
  const viewport = state.dungeon?.viewport;
  if (!viewport) return false;

  const blockWidth = Math.floor(viewport.width / 3);
  const blockHeight = Math.floor(viewport.height / 3);
  if (blockWidth <= 0 || blockHeight <= 0) return false;

  const localX = positiveModulo(position.x, blockWidth);
  const localY = positiveModulo(position.y, blockHeight);

  return (
    (direction === "up" && localY === 0) ||
    (direction === "right" && localX === blockWidth - 1) ||
    (direction === "down" && localY === blockHeight - 1) ||
    (direction === "left" && localX === 0)
  );
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function directionBetween(from, to) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;

  if (deltaX === 1 && deltaY === 0) return "right";
  if (deltaX === -1 && deltaY === 0) return "left";
  if (deltaX === 0 && deltaY === 1) return "down";
  if (deltaX === 0 && deltaY === -1) return "up";
  return null;
}

function viewportEntity(viewport, type) {
  return (viewport?.entities || []).find(entity => entity.type === type);
}

function trackAutoExploreResult(state) {
  if (!autoExplore.enabled) return;
  if (autoExploreGoalReached(state)) return;
  if (!state?.dungeon?.player_position) return;

  const currentKey = positionKey(state.dungeon.player_position);
  markAutoExploreVisited(state);
  if (!autoExplore.lastAction?.startsWith("go ") || !autoExplore.lastPositionKey) return;

  if (currentKey === autoExplore.lastPositionKey) {
    const direction = autoExplore.lastAction.slice(3);
    autoExplore.failedMoves.add(`${autoExplore.lastPositionKey}:${direction}`);
    autoExplore.repeatCount += 1;
    autoExplore.currentPath = [];
    autoExplore.destinationKey = null;
    if (autoExplore.repeatCount >= AUTO_EXPLORE_REPEAT_LIMIT) stopAutoExplore("level complete");
    return;
  }

  autoExplore.repeatCount = 0;
  autoExplore.currentPath = autoExplore.currentPath.filter(key => key !== currentKey);
  autoExplore.lastAction = null;
  autoExplore.lastPositionKey = null;
}

function autoExploreGoalReached(state) {
  if (autoExplore.goal === "town" && state?.scene !== "ruins") {
    stopAutoExplore("town reached");
    return true;
  }

  if (
    autoExplore.goal === "descent" &&
    Number.isInteger(autoExplore.goalLevel) &&
    state?.dungeon?.level !== autoExplore.goalLevel
  ) {
    stopAutoExplore("level descended");
    return true;
  }

  return false;
}

function markAutoExploreVisited(state) {
  const key = positionKey(state?.dungeon?.player_position);
  if (key) autoExplore.visited.add(key);
}

function positionKey(position) {
  if (!position) return null;

  return `${position.x},${position.y}`;
}

function positionFromKey(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function samePosition(left, right) {
  return Boolean(left && right && left.x === right.x && left.y === right.y);
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

function actionFromCommand(command) {
  const normalized = command.trim().toLowerCase().replace(/\s+/g, " ");
  const [rawVerb, ...targetParts] = normalized.split(" ");
  const target = targetParts.join(" ");
  const verb = { rent: "sleep", rest: "sleep", spell: "cast" }[rawVerb] || rawVerb;
  const standalone = new Set(["agree", "attack", "cure", "heal", "help", "inventory", "level", "look", "loot", "no", "show", "skills", "sleep", "spellbook"]);

  if (standalone.has(verb)) return { type: verb };
  if (verb === "go") {
    if (!target) throw new Error("Missing target for go.");
    return ["up", "right", "down", "left"].includes(target) ?
      { type: "move", direction: target } :
      { type: "travel", destination: target };
  }
  if (["buy", "sell", "equip", "use", "drop"].includes(verb)) {
    if (!target) throw new Error(`Missing target for ${verb}.`);
    return { type: verb, item: target };
  }
  if (verb === "cast") {
    if (!target) throw new Error("Missing target for cast.");
    return { type: "cast", spell: target };
  }

  throw new Error(`Unsupported command: ${rawVerb}.`);
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

    row.append(label, level, bar);
    elements.classOutput.appendChild(row);
  });
}

function plainAsciiBar(current, max) {
  const width = 10;
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
    await api.connectGame(payload.game_id);
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

async function startNewGame() {
  stopAutoExplore("stopped");
  api.disconnectGame();
  currentState = null;
  messageLogLines = [];
  elements.commandInput.value = "";
  await startGame();
}

async function runCommand(command, options = {}) {
  if (command.trim().toLowerCase() === "new") {
    await startNewGame();
    return;
  }
  if (!api.gameId) return;
  setStatus("Sending");
  try {
    await api.sendAction(actionFromCommand(command));
    syncNavigationForCommand(command);
    setStatus("Online");
  } catch (error) {
    setStatus("Error", true);
    showError(error);
    if (options.source === "auto") stopAutoExplore("error");
  }
}

function syncNavigationForCommand(command) {
  const normalizedCommand = command.trim().toLowerCase();
  if (normalizedCommand === "inventory") {
    selectTab("inventory");
  } else if (normalizedCommand === "spellbook") {
    selectTab("spells");
  } else {
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

function submitCommand(command, options = {}) {
  const normalizedCommand = command.trim();
  if (!normalizedCommand) return;
  const autoGoal = manualAutoExploreGoal(normalizedCommand);
  if (autoGoal && options.source !== "auto") {
    if (options.record !== false) recordCommand(normalizedCommand);
    elements.commandInput.value = "";
    setAutoExploreGoal(autoGoal);
    return;
  }
  if (autoExplore.enabled && options.source !== "auto" && !autoCompatibleManualCommand(normalizedCommand)) {
    stopAutoExplore("stopped");
  }
  if (options.record !== false) recordCommand(normalizedCommand);
  if (options.source !== "auto") elements.commandInput.value = "";
  runCommand(normalizedCommand, options);
}

function autoCompatibleManualCommand(command) {
  return /^(equip|use)\b/i.test(command.trim());
}

function manualAutoExploreGoal(command) {
  if (currentState?.scene !== "ruins") return null;

  const normalizedCommand = command.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalizedCommand === "explore") return "explore";
  if (normalizedCommand === "go town") return "town";
  if (normalizedCommand === "go deep") return "descent";

  return null;
}

elements.commandForm.addEventListener("submit", event => {
  event.preventDefault();
  submitCommand(elements.commandInput.value);
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

elements.autoExploreToggle.addEventListener("click", () => {
  if (autoExplore.enabled) {
    stopAutoExplore("stopped");
  } else {
    startAutoExplore();
  }
});

elements.mapZoomIn.addEventListener("click", () => adjustMapZoom(1));
elements.mapZoomOut.addEventListener("click", () => adjustMapZoom(-1));
updateMapZoomControls();

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
