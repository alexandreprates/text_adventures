import { useEffect, useRef, useState } from "react";
import type { AutoExploreGoal, ConnectionStatus, GameState, Item, Position, Spell } from "../lib/types";
import { samePosition } from "../lib/viewModels";

type KnownCellType = "open" | "wall" | "transition";
export type AutoExploreStopReason =
  | "level complete"
  | "error"
  | "connection lost"
  | "unsafe confirmation"
  | "dead"
  | "town reached"
  | "level descended"
  | "target unavailable"
  | "no path"
  | "stopped";

type AutoExploreModel = {
  enabled: boolean;
  resupplying: boolean;
  memoryGameId: string | null;
  knownCells: Map<string, KnownCellType>;
  visited: Set<string>;
  failedMoves: Set<string>;
  currentPath: string[];
  destinationKey: string | null;
  goal: AutoExploreGoal;
  goalLevel: number | null;
  continueAfterDescent: boolean;
  continuousDescent: boolean;
  knownLevel: number | null;
  lastAction: string | null;
  lastPositionKey: string | null;
  pendingSince: number | null;
  repeatCount: number;
  speedMultiplier: number;
  statusText: string;
  actionInFlight: boolean;
};

type AutoExploreView = {
  enabled: boolean;
  statusText: string;
  speedMultiplier: number;
  descentFound: boolean;
};

type RuinsGameState = GameState & {
  dungeon: NonNullable<GameState["dungeon"]>;
};

export type AutoExploreControls = AutoExploreView & {
  speeds: number[];
  canRun: boolean;
  descentFound: boolean;
  start: (goal?: AutoExploreGoal) => void;
  stop: (reason?: AutoExploreStopReason) => void;
  setGoal: (goal: AutoExploreGoal) => void;
  setSpeed: (speed: number) => void;
};

type UseAutoExploreOptions = {
  state: GameState | null;
  gameId: string | null;
  connectionStatus: ConnectionStatus;
  runCommand: (command: string, options?: { source?: "auto" | "manual" }) => Promise<void>;
};

type Decision =
  | { command: string; status: string; stopReason?: never }
  | { command?: never; status?: never; stopReason: AutoExploreStopReason };

const AUTO_EXPLORE_MEMORY_KEY_PREFIX = "text_adventures.auto_explore.";
const AUTO_EXPLORE_DELAY_MS = 520;
const AUTO_EXPLORE_SPEEDS = [1, 2, 3];
const AUTO_EXPLORE_PENDING_TIMEOUT_MS = 5000;
const AUTO_EXPLORE_REPEAT_LIMIT = 8;
const AUTO_EXPLORE_HEAL_POTION_NAME = "potion of heal";
const AUTO_EXPLORE_TARGET_HEAL_POTIONS = 5;
const AUTO_EXPLORE_DIRECTIONS = ["up", "right", "down", "left"] as const;
const AUTO_EXPLORE_STEPS: Record<(typeof AUTO_EXPLORE_DIRECTIONS)[number], Position> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export function useAutoExplore({
  state,
  gameId,
  connectionStatus,
  runCommand,
}: UseAutoExploreOptions): AutoExploreControls {
  const stateRef = useRef<GameState | null>(state);
  const gameIdRef = useRef<string | null>(gameId);
  const connectionStatusRef = useRef<ConnectionStatus>(connectionStatus);
  const timerRef = useRef<number | null>(null);
  const modelRef = useRef<AutoExploreModel>({
    enabled: false,
    resupplying: false,
    memoryGameId: null,
    knownCells: new Map(),
    visited: new Set(),
    failedMoves: new Set(),
    currentPath: [],
    destinationKey: null,
    goal: "explore",
    goalLevel: null,
    continueAfterDescent: false,
    continuousDescent: false,
    knownLevel: null,
    lastAction: null,
    lastPositionKey: null,
    pendingSince: null,
    repeatCount: 0,
    speedMultiplier: 1,
    statusText: "Auto: stopped",
    actionInFlight: false,
  });
  const [view, setView] = useState<AutoExploreView>({
    enabled: false,
    statusText: "Auto: stopped",
    speedMultiplier: 1,
    descentFound: false,
  });

  function publish() {
    const model = modelRef.current;
    setView((previous) => {
      const next = {
        enabled: model.enabled,
        statusText: model.statusText,
        speedMultiplier: model.speedMultiplier,
        descentFound: autoExploreDescentFound(),
      };

      return previous.enabled === next.enabled &&
        previous.statusText === next.statusText &&
        previous.speedMultiplier === next.speedMultiplier &&
        previous.descentFound === next.descentFound
        ? previous
        : next;
    });
  }

  function deferPublish() {
    window.setTimeout(publish, 0);
  }

  function canRun() {
    return canAutoExplore(stateRef.current);
  }

  function start(goal: AutoExploreGoal = "explore") {
    if (!canRun()) {
      setStatusText("Auto: enter ruins");
      return;
    }

    const model = modelRef.current;
    clearAutoExploreTimer();
    model.currentPath = [];
    model.destinationKey = null;
    model.lastAction = null;
    model.lastPositionKey = null;
    model.pendingSince = null;
    model.repeatCount = 0;
    model.resupplying = false;
    restoreAutoExploreMemory();
    updateAutoExploreKnowledge();
    model.enabled = true;
    model.goal = goal;
    model.goalLevel = stateRef.current?.dungeon?.level ?? null;
    model.continueAfterDescent = goal === "descent";
    model.continuousDescent = goal === "descent";
    markAutoExploreVisited();
    setStatusText(autoExploreGoalStatus(goal));
    scheduleAutoExplore();
  }

  function stop(reason: AutoExploreStopReason = "stopped") {
    stopModel(reason);
    clearAutoExploreTimer();
    publish();
  }

  function setGoal(goal: AutoExploreGoal) {
    if (!canRun()) {
      setStatusText("Auto: enter ruins");
      return;
    }

    const model = modelRef.current;
    if (!model.enabled) {
      start(goal);
      return;
    }

    model.goal = goal;
    model.goalLevel = stateRef.current?.dungeon?.level ?? null;
    model.continueAfterDescent = goal === "descent";
    model.continuousDescent = goal === "descent";
    model.resupplying = false;
    model.currentPath = [];
    model.destinationKey = null;
    model.repeatCount = 0;
    updateAutoExploreKnowledge();
    setStatusText(autoExploreGoalStatus(goal));
    scheduleAutoExplore();
  }

  function setSpeed(speed: number) {
    const model = modelRef.current;
    model.speedMultiplier = AUTO_EXPLORE_SPEEDS.includes(speed) ? speed : 1;
    publish();
    if (model.enabled) scheduleAutoExplore();
  }

  function setStatusText(statusText: string) {
    modelRef.current.statusText = statusText;
    publish();
  }

  function clearAutoExploreTimer() {
    if (!timerRef.current) return;

    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function scheduleAutoExplore() {
    const model = modelRef.current;
    if (!model.enabled) return;

    clearAutoExploreTimer();
    if (connectionStatusRef.current === "offline") {
      stop("connection lost");
      return;
    }

    if (model.actionInFlight || connectionStatusRef.current === "sending") {
      if (model.pendingSince && Date.now() - model.pendingSince > AUTO_EXPLORE_PENDING_TIMEOUT_MS) {
        stop("error");
        return;
      }

      timerRef.current = window.setTimeout(scheduleAutoExplore, autoExploreDelay());
      return;
    }

    timerRef.current = window.setTimeout(() => {
      void runAutoExploreStep();
    }, autoExploreDelay());
  }

  async function runAutoExploreStep() {
    const model = modelRef.current;
    timerRef.current = null;
    if (!model.enabled || model.actionInFlight) return;

    const decision = nextAutoExploreDecision();
    if (decision.stopReason) {
      stop(decision.stopReason);
      return;
    }

    model.statusText = decision.status;
    model.lastAction = decision.command;
    model.lastPositionKey = positionKey(stateRef.current?.dungeon?.player_position);
    model.pendingSince = Date.now();
    model.actionInFlight = true;
    publish();

    try {
      await runCommand(decision.command, { source: "auto" });
    } catch {
      stop("error");
    } finally {
      model.actionInFlight = false;
      model.pendingSince = null;
      scheduleAutoExplore();
    }
  }

  function stopModel(reason: AutoExploreStopReason = "stopped") {
    const model = modelRef.current;
    model.enabled = false;
    model.resupplying = false;
    model.goal = "explore";
    model.goalLevel = null;
    model.continueAfterDescent = false;
    model.continuousDescent = false;
    model.actionInFlight = false;
    model.pendingSince = null;
    model.statusText = autoExploreStopStatus(reason);
  }

  function autoExploreDelay() {
    return Math.round(AUTO_EXPLORE_DELAY_MS / modelRef.current.speedMultiplier);
  }

  function nextAutoExploreDecision(): Decision {
    const currentState = stateRef.current;
    const model = modelRef.current;
    if (model.resupplying) return nextAutoExploreResupplyDecision();
    if (!canAutoExplore(currentState)) {
      return { stopReason: playerAlive(currentState) ? "stopped" : "dead" };
    }
    if (currentState.pending?.confirmation) return { stopReason: "unsafe confirmation" };

    const healingAction = autoExploreHealingAction();
    if (healingAction) return { command: healingAction.command, status: "Auto: healing" };

    if (currentState.battle?.active) {
      const spell = autoExploreDamageSpell();
      return {
        command: spell ? `cast ${spell.name}` : "attack",
        status: "Auto: fighting",
      };
    }

    if (autoExploreShouldReturnForHealing()) return startAutoExploreResupply();

    const visibleEnemy = visibleEnemyPosition();
    if (visibleEnemy) {
      if (
        currentState.dungeon?.player_position &&
        manhattanDistance(currentState.dungeon.player_position, visibleEnemy) <= 1
      ) {
        return { command: "attack", status: "Auto: fighting" };
      }

      const direction = nextDirectionTowardVisibleEnemy(visibleEnemy);
      if (direction) return { command: `go ${direction}`, status: "Auto: hunting" };
    }

    if (model.goal !== "explore") return nextAutoExploreGoalDecision();

    if (currentState.dungeon?.nearby_loot) {
      return { command: "loot", status: "Auto: looting" };
    }

    const direction = nextAutoExploreDirection();
    return direction
      ? { command: `go ${direction}`, status: "Auto: exploring" }
      : autoExploreLevelCompleteDecision();
  }

  function autoExploreLevelCompleteDecision(): Decision {
    const model = modelRef.current;
    if (!autoExploreDescentFound()) return { stopReason: "level complete" };

    model.goal = "descent";
    model.goalLevel = stateRef.current?.dungeon?.level ?? null;
    model.continueAfterDescent = true;
    model.currentPath = [];
    model.destinationKey = null;
    model.repeatCount = 0;
    return nextAutoExploreGoalDecision();
  }

  function nextAutoExploreGoalDecision(): Decision {
    const currentState = stateRef.current;
    const model = modelRef.current;
    if (!currentState?.dungeon) return { stopReason: "stopped" };

    if (model.goal === "descent" && currentState.dungeon.nearby_loot) {
      return { command: "loot", status: "Auto: looting" };
    }

    if (model.goal === "descent" && autoExploreShouldHuntBeforeDescent()) {
      const direction = nextAutoExploreDirection();
      if (direction) return { command: `go ${direction}`, status: "Auto: hunting" };
    }

    if (model.goal === "descent" && !autoExploreDescentFound()) {
      return nextAutoExploreDeepExplorationDecision();
    }

    const target = autoExploreGoalPosition();
    if (!target) return { stopReason: "target unavailable" };

    const direction = nextAutoExploreTargetDirection(target);
    if (!direction) return { stopReason: "no path" };

    return {
      command: `go ${direction}`,
      status: autoExploreGoalStatus(model.goal),
    };
  }

  function nextAutoExploreDeepExplorationDecision(): Decision {
    if (stateRef.current?.dungeon?.nearby_loot) {
      return { command: "loot", status: "Auto: looting" };
    }

    const direction = nextAutoExploreDirection();
    return direction
      ? { command: `go ${direction}`, status: "Auto: seeking descent" }
      : autoExploreLevelCompleteDecision();
  }

  function autoExploreShouldHuntBeforeDescent() {
    const currentState = stateRef.current;
    return Boolean(
      modelRef.current.continuousDescent &&
        currentState?.dungeon &&
        Number(currentState.dungeon.level || 0) >= Number(currentState.player.level || 0),
    );
  }

  function autoExploreGoalPosition() {
    const currentState = stateRef.current;
    const model = modelRef.current;
    if (model.goal === "town") {
      return currentState?.dungeon?.entrance_portal || currentState?.dungeon?.ascent;
    }
    if (model.goal === "descent") return currentState?.dungeon?.descent;

    return null;
  }

  function nextAutoExploreTargetDirection(target: Position) {
    const currentState = stateRef.current;
    const position = currentState?.dungeon?.player_position;
    if (!position) return null;

    if (modelRef.current.goal === "town" && samePosition(position, target)) {
      return nextDirectionAwayFromAutoExploreTarget(position);
    }

    const path = shortestAutoExplorePath(position, [target], { allowTransitionGoal: true });
    return path.length >= 2 ? directionBetween(position, positionFromKey(path[1])) : null;
  }

  function nextDirectionAwayFromAutoExploreTarget(position: Position) {
    const currentKey = positionKey(position);
    if (!currentKey) return null;

    return (
      AUTO_EXPLORE_DIRECTIONS.find((direction) => {
        if (modelRef.current.failedMoves.has(`${currentKey}:${direction}`)) return false;

        const step = AUTO_EXPLORE_STEPS[direction];
        const nextPosition = { x: position.x + step.x, y: position.y + step.y };
        return (
          walkableKnownPositionKey(positionKey(nextPosition)) &&
          !isLevelTransitionPosition(nextPosition)
        );
      }) || null
    );
  }

  function autoExploreShouldReturnForHealing() {
    return modelRef.current.goal === "explore" && playerNeedsHealingSupply();
  }

  function playerNeedsHealingSupply() {
    return Boolean(stateRef.current) && !playerHasHealPotion() && !playerKnowsHealingSpell();
  }

  function playerHasHealPotion() {
    return healPotionQuantity(stateRef.current) > 0;
  }

  function playerKnowsHealingSpell() {
    return Boolean(
      stateRef.current?.player.spells.some(
        (spell) => spell.kind === "healing" || spell.name === "heal",
      ),
    );
  }

  function startAutoExploreResupply(): Decision {
    modelRef.current.resupplying = true;
    prepareAutoExploreTownGoal();
    return nextAutoExploreGoalDecision();
  }

  function prepareAutoExploreTownGoal() {
    const model = modelRef.current;
    model.goal = "town";
    model.goalLevel = stateRef.current?.dungeon?.level ?? null;
    model.continueAfterDescent = false;
    model.continuousDescent = false;
    model.currentPath = [];
    model.destinationKey = null;
    model.repeatCount = 0;
  }

  function nextAutoExploreResupplyDecision(): Decision {
    const currentState = stateRef.current;
    if (!currentState) return { stopReason: "stopped" };
    if (!playerAlive(currentState)) return { stopReason: "dead" };
    if (currentState.pending?.confirmation) return { stopReason: "unsafe confirmation" };

    const healingAction = currentState.scene === "ruins" ? autoExploreHealingAction() : null;
    if (healingAction) return { command: healingAction.command, status: "Auto: healing" };

    if (currentState.battle?.active) {
      const spell = autoExploreDamageSpell();
      return {
        command: spell ? `cast ${spell.name}` : "attack",
        status: "Auto: fighting",
      };
    }

    if (currentState.scene === "ruins") {
      if (!canAutoExplore(currentState)) return { stopReason: "stopped" };
      if (!playerNeedsHealingSupply()) {
        finishAutoExploreResupply();
        return nextAutoExploreDecision();
      }

      prepareAutoExploreTownGoal();
      return nextAutoExploreGoalDecision();
    }

    if (currentState.scene === "town") {
      return { command: "go tavern", status: "Auto: resupplying" };
    }

    if (currentState.scene === "tavern") {
      const tradeCommand = autoExploreResupplyTradeCommand(currentState);
      if (tradeCommand) return { command: tradeCommand, status: "Auto: resupplying" };
      if (!autoExploreTavernHasHealPotionStock(currentState) || healPotionQuantity(currentState) <= 0) {
        return { stopReason: "target unavailable" };
      }

      return { command: "go ruins", status: "Auto: returning" };
    }

    return { command: "go town", status: "Auto: resupplying" };
  }

  function finishAutoExploreResupply() {
    const model = modelRef.current;
    model.resupplying = false;
    model.goal = "explore";
    model.goalLevel = stateRef.current?.dungeon?.level ?? null;
    model.continueAfterDescent = false;
    model.continuousDescent = false;
    model.currentPath = [];
    model.destinationKey = null;
    model.lastAction = null;
    model.lastPositionKey = null;
    model.pendingSince = null;
    model.repeatCount = 0;
    model.statusText = autoExploreGoalStatus(model.goal);
  }

  function autoExploreDamageSpell() {
    return stateRef.current?.player.spells.find(
      (spell) => spell.kind === "damage" && canAffordSpell(spell),
    );
  }

  function canAffordSpell(spell: Spell) {
    return (stateRef.current?.player.mana?.current || 0) >= (spell.mp_cost || 0);
  }

  function autoExploreHealingAction() {
    const missingHealth = autoExploreMissingHealth();
    if (!missingHealth) return null;

    return (
      autoExploreHealingOptions()
        .filter((option) => option.recovery > 0 && option.recovery <= missingHealth)
        .sort((left, right) => right.recovery - left.recovery)[0] || null
    );
  }

  function autoExploreHealingOptions() {
    const currentState = stateRef.current;
    if (!currentState) return [];

    const spellOptions = currentState.player.spells
      .filter(
        (spell) =>
          (spell.kind === "healing" || spell.name === "heal") && canAffordSpell(spell),
      )
      .map((spell) => ({
        command: `cast ${spell.name}`,
        recovery: Number(spell.recovery || 0),
      }));

    const potionOptions = currentState.player.inventory
      .filter(
        (item) =>
          item.type === "potion" &&
          item.name === "potion of heal" &&
          (item.quantity || 0) > 0 &&
          Number(item.recovery || 0) > 0,
      )
      .map((item) => ({
        command: `use ${item.name}`,
        recovery: Number(item.recovery || 0),
      }));

    return [...spellOptions, ...potionOptions];
  }

  function autoExploreMissingHealth() {
    const health = stateRef.current?.player.health;
    if (!health?.max) return false;

    return Math.max(0, Number(health.max || 0) - Number(health.current || 0));
  }

  function nextAutoExploreDirection() {
    const position = stateRef.current?.dungeon?.player_position;
    if (!position) return null;

    const frontierDirection = unexploredDirectionFrom(position);
    if (frontierDirection) return frontierDirection;

    const nextPosition = nextPositionOnAutoExplorePath(position);
    return nextPosition ? directionBetween(position, nextPosition) : null;
  }

  function nextPositionOnAutoExplorePath(position: Position) {
    const model = modelRef.current;
    const currentKey = positionKey(position);
    if (!currentKey) return null;

    while (model.currentPath[0] === currentKey) model.currentPath.shift();
    if (model.currentPath.length && walkableKnownPositionKey(model.currentPath[0])) {
      return positionFromKey(model.currentPath[0]);
    }

    const path = pathToNearestAutoExploreFrontier(position);
    if (path.length < 2) return null;

    model.currentPath = path.slice(1);
    model.destinationKey = path[path.length - 1];
    return positionFromKey(model.currentPath[0]);
  }

  function restoreAutoExploreMemory() {
    const currentState = stateRef.current;
    const currentGameId = gameIdRef.current;
    const model = modelRef.current;

    if (currentState?.scene !== "ruins") {
      forgetAutoExploreMemory(currentGameId);
      clearAutoExploreKnowledge();
      model.memoryGameId = currentGameId;
      return;
    }

    if (!currentGameId) return;

    if (model.memoryGameId !== currentGameId) {
      clearAutoExploreKnowledge();
      model.memoryGameId = currentGameId;
    }

    if (model.knownLevel === currentState.dungeon?.level) return;

    const key = autoExploreMemoryKey(currentGameId);
    if (!key) return;

    try {
      const payload = JSON.parse(window.localStorage.getItem(key) || "null") as {
        level?: number;
        cells?: Array<[string, KnownCellType]>;
        visited?: string[];
        failedMoves?: string[];
      } | null;
      if (!payload || payload.level !== currentState.dungeon?.level) return;

      clearAutoExploreKnowledge();
      model.knownLevel = payload.level ?? null;
      (payload.cells || []).forEach(([cellKey, type]) => {
        if (typeof cellKey === "string" && ["open", "wall", "transition"].includes(type)) {
          model.knownCells.set(cellKey, type);
        }
      });
      (payload.visited || []).forEach((cellKey) => {
        if (typeof cellKey === "string") model.visited.add(cellKey);
      });
      (payload.failedMoves || []).forEach((edgeKey) => {
        if (typeof edgeKey === "string") model.failedMoves.add(edgeKey);
      });
    } catch {
      clearAutoExploreKnowledge();
    }
  }

  function updateAutoExploreKnowledge() {
    const viewport = stateRef.current?.dungeon?.viewport;
    if (!viewport?.origin) return;

    const currentState = stateRef.current;
    const model = modelRef.current;
    const level = currentState?.dungeon?.level ?? null;
    if (model.knownLevel !== level) {
      model.knownCells.clear();
      model.visited.clear();
      model.failedMoves.clear();
      model.currentPath = [];
      model.destinationKey = null;
      model.knownLevel = level;
    }

    const terrain = String(viewport.terrain || "").padEnd(viewport.width * viewport.height, "?");
    for (let y = 0; y < viewport.height; y += 1) {
      for (let x = 0; x < viewport.width; x += 1) {
        const tile = terrain[y * viewport.width + x];
        if (tile === "?") continue;

        const position = {
          x: viewport.origin.x + x,
          y: viewport.origin.y + y,
        };
        model.knownCells.set(positionKey(position) || "", tile === "#" ? "wall" : "open");
      }
    }

    (viewport.entities || []).forEach((entity) => {
      const position = {
        x: viewport.origin!.x + entity.x,
        y: viewport.origin!.y + entity.y,
      };
      const currentPlayerPosition = currentState?.dungeon?.player_position;
      const type =
        ["ascent", "descent", "portal"].includes(entity.type) &&
        !samePosition(position, currentPlayerPosition)
          ? "transition"
          : "open";
      model.knownCells.set(positionKey(position) || "", type);
    });

    saveAutoExploreMemory();
  }

  function visibleEnemyPosition() {
    const viewport = stateRef.current?.dungeon?.viewport;
    const enemy = viewportEntity("enemy");
    if (!viewport?.origin || !enemy) return null;

    return {
      x: viewport.origin.x + enemy.x,
      y: viewport.origin.y + enemy.y,
    };
  }

  function nextDirectionTowardVisibleEnemy(enemyPosition: Position) {
    const position = stateRef.current?.dungeon?.player_position;
    if (!position) return null;

    const targetPositions = AUTO_EXPLORE_DIRECTIONS.map((direction) => {
      const step = AUTO_EXPLORE_STEPS[direction];
      return { x: enemyPosition.x + step.x, y: enemyPosition.y + step.y };
    }).filter(
      (candidate) =>
        walkableKnownPositionKey(positionKey(candidate)) && !isLevelTransitionPosition(candidate),
    );

    const path = shortestAutoExplorePath(position, targetPositions);
    return path.length >= 2 ? directionBetween(position, positionFromKey(path[1])) : null;
  }

  function pathToNearestAutoExploreFrontier(start: Position) {
    return shortestAutoExplorePath(start, autoExploreFrontierPositions());
  }

  function shortestAutoExplorePath(
    start: Position,
    targets: Position[],
    options: { allowTransitionGoal?: boolean } = {},
  ) {
    let bestPath: string[] = [];

    targets.forEach((target) => {
      const path = findAutoExplorePath(start, target, options);
      if (path.length && (!bestPath.length || path.length < bestPath.length)) bestPath = path;
    });

    return bestPath;
  }

  function autoExploreFrontierPositions() {
    return Array.from(modelRef.current.knownCells.entries())
      .filter(([, type]) => type === "open")
      .map(([key]) => positionFromKey(key))
      .filter((position) => Boolean(unexploredDirectionFrom(position)));
  }

  function unexploredDirectionFrom(position: Position) {
    const currentKey = positionKey(position);
    if (!currentKey) return null;

    return (
      AUTO_EXPLORE_DIRECTIONS.find((direction) => {
        const step = AUTO_EXPLORE_STEPS[direction];
        const nextPosition = { x: position.x + step.x, y: position.y + step.y };
        if (modelRef.current.failedMoves.has(`${currentKey}:${direction}`)) return false;
        if (isLevelTransitionPosition(nextPosition)) return false;
        if (modelRef.current.knownCells.has(positionKey(nextPosition) || "")) return false;

        return isBlockExitPosition(position, direction);
      }) || null
    );
  }

  function isLevelTransitionPosition(position: Position) {
    const dungeon = stateRef.current?.dungeon;
    return (
      samePosition(position, dungeon?.ascent) ||
      samePosition(position, dungeon?.descent) ||
      samePosition(position, dungeon?.entrance_portal)
    );
  }

  function findAutoExplorePath(
    start: Position,
    goal: Position,
    options: { allowTransitionGoal?: boolean } = {},
  ) {
    const startKey = positionKey(start);
    const goalKey = positionKey(goal);
    if (
      !startKey ||
      !goalKey ||
      !walkableKnownPositionKey(startKey) ||
      !walkableAutoExploreGoalKey(goalKey, options)
    ) {
      return [];
    }

    const openSet = new Set([startKey]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map([[startKey, 0]]);
    const fScore = new Map([[startKey, manhattanDistance(start, goal)]]);

    while (openSet.size) {
      const currentKey = lowestScoreKey(openSet, fScore);
      if (currentKey === goalKey) return reconstructAutoExplorePath(cameFrom, currentKey);

      openSet.delete(currentKey);
      autoExploreNeighbors(currentKey, goalKey, options).forEach((neighborKey) => {
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

  function autoExploreNeighbors(
    key: string,
    goalKey: string | null = null,
    options: { allowTransitionGoal?: boolean } = {},
  ) {
    const position = positionFromKey(key);
    return AUTO_EXPLORE_DIRECTIONS.map((direction) => {
      const step = AUTO_EXPLORE_STEPS[direction];
      const nextPosition = { x: position.x + step.x, y: position.y + step.y };
      const nextKey = positionKey(nextPosition);
      if (!nextKey) return null;
      const walkable =
        nextKey === goalKey
          ? walkableAutoExploreGoalKey(nextKey, options)
          : walkableKnownPositionKey(nextKey);
      return blockedAutoExploreEdge(key, direction) || !walkable ? null : nextKey;
    }).filter((key): key is string => Boolean(key));
  }

  function blockedAutoExploreEdge(key: string, direction: string) {
    return modelRef.current.failedMoves.has(`${key}:${direction}`);
  }

  function walkableKnownPositionKey(key: string | null) {
    return Boolean(key && modelRef.current.knownCells.get(key) === "open");
  }

  function walkableAutoExploreGoalKey(
    key: string,
    options: { allowTransitionGoal?: boolean } = {},
  ) {
    return (
      walkableKnownPositionKey(key) ||
      Boolean(options.allowTransitionGoal && modelRef.current.knownCells.get(key) === "transition")
    );
  }

  function lowestScoreKey(keys: Set<string>, scores: Map<string, number>) {
    return Array.from(keys).reduce((bestKey, key) =>
      (scores.get(key) ?? Infinity) < (scores.get(bestKey) ?? Infinity) ? key : bestKey,
    );
  }

  function reconstructAutoExplorePath(cameFrom: Map<string, string>, currentKey: string) {
    const path = [currentKey];
    let nextKey = currentKey;
    while (cameFrom.has(nextKey)) {
      nextKey = cameFrom.get(nextKey)!;
      path.unshift(nextKey);
    }

    return path;
  }

  function manhattanDistance(left: Position, right: Position) {
    return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
  }

  function isBlockExitPosition(position: Position, direction: string) {
    const viewport = stateRef.current?.dungeon?.viewport;
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

  function positiveModulo(value: number, divisor: number) {
    return ((value % divisor) + divisor) % divisor;
  }

  function directionBetween(from: Position, to: Position) {
    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;

    if (deltaX === 1 && deltaY === 0) return "right";
    if (deltaX === -1 && deltaY === 0) return "left";
    if (deltaX === 0 && deltaY === 1) return "down";
    if (deltaX === 0 && deltaY === -1) return "up";
    return null;
  }

  function viewportEntity(type: string) {
    return (stateRef.current?.dungeon?.viewport?.entities || []).find(
      (entity) => entity.type === type,
    );
  }

  function trackAutoExploreResult() {
    const model = modelRef.current;
    const currentState = stateRef.current;
    if (!model.enabled) return;
    if (autoExploreGoalReached()) return;
    if (!currentState?.dungeon?.player_position) return;

    const currentKey = positionKey(currentState.dungeon.player_position);
    markAutoExploreVisited();
    if (!model.lastAction?.startsWith("go ") || !model.lastPositionKey) return;

    if (currentKey === model.lastPositionKey) {
      const direction = model.lastAction.slice(3);
      model.failedMoves.add(`${model.lastPositionKey}:${direction}`);
      saveAutoExploreMemory();
      model.repeatCount += 1;
      model.currentPath = [];
      model.destinationKey = null;
      if (model.repeatCount >= AUTO_EXPLORE_REPEAT_LIMIT) stopModel("level complete");
      return;
    }

    model.repeatCount = 0;
    model.currentPath = model.currentPath.filter((key) => key !== currentKey);
    model.lastAction = null;
    model.lastPositionKey = null;
  }

  function autoExploreGoalReached() {
    const model = modelRef.current;
    const currentState = stateRef.current;
    if (model.goal === "town" && currentState?.scene !== "ruins") {
      if (model.resupplying) {
        model.goal = "explore";
        model.goalLevel = null;
        model.currentPath = [];
        model.destinationKey = null;
        model.lastAction = null;
        model.lastPositionKey = null;
        model.pendingSince = null;
        model.repeatCount = 0;
        model.statusText = "Auto: resupplying";
        return false;
      }

      stopModel("town reached");
      return true;
    }

    if (
      model.goal === "descent" &&
      Number.isInteger(model.goalLevel) &&
      currentState?.dungeon?.level !== model.goalLevel
    ) {
      if (model.continueAfterDescent) {
        continueAutoExploreAfterDescent();
        return true;
      }

      stopModel("level descended");
      return true;
    }

    return false;
  }

  function continueAutoExploreAfterDescent() {
    const model = modelRef.current;
    const currentState = stateRef.current;
    model.goal = model.continuousDescent ? "descent" : "explore";
    model.goalLevel = currentState?.dungeon?.level ?? null;
    model.continueAfterDescent = model.continuousDescent;
    model.currentPath = [];
    model.destinationKey = null;
    model.lastAction = null;
    model.lastPositionKey = null;
    model.pendingSince = null;
    model.repeatCount = 0;
    markAutoExploreVisited();
    model.statusText = autoExploreGoalStatus(model.goal);
  }

  function markAutoExploreVisited() {
    const key = positionKey(stateRef.current?.dungeon?.player_position);
    if (!key) return;

    modelRef.current.visited.add(key);
    saveAutoExploreMemory();
  }

  function autoExploreDescentFound() {
    const key = positionKey(stateRef.current?.dungeon?.descent);
    return Boolean(key && modelRef.current.knownCells.get(key) === "transition");
  }

  function autoExploreMemoryKey(currentGameId = gameIdRef.current) {
    return currentGameId ? `${AUTO_EXPLORE_MEMORY_KEY_PREFIX}${currentGameId}` : null;
  }

  function forgetAutoExploreMemory(currentGameId = gameIdRef.current) {
    const key = autoExploreMemoryKey(currentGameId);
    if (!key) return;

    try {
      window.localStorage.removeItem(key);
    } catch {
      // localStorage can be unavailable in restricted browser contexts.
    }
  }

  function clearAutoExploreKnowledge() {
    const model = modelRef.current;
    model.knownCells.clear();
    model.visited.clear();
    model.failedMoves.clear();
    model.currentPath = [];
    model.destinationKey = null;
    model.knownLevel = null;
  }

  function saveAutoExploreMemory() {
    const key = autoExploreMemoryKey();
    const model = modelRef.current;
    if (!key || model.knownLevel === null) return;

    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          level: model.knownLevel,
          cells: Array.from(model.knownCells.entries()),
          visited: Array.from(model.visited),
          failedMoves: Array.from(model.failedMoves),
        }),
      );
    } catch {
      // localStorage can be unavailable in restricted browser contexts.
    }
  }

  useEffect(() => {
    stateRef.current = state;
    gameIdRef.current = gameId;
    connectionStatusRef.current = connectionStatus;
    restoreAutoExploreMemory();
    updateAutoExploreKnowledge();
    trackAutoExploreResult();
    scheduleAutoExplore();
    deferPublish();
  });

  useEffect(() => {
    return () => {
      if (!timerRef.current) return;

      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  return {
    ...view,
    speeds: AUTO_EXPLORE_SPEEDS,
    canRun: canAutoExplore(state),
    start,
    stop,
    setGoal,
    setSpeed,
  };
}

function canAutoExplore(state: GameState | null): state is RuinsGameState {
  return state?.scene === "ruins" && Boolean(state.dungeon?.viewport) && playerAlive(state);
}

function playerAlive(state: GameState | null) {
  return (state?.player.health.current || 0) > 0;
}

export function autoExploreResupplyTradeCommand(state: GameState): string | null {
  const sellItems = autoExploreSellableJunkItems(state);
  const healPotion = autoExploreHealPotionStock(state);
  const buyQuantity = healPotion
    ? autoExploreHealPotionBuyQuantity(state, healPotion, sellItems)
    : 0;
  const segments: string[] = [];

  if (sellItems.length) {
    segments.push(`sell=${sellItems.map(autoExploreTradeItemSegment).join("|")}`);
  }
  if (buyQuantity > 0) {
    segments.push(`buy=${AUTO_EXPLORE_HEAL_POTION_NAME}:${buyQuantity}`);
  }

  return segments.length ? `trade ${segments.join(";")}` : null;
}

function autoExploreTavernHasHealPotionStock(state: GameState) {
  return Boolean(autoExploreHealPotionStock(state));
}

function autoExploreHealPotionStock(state: GameState) {
  return (
    state.trade?.merchant_items.find(
      (item) => item.name === AUTO_EXPLORE_HEAL_POTION_NAME && item.trade_enabled !== false,
    ) || null
  );
}

function autoExploreSellableJunkItems(state: GameState) {
  return (state.trade?.player_items || []).filter(
    (item) => item.type === "junk" && item.trade_enabled && autoExploreTradeItemQuantity(item) > 0,
  );
}

function autoExploreHealPotionBuyQuantity(
  state: GameState,
  healPotion: Item,
  sellItems: Item[],
) {
  const needed = Math.max(0, AUTO_EXPLORE_TARGET_HEAL_POTIONS - healPotionQuantity(state));
  const price = Number(healPotion.buy_price ?? healPotion.price ?? 0);
  if (!needed || price <= 0) return 0;

  const sellTotal = sellItems.reduce(
    (total, item) => total + Number(item.sell_price || 0) * autoExploreTradeItemQuantity(item),
    0,
  );
  const availableGold = Number(state.player.gold || 0) + sellTotal;

  return Math.min(needed, Math.floor(availableGold / price));
}

function autoExploreTradeItemSegment(item: Item) {
  return `${item.name}:${autoExploreTradeItemQuantity(item)}`;
}

function autoExploreTradeItemQuantity(item: Item) {
  return Math.max(0, Number(item.quantity || 1));
}

function healPotionQuantity(state: GameState | null) {
  return (
    state?.player.inventory
      .filter((item) => item.type === "potion" && item.name === AUTO_EXPLORE_HEAL_POTION_NAME)
      .reduce((total, item) => total + autoExploreInventoryItemQuantity(item), 0) || 0
  );
}

function autoExploreInventoryItemQuantity(item: Item) {
  return Math.max(0, Number(item.quantity || 0));
}

function autoExploreGoalStatus(goal: AutoExploreGoal) {
  if (goal === "descent") return "Auto: going deep";
  if (goal === "town") return "Auto: going town";

  return "Auto: exploring";
}

function autoExploreStopStatus(reason: AutoExploreStopReason) {
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

function positionKey(position?: Position | null) {
  if (!position) return null;

  return `${position.x},${position.y}`;
}

function positionFromKey(key: string) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}
