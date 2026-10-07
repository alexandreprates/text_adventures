import type { Position } from "./types";

export type KnownCellType = "open" | "wall" | "transition";
const steps = [
  ["up", 0, -1], ["right", 1, 0], ["down", 0, 1], ["left", -1, 0],
] as const;

export function cellKey(position: Position): string {
  return `${position.x},${position.y}`;
}

function coordinates(key: string): Position {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

/** The frontier index only revisits cells affected by new terrain or blocked edges. */
export class AutoExploreMap {
  readonly cells = new Map<string, KnownCellType>();
  readonly failedMoves = new Set<string>();
  readonly frontiers = new Set<string>();
  revision = 0;
  private readonly ranks = new Map<string, number>();
  private transitions = new Set<string>();
  private blockWidth = 6;
  private blockHeight = 5;

  configure(width: number, height: number, transitions: Position[]): void {
    const next = new Set(transitions.map(cellKey));
    const resized = width !== this.blockWidth || height !== this.blockHeight;
    this.blockWidth = width;
    this.blockHeight = height;
    const changed = [...this.transitions, ...next].filter((key) => this.transitions.has(key) !== next.has(key));
    this.transitions = next;
    if (resized) this.cells.forEach((_, key) => this.refresh(key));
    else changed.forEach((key) => this.refreshAround(key));
  }

  setCell(key: string, type: KnownCellType): void {
    if (this.cells.get(key) === type) return;
    if (!this.cells.has(key)) this.ranks.set(key, this.cells.size);
    this.cells.set(key, type);
    this.revision++;
    this.refreshAround(key);
  }

  blockEdge(edge: string): void {
    if (this.failedMoves.has(edge)) return;
    this.failedMoves.add(edge);
    this.revision++;
    this.refresh(edge.split(":")[0]);
  }

  clear(): void {
    if (this.cells.size || this.failedMoves.size) this.revision++;
    this.cells.clear();
    this.failedMoves.clear();
    this.frontiers.clear();
    this.ranks.clear();
    this.transitions.clear();
  }

  unexploredDirection(position: Position): string | null {
    const key = cellKey(position);
    if (this.blockWidth <= 0 || this.blockHeight <= 0) return null;
    const localX = ((position.x % this.blockWidth) + this.blockWidth) % this.blockWidth;
    const localY = ((position.y % this.blockHeight) + this.blockHeight) % this.blockHeight;
    for (const [direction, dx, dy] of steps) {
      const next = `${position.x + dx},${position.y + dy}`;
      if (this.failedMoves.has(`${key}:${direction}`) || this.transitions.has(next) || this.cells.has(next)) continue;
      if ((direction === "up" && localY === 0) || (direction === "down" && localY === this.blockHeight - 1) ||
          (direction === "left" && localX === 0) || (direction === "right" && localX === this.blockWidth - 1)) return direction;
    }
    return null;
  }

  nearestFrontier(start: Position): string[] {
    return this.pathTo(start, this.frontierTargets());
  }

  frontierTargets(): string[] {
    return [...this.frontiers].sort((a, b) => this.ranks.get(a)! - this.ranks.get(b)!);
  }

  pathTo(start: Position, targets: Iterable<string>, allowTransitionGoal = false): string[] {
    return nearestExplorationPath(cellKey(start), targets, this.cells, this.failedMoves, allowTransitionGoal);
  }

  private refreshAround(key: string): void {
    this.refresh(key);
    const { x, y } = coordinates(key);
    for (const [, dx, dy] of steps) this.refresh(`${x + dx},${y + dy}`);
  }

  private refresh(key: string): void {
    if (this.cells.get(key) === "open" && this.unexploredDirection(coordinates(key))) this.frontiers.add(key);
    else this.frontiers.delete(key);
  }
}

/** One traversal for all targets; target order breaks equal-distance ties. */
export function nearestExplorationPath(
  start: string,
  targets: Iterable<string>,
  cells: ReadonlyMap<string, KnownCellType>,
  failedMoves: ReadonlySet<string>,
  allowTransitionGoal = false,
): string[] {
  const search = explorationPathSteps(start, targets, cells, failedMoves, allowTransitionGoal);
  let result = search.next();
  while (!result.done) result = search.next();
  return result.value;
}

/** Yield at bounded intervals so callers can schedule long searches between frames. */
export function* explorationPathSteps(
  start: string,
  targets: Iterable<string>,
  cells: ReadonlyMap<string, KnownCellType>,
  failedMoves: ReadonlySet<string>,
  allowTransitionGoal = false,
): Generator<void, string[]> {
  if (cells.get(start) !== "open") return [];
  const priorities = new Map<string, number>();
  for (const key of targets) {
    if (cells.get(key) === "open" || (allowTransitionGoal && cells.get(key) === "transition")) {
      if (!priorities.has(key)) priorities.set(key, priorities.size);
    }
  }
  if (!priorities.size) return [];
  const queue = [start];
  const parents = new Map<string, string | null>([[start, null]]);
  let head = 0;
  while (head < queue.length) {
    const end = queue.length;
    let best: string | null = null;
    for (let index = head; index < end; index++) {
      const key = queue[index];
      if (priorities.has(key) && (best === null || priorities.get(key)! < priorities.get(best)!)) best = key;
    }
    if (best !== null) {
      const path: string[] = [];
      for (let key: string | null = best; key !== null; key = parents.get(key)!) path.push(key);
      return path.reverse();
    }
    while (head < end) {
      const key = queue[head++];
      const { x, y } = coordinates(key);
      for (const [direction, dx, dy] of steps) {
        const next = `${x + dx},${y + dy}`;
        if (parents.has(next) || failedMoves.has(`${key}:${direction}`)) continue;
        const type = cells.get(next);
        if (type !== "open" && !(allowTransitionGoal && type === "transition" && priorities.has(next))) continue;
        parents.set(next, key);
        queue.push(next);
      }
      if (head % 64 === 0) yield;
    }
  }
  return [];
}
