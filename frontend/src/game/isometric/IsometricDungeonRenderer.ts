import type {
  DungeonDecoration,
  DungeonViewport,
  GameEvent,
  Position,
  ViewportEntity,
} from "../../lib/types";
import { animationPhaseAt, latestCombatCue, type CombatAnimationCue } from "./animation";
import {
  adventurerFacingFrame,
  isWarlordClass,
  loadIsometricAssets,
  torchAnimationLayout,
  type IsometricAssets,
  warlordAnimationLayout,
  warlordFacingFrame,
} from "./assets";
import {
  depthFor,
  easeOutCubic,
  interpolatePosition,
  projectPosition,
  TILE_HEIGHT,
  TILE_WIDTH,
  type ProjectedPoint,
} from "./projection";
import { isForegroundWall } from "./wallTopology";

const LOGICAL_WIDTH = 752;
const LOGICAL_HEIGHT = 416;
const PLAYER_MOVE_MS = 260;
const CAMERA_MOVE_MS = 440;
const TRANSIENT_MS = 1_400;
const DESKTOP_FRAME_INTERVAL_MS = 1_000 / 60;
const MOBILE_FRAME_INTERVAL_MS = 1_000 / 30;
const ACTOR_SOURCE_WIDTH = 96;
const ACTOR_SOURCE_HEIGHT = 128;
const ACTOR_DRAW_WIDTH = 72;
const ACTOR_DRAW_HEIGHT = 96;
const ACTOR_SCALE = ACTOR_DRAW_HEIGHT / ACTOR_SOURCE_HEIGHT;

type RendererOptions = {
  playerClass?: string;
  playerDirection?: string;
  playerDead?: boolean;
  reducedMotion?: boolean;
};

type PositionedEntity = ViewportEntity & Position;

type TransientEntity = PositionedEntity & {
  expiresAt: number;
};

type CombatState = CombatAnimationCue & {
  startedAt: number;
};

type DepthNode = {
  position: Position;
  layer: number;
  draw: (screen: ProjectedPoint) => void;
};

export class IsometricDungeonRenderer {
  private readonly context: CanvasRenderingContext2D;
  private assets: IsometricAssets | null = null;
  private viewport: DungeonViewport | null = null;
  private options: RendererOptions = {};
  private frameRequest: number | null = null;
  private lastFrameTime = 0;
  private playerFrom: Position | null = null;
  private playerTo: Position | null = null;
  private cameraFrom: Position | null = null;
  private cameraTo: Position | null = null;
  private movementStartedAt = 0;
  private combat: CombatState | null = null;
  private vanishedEnemies: TransientEntity[] = [];
  private openedLoot: TransientEntity[] = [];
  private readonly fallbackEnemies = new Map<string, HTMLImageElement>();

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable.");

    this.context = context;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(LOGICAL_WIDTH * pixelRatio);
    canvas.height = Math.round(LOGICAL_HEIGHT * pixelRatio);
    canvas.dataset.logicalWidth = String(LOGICAL_WIDTH);
    canvas.dataset.logicalHeight = String(LOGICAL_HEIGHT);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = false;
  }

  async load(): Promise<void> {
    this.assets = await loadIsometricAssets();
    this.requestFrame();
  }

  render(viewport: DungeonViewport, options: RendererOptions = {}): void {
    const now = performance.now();
    const previousPlayer = this.viewport ? playerPosition(this.viewport) : null;
    const nextPlayer = playerPosition(viewport);

    this.captureTransientEntities(this.viewport, viewport, now);
    this.viewport = viewport;
    this.options = options;

    if (nextPlayer) {
      this.playerFrom = previousPlayer ?? nextPlayer;
      this.playerTo = nextPlayer;
      this.cameraFrom = this.cameraTo ?? previousPlayer ?? nextPlayer;
      this.cameraTo = nextPlayer;
      this.movementStartedAt = now;
    }

    this.requestFrame();
  }

  play(events: GameEvent[]): void {
    const cue = latestCombatCue(events);
    this.combat = cue ? { ...cue, startedAt: performance.now() } : null;
    this.requestFrame();
  }

  destroy(): void {
    if (this.frameRequest !== null) cancelAnimationFrame(this.frameRequest);
    this.frameRequest = null;
  }

  private requestFrame(): void {
    if (!this.assets || this.frameRequest !== null) return;
    this.frameRequest = requestAnimationFrame((time) => {
      this.frameRequest = null;
      this.draw(time);
    });
  }

  private draw(time: number): void {
    if (!this.assets || !this.viewport) return;
    const frameInterval = window.innerWidth <= 700
      ? MOBILE_FRAME_INTERVAL_MS
      : DESKTOP_FRAME_INTERVAL_MS;
    if (this.lastFrameTime && time - this.lastFrameTime < frameInterval) {
      this.requestFrame();
      return;
    }

    this.lastFrameTime = time;
    this.context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.context.imageSmoothingEnabled = false;

    const camera = this.cameraPosition(time);
    this.drawTerrain(camera);
    this.drawLightPools(camera, time);
    this.drawDepthLayer(camera, time);
    this.drawCombatEffect(camera, time);

    this.vanishedEnemies = this.vanishedEnemies.filter((entity) => entity.expiresAt > time);
    this.openedLoot = this.openedLoot.filter((entity) => entity.expiresAt > time);
    if (this.shouldAnimate(time)) this.requestFrame();
  }

  private drawTerrain(camera: Position): void {
    if (!this.assets || !this.viewport) return;

    for (let y = 0; y < this.viewport.height; y += 1) {
      for (let x = 0; x < this.viewport.width; x += 1) {
        const terrain = terrainAt(this.viewport, x, y);
        if (terrain !== "." && terrain !== "#") continue;

        const position = globalPosition(this.viewport, { x, y });
        const screen = this.screenPosition(position, camera);
        this.context.drawImage(
          this.assets.floor,
          Math.round(screen.x - TILE_WIDTH / 2),
          Math.round(screen.y),
        );
      }
    }
  }

  private drawLightPools(camera: Position, time: number): void {
    if (!this.assets || !this.viewport) return;
    const pulse = this.options.reducedMotion ? 0.38 : 0.34 + Math.sin(time / 230) * 0.05;

    this.context.save();
    this.context.globalCompositeOperation = "lighter";
    this.context.globalAlpha = pulse;
    this.viewport.decorations
      ?.filter((decoration) => decoration.kind === "torch")
      .forEach((decoration) => {
        const position = globalPosition(this.viewport!, decoration);
        const screen = this.screenPosition({ x: position.x, y: position.y + 0.8 }, camera);
        this.context.drawImage(this.assets!.lightPool, screen.x - 64, screen.y - 22);
      });
    this.context.restore();
  }

  private drawDepthLayer(camera: Position, time: number): void {
    if (!this.assets || !this.viewport) return;
    const nodes: DepthNode[] = [];

    for (let y = 0; y < this.viewport.height; y += 1) {
      for (let x = 0; x < this.viewport.width; x += 1) {
        if (terrainAt(this.viewport, x, y) !== "#") continue;
        const position = globalPosition(this.viewport, { x, y });
        const foreground = isForegroundWall(
          this.viewport.terrain,
          this.viewport.width,
          this.viewport.height,
          x,
          y,
        );
        nodes.push({
          position,
          layer: 0,
          draw: (screen) => {
            const foot = screen.y + TILE_HEIGHT;
            const wall = foreground ? this.assets!.wallFront : this.assets!.wall;
            this.context.drawImage(
              wall,
              Math.round(screen.x - 32),
              Math.round(foot - wall.height),
            );
          },
        });
      }
    }

    this.viewport.decorations?.forEach((decoration) => {
      const position = globalPosition(this.viewport!, decoration);
      nodes.push(this.decorationNode(decoration, position, time));
    });

    positionedEntities(this.viewport).forEach((entity) => {
      const position = entity.type === "player" ? this.animatedPlayerPosition(time) ?? entity : entity;
      nodes.push(this.entityNode(entity, position, time));
    });

    this.vanishedEnemies.forEach((entity) => {
      nodes.push(this.actorNode(entity, entity, 3));
    });
    this.openedLoot.forEach((entity) => {
      nodes.push(this.chestNode(entity, 3));
    });

    nodes
      .sort((left, right) => depthFor(left.position, left.layer) - depthFor(right.position, right.layer))
      .forEach((node) => node.draw(this.screenPosition(node.position, camera)));
  }

  private decorationNode(decoration: DungeonDecoration, position: Position, time: number): DepthNode {
    if (decoration.kind === "torch") {
      const frame = this.options.reducedMotion
        ? 0
        : Math.floor(time / 150) % torchAnimationLayout.frameCount;
      const scaleX = torchAnimationLayout.drawWidth / torchAnimationLayout.frameWidth;
      const scaleY = torchAnimationLayout.drawHeight / torchAnimationLayout.frameHeight;
      return {
        position,
        layer: 35,
        draw: (screen) => this.drawSheetFrame(
          this.assets!.torch,
          frame,
          torchAnimationLayout.frameWidth,
          torchAnimationLayout.frameHeight,
          screen.x - torchAnimationLayout.anchor.x * scaleX,
          screen.y + TILE_HEIGHT - 1 - torchAnimationLayout.anchor.y * scaleY,
          torchAnimationLayout.drawWidth,
          torchAnimationLayout.drawHeight,
        ),
      };
    }

    if (decoration.kind === "barrel") {
      return {
        position,
        layer: 14,
        draw: (screen) => this.context.drawImage(
          this.assets!.barrel,
          Math.round(screen.x - 24),
          Math.round(screen.y - 27),
          48,
          48,
        ),
      };
    }

    if (decoration.kind === "rubble") {
      return {
        position,
        layer: 8,
        draw: (screen) => this.context.drawImage(
          this.assets!.rubble,
          Math.round(screen.x - 32),
          Math.round(screen.y - 34),
        ),
      };
    }

    if (decoration.kind === "banner") {
      return {
        position,
        layer: 36,
        draw: (screen) => this.context.drawImage(
          this.assets!.banner,
          Math.round(screen.x - 24),
          Math.round(screen.y - 60),
          48,
          72,
        ),
      };
    }

    return this.chestNode(position, 0);
  }

  private entityNode(entity: PositionedEntity, position: Position, time: number): DepthNode {
    if (entity.type === "player") {
      if (!this.options.playerDead && isWarlordClass(this.options.playerClass)) {
        return this.warlordNode(position, time);
      }

      const frame = this.options.playerDead ? 3 : this.combatFrame("player", time);
      return this.actorNode(entity, position, frame);
    }

    if (entity.type === "enemy") {
      return this.actorNode(entity, position, this.combatFrame("enemy", time));
    }

    if (entity.type === "loot") return this.chestNode(position, 2);

    return {
      position,
      layer: 6,
      draw: (screen) => this.drawMarker(entity.type, screen),
    };
  }

  private warlordNode(position: Position, time: number): DepthNode {
    const attackPhase = this.warlordAttackPhase(time);
    const phase = attackPhase ?? this.warlordWalkPhase(time);
    const sheet = attackPhase === null ? this.assets!.warlordWalk : this.assets!.warlordAttack;
    const direction = warlordFacingFrame(this.options.playerDirection);

    return {
      position,
      layer: 20,
      draw: (screen) => {
        const foot = screen.y + TILE_HEIGHT;
        this.drawSheetCell(
          sheet,
          direction,
          phase,
          warlordAnimationLayout.frameWidth,
          warlordAnimationLayout.frameHeight,
          screen.x - ACTOR_DRAW_WIDTH / 2,
          foot - warlordAnimationLayout.baseline * ACTOR_SCALE,
          ACTOR_DRAW_WIDTH,
          ACTOR_DRAW_HEIGHT,
        );
      },
    };
  }

  private actorNode(
    entity: PositionedEntity,
    position: Position,
    frame: number,
  ): DepthNode {
    return {
      position,
      layer: 20,
      draw: (screen) => {
        const useDirectionalPlayerFrame = entity.type === "player" && frame === 0;
        const sheet = useDirectionalPlayerFrame
          ? this.assets!.adventurerFacings
          : entity.type === "player"
            ? this.assets!.adventurer
            : this.enemySheet(entity);
        const sheetFrame = useDirectionalPlayerFrame
          ? adventurerFacingFrame(this.options.playerDirection)
          : frame;
        const bob = frame === 0 && !this.options.reducedMotion ? Math.round(Math.sin(this.lastFrameTime / 280)) : 0;
        if (sheet) {
          const foot = screen.y + TILE_HEIGHT;
          const baseline = this.actorBaseline(entity);
          this.drawSheetFrame(
            sheet,
            sheetFrame,
            ACTOR_SOURCE_WIDTH,
            ACTOR_SOURCE_HEIGHT,
            screen.x - ACTOR_DRAW_WIDTH / 2,
            foot - baseline * ACTOR_SCALE + bob,
            ACTOR_DRAW_WIDTH,
            ACTOR_DRAW_HEIGHT,
          );
          return;
        }

        this.drawFallbackEnemy(entity, screen);
      },
    };
  }

  private chestNode(position: Position, frame: number): DepthNode {
    return {
      position,
      layer: 12,
      draw: (screen) => this.drawSheetFrame(this.assets!.chest, frame, 64, 64, screen.x - 32, screen.y - 44),
    };
  }

  private actorBaseline(entity: PositionedEntity): number {
    if (entity.type === "player") return 92;
    const creatureId = entity.creature_id ?? "";
    if (creatureId.includes("skeleton")) return 107;
    if (creatureId.includes("goblin")) return 101;
    return 96;
  }

  private enemySheet(entity: PositionedEntity): HTMLImageElement | null {
    const creatureId = entity.creature_id ?? "";
    if (creatureId.includes("skeleton")) return this.assets!.skeleton;
    if (creatureId.includes("goblin")) return this.assets!.goblin;
    return null;
  }

  private drawFallbackEnemy(entity: PositionedEntity, screen: ProjectedPoint): void {
    const creatureId = entity.creature_id;
    if (!creatureId) return;

    let image = this.fallbackEnemies.get(creatureId);
    if (!image) {
      image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => this.requestFrame(), { once: true });
      image.src = `/assets/enemies/sprites/${encodeURIComponent(creatureId)}.png`;
      this.fallbackEnemies.set(creatureId, image);
    }
    if (!image.complete || image.naturalWidth === 0) return;

    this.context.drawImage(image, screen.x - 32, screen.y - 48, 64, 64);
  }

  private drawMarker(type: string, screen: ProjectedPoint): void {
    if (type === "portal") {
      this.context.drawImage(this.assets!.portal, screen.x - 32, screen.y - 88);
      return;
    }
    if (type === "ascent" || type === "descent") {
      this.context.drawImage(this.assets!.stairsDown, screen.x - 32, screen.y - 48);
    }
  }

  private drawCombatEffect(camera: Position, time: number): void {
    if (!this.assets || !this.viewport || !this.combat) return;
    const progress = (time - this.combat.startedAt) / this.combat.durationMs;
    if (progress < 0 || progress >= 1) return;

    const player = playerPosition(this.viewport);
    const enemy = positionedEntities(this.viewport).find((entity) => entity.type === "enemy");
    if (!player || !enemy) return;

    const playerScreen = this.screenPosition(this.animatedPlayerPosition(time) ?? player, camera);
    const enemyScreen = this.screenPosition(enemy, camera);
    const center = {
      x: (playerScreen.x + enemyScreen.x) / 2,
      y: (playerScreen.y + enemyScreen.y) / 2 - 34,
    };
    const frame = Math.min(3, Math.floor(progress * 4));
    const sheet = this.combat.effect === "magic" ? this.assets.magic : this.assets.slash;

    this.context.save();
    this.context.globalCompositeOperation = "lighter";
    this.drawSheetFrame(sheet, frame, 64, 96, center.x - 32, center.y - 48);
    this.context.restore();
  }

  private drawSheetFrame(
    sheet: HTMLImageElement,
    frame: number,
    frameWidth: number,
    frameHeight: number,
    x: number,
    y: number,
    drawWidth = frameWidth,
    drawHeight = frameHeight,
  ): void {
    this.drawSheetCell(
      sheet,
      frame,
      0,
      frameWidth,
      frameHeight,
      x,
      y,
      drawWidth,
      drawHeight,
    );
  }

  private drawSheetCell(
    sheet: HTMLImageElement,
    column: number,
    row: number,
    frameWidth: number,
    frameHeight: number,
    x: number,
    y: number,
    drawWidth = frameWidth,
    drawHeight = frameHeight,
  ): void {
    const columns = Math.max(1, Math.floor(sheet.naturalWidth / frameWidth));
    const rows = Math.max(1, Math.floor(sheet.naturalHeight / frameHeight));
    const sourceColumn = Math.max(0, Math.min(columns - 1, column));
    const sourceRow = Math.max(0, Math.min(rows - 1, row));

    this.context.drawImage(
      sheet,
      sourceColumn * frameWidth,
      sourceRow * frameHeight,
      frameWidth,
      frameHeight,
      Math.round(x),
      Math.round(y),
      drawWidth,
      drawHeight,
    );
  }

  private warlordAttackPhase(time: number): number | null {
    if (!this.combat || this.combat.actor !== "player") return null;
    const progress = (time - this.combat.startedAt) / this.combat.durationMs;
    if (progress < 0 || progress >= 1) return null;
    if (this.options.reducedMotion) return 1;
    return animationPhaseAt(progress, warlordAnimationLayout.phaseCount);
  }

  private warlordWalkPhase(time: number): number {
    if (this.options.reducedMotion || !this.playerFrom || !this.playerTo) {
      return warlordAnimationLayout.idlePhase;
    }
    if (this.playerFrom.x === this.playerTo.x && this.playerFrom.y === this.playerTo.y) {
      return warlordAnimationLayout.idlePhase;
    }

    const progress = (time - this.movementStartedAt) / PLAYER_MOVE_MS;
    if (progress < 0 || progress >= 1) return warlordAnimationLayout.idlePhase;
    return animationPhaseAt(progress, warlordAnimationLayout.phaseCount);
  }

  private combatFrame(actor: "player" | "enemy", time: number): number {
    if (!this.combat || this.combat.actor !== actor) return 0;
    const progress = (time - this.combat.startedAt) / this.combat.durationMs;
    if (progress < 0 || progress >= 1) return 0;
    return progress < 0.68 ? 1 : 0;
  }

  private screenPosition(position: Position, camera: Position): ProjectedPoint {
    const world = projectPosition(position);
    const cameraPoint = projectPosition(camera);
    return {
      x: LOGICAL_WIDTH / 2 + world.x - cameraPoint.x,
      y: LOGICAL_HEIGHT / 2 + 42 + world.y - cameraPoint.y,
    };
  }

  private animatedPlayerPosition(time: number): Position | null {
    if (!this.playerFrom || !this.playerTo) return this.playerTo;
    if (this.options.reducedMotion) return this.playerTo;
    const progress = easeOutCubic((time - this.movementStartedAt) / PLAYER_MOVE_MS);
    return interpolatePosition(this.playerFrom, this.playerTo, progress);
  }

  private cameraPosition(time: number): Position {
    const target = this.cameraTo ?? this.playerTo ?? { x: 0, y: 0 };
    if (!this.cameraFrom || this.options.reducedMotion) return target;
    const progress = easeOutCubic((time - this.movementStartedAt) / CAMERA_MOVE_MS);
    return interpolatePosition(this.cameraFrom, target, progress);
  }

  private shouldAnimate(time: number): boolean {
    if (!this.options.reducedMotion) return true;
    if (this.combat && time < this.combat.startedAt + this.combat.durationMs) return true;
    return this.vanishedEnemies.length > 0 || this.openedLoot.length > 0;
  }

  private captureTransientEntities(
    previous: DungeonViewport | null,
    next: DungeonViewport,
    now: number,
  ): void {
    if (!previous) return;
    const nextKeys = new Set(positionedEntities(next).map(entityKey));

    positionedEntities(previous).forEach((entity) => {
      if (nextKeys.has(entityKey(entity))) return;
      if (entity.type === "enemy") this.vanishedEnemies.push({ ...entity, expiresAt: now + TRANSIENT_MS });
      if (entity.type === "loot") this.openedLoot.push({ ...entity, expiresAt: now + TRANSIENT_MS });
    });
  }
}

function terrainAt(viewport: DungeonViewport, x: number, y: number): string {
  return viewport.terrain?.[y * viewport.width + x] ?? "?";
}

function globalPosition(viewport: DungeonViewport, position: Position): Position {
  return {
    x: (viewport.origin?.x ?? 0) + position.x,
    y: (viewport.origin?.y ?? 0) + position.y,
  };
}

function positionedEntities(viewport: DungeonViewport): PositionedEntity[] {
  return (viewport.entities ?? []).map((entity) => ({
    ...entity,
    ...globalPosition(viewport, entity),
  }));
}

function playerPosition(viewport: DungeonViewport): Position | null {
  return positionedEntities(viewport).find((entity) => entity.type === "player") ?? null;
}

function entityKey(entity: PositionedEntity): string {
  return `${entity.type}:${entity.x}:${entity.y}:${entity.creature_id ?? ""}`;
}
