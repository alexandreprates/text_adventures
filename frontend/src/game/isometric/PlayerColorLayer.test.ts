import { afterEach, describe, expect, it, vi } from "vitest";
import { PlayerColorLayer } from "./PlayerColorLayer";

afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const canvas = { width: 0, height: 0 };
  const layer = {
    canvas, resetTransform: vi.fn(), clearRect: vi.fn(), setTransform: vi.fn(),
    drawImage: vi.fn(), globalCompositeOperation: "source-over", imageSmoothingEnabled: true,
  };
  const createElement = vi.fn(() => ({ getContext: () => layer }));
  vi.stubGlobal("document", { createElement });
  const scene = {
    getTransform: () => ({ a: 1.25 }), save: vi.fn(), restore: vi.fn(),
    resetTransform: vi.fn(), drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  const sprite = {
    image: {} as HTMLImageElement, x: 12.5, y: 40.5, width: 72, height: 96,
    sourceX: 96, sourceY: 128, sourceWidth: 96, sourceHeight: 128,
  };
  return { colors: new PlayerColorLayer(), layer, scene, sprite, createElement };
}

describe("player color preservation", () => {
  it("aligns fractional device pixels and reuses a sprite-sized canvas", () => {
    const { colors, layer, scene, sprite, createElement } = fixture();
    colors.capture(scene, sprite);
    expect(layer.canvas).toEqual({ width: 91, height: 121 });
    expect(layer.setTransform).toHaveBeenCalledWith(1.25, 0, 0, 1.25, -15, -50);
    colors.composite(scene);
    expect(scene.drawImage).toHaveBeenCalledWith(layer.canvas, 15, 50);
    colors.capture(scene, sprite);
    expect(createElement).toHaveBeenCalledTimes(1);
    expect(layer.clearRect).toHaveBeenCalledTimes(2);
  });

  it("erases overlapping foreground art and skips distant objects", () => {
    const { colors, layer, scene, sprite } = fixture();
    colors.capture(scene, sprite);
    colors.occlude({ ...sprite, x: 500 });
    expect(layer.drawImage).toHaveBeenCalledTimes(1);
    colors.occlude({ ...sprite, x: 20 });
    expect(layer.globalCompositeOperation).toBe("destination-out");
    expect(layer.drawImage).toHaveBeenCalledTimes(2);
  });

  it("does not retain player pixels after a scene or frame reset", () => {
    const { colors, scene, sprite } = fixture();
    colors.capture(scene, sprite);
    colors.reset();
    colors.composite(scene);
    expect(scene.drawImage).not.toHaveBeenCalled();
  });

  it("keeps normal blending when translucent fallback art overlaps", () => {
    const { colors, scene, sprite } = fixture();
    colors.capture(scene, sprite);
    colors.occlude({ ...sprite, x: 500 }, true);
    colors.composite(scene);
    expect(scene.drawImage).toHaveBeenCalledTimes(1);
    colors.occlude(sprite, true);
    colors.composite(scene);
    expect(scene.drawImage).toHaveBeenCalledTimes(1);
  });
});
