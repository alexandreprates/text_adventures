import { describe, expect, it, vi } from "vitest";
import { AutoExploreMap, explorationPathSteps, nearestExplorationPath, type KnownCellType } from "./autoExploreMap";

describe("exploration routing", () => {
  it("can resume a large search without changing its shortest path", () => {
    const cells = new Map<string, KnownCellType>();
    for (let x = 0; x < 1000; x++) cells.set(`${x},0`, "open");
    const search = explorationPathSteps("0,0", ["999,0"], cells, new Set());
    let result = search.next();
    let yields = 0;
    while (!result.done) { yields++; result = search.next(); }
    expect(yields).toBe(15);
    expect(result.value).toEqual(nearestExplorationPath("0,0", ["999,0"], cells, new Set()));
  });

  const line = () => new Map<string, KnownCellType>([
    ["0,0", "open"], ["1,0", "open"], ["2,0", "open"], ["3,0", "transition"], ["4,0", "open"],
  ]);

  it("finds the closest reachable target in one traversal", () => {
    expect(nearestExplorationPath("0,0", ["4,0", "2,0", "1,0"], line(), new Set())).toEqual(["0,0", "1,0"]);
    expect(nearestExplorationPath("0,0", ["4,0"], line(), new Set())).toEqual([]);
  });

  it("keeps directed failed edges and transition goals out of ordinary paths", () => {
    const cells = line();
    expect(nearestExplorationPath("0,0", ["2,0"], cells, new Set(["1,0:right"]))).toEqual([]);
    expect(nearestExplorationPath("2,0", ["0,0"], cells, new Set(["1,0:right"]))).toEqual(["2,0", "1,0", "0,0"]);
    expect(nearestExplorationPath("0,0", ["3,0"], cells, new Set())).toEqual([]);
    expect(nearestExplorationPath("0,0", ["3,0"], cells, new Set(), true)).toEqual(["0,0", "1,0", "2,0", "3,0"]);
    expect(nearestExplorationPath("0,0", ["4,0"], cells, new Set(), true)).toEqual([]);
  });

  it("breaks equal-distance ties by target order regardless of neighbor order", () => {
    const cells = line();
    cells.set("0,1", "open");
    expect(nearestExplorationPath("0,0", ["0,1", "1,0"], cells, new Set())).toEqual(["0,0", "0,1"]);
  });

  it("bounds terrain lookups by the number of cells rather than cells times targets", () => {
    const cells = new Map<string, KnownCellType>();
    for (let x = 0; x < 1000; x++) cells.set(`${x},0`, "open");
    const targets = Array.from({ length: 100 }, (_, x) => `${x + 900},0`);
    const reads = vi.spyOn(cells, "get");
    expect(nearestExplorationPath("0,0", targets, cells, new Set()).length).toBe(901);
    expect(reads.mock.calls.length).toBeLessThan(4 * cells.size + targets.length * 2);
  });
});

describe("incremental exploration frontiers", () => {
  it("updates only affected neighbors as terrain and failed edges arrive", () => {
    const map = new AutoExploreMap();
    map.configure(3, 3, []);
    map.setCell("2,1", "open");
    expect([...map.frontiers]).toEqual(["2,1"]);
    const directions = vi.spyOn(map, "unexploredDirection");
    map.setCell("3,1", "wall");
    expect(map.frontiers.size).toBe(0);
    expect(directions.mock.calls.length).toBeLessThanOrEqual(5);
    map.setCell("2,0", "open");
    expect(map.frontiers.has("2,0")).toBe(true);
    map.blockEdge("2,0:up");
    map.blockEdge("2,0:right");
    expect(map.frontiers.has("2,0")).toBe(false);
    const revision = map.revision;
    map.setCell("3,1", "wall");
    map.blockEdge("2,0:up");
    expect(map.revision).toBe(revision);
  });

  it("handles negative block coordinates and transition changes", () => {
    const map = new AutoExploreMap();
    map.configure(3, 3, []);
    map.setCell("-1,-2", "open");
    expect(map.unexploredDirection({ x: -1, y: -2 })).toBe("right");
    map.configure(3, 3, [{ x: 0, y: -2 }]);
    expect(map.frontiers.size).toBe(0);
    map.configure(3, 3, []);
    expect(map.frontiers.has("-1,-2")).toBe(true);
    map.clear();
    expect(map.cells.size + map.frontiers.size + map.failedMoves.size).toBe(0);
  });

  it("preserves discovery order when a frontier is removed and restored", () => {
    const map = new AutoExploreMap();
    map.configure(3, 3, []);
    for (const key of ["2,1", "0,1", "1,1"]) map.setCell(key, "open");
    map.setCell("2,1", "wall");
    map.setCell("2,1", "open");
    expect(map.nearestFrontier({ x: 1, y: 1 })).toEqual(["1,1", "2,1"]);
  });
});
