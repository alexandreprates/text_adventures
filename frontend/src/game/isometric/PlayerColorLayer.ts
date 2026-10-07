type Sprite = {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
};

// Keep only the visible player pixels in a small, reusable device-resolution layer.
export class PlayerColorLayer {
  private context: CanvasRenderingContext2D | null = null;
  private bounds: { x: number; y: number; width: number; height: number } | null = null;
  private deviceX = 0;
  private deviceY = 0;

  reset(): void {
    this.bounds = null;
  }

  capture(scene: CanvasRenderingContext2D, sprite: Sprite): void {
    if (!this.context) this.context = document.createElement("canvas").getContext("2d");
    const context = this.context;
    if (!context) return;

    const scale = scene.getTransform().a;
    this.deviceX = Math.floor(sprite.x * scale);
    this.deviceY = Math.floor(sprite.y * scale);
    const width = Math.ceil((sprite.x + sprite.width) * scale) - this.deviceX;
    const height = Math.ceil((sprite.y + sprite.height) * scale) - this.deviceY;
    if (context.canvas.width !== width) context.canvas.width = width;
    if (context.canvas.height !== height) context.canvas.height = height;
    context.resetTransform();
    context.clearRect(0, 0, width, height);
    context.setTransform(scale, 0, 0, scale, -this.deviceX, -this.deviceY);
    context.imageSmoothingEnabled = false;
    context.globalCompositeOperation = "source-over";
    this.bounds = sprite;
    this.draw(sprite);
    context.globalCompositeOperation = "destination-out";
  }

  occlude(sprite: Sprite, translucent = false): void {
    const bounds = this.bounds;
    if (!bounds || sprite.x >= bounds.x + bounds.width || sprite.y >= bounds.y + bounds.height
      || sprite.x + sprite.width <= bounds.x || sprite.y + sprite.height <= bounds.y) return;
    // Legacy fallback art has soft alpha. Retain normal scene lighting for this
    // frame rather than blending those translucent edges over the player twice.
    if (translucent) {
      this.reset();
      return;
    }
    // Foreground artwork erases its covered pixels, preserving the scene's depth order.
    this.draw(sprite);
  }

  composite(scene: CanvasRenderingContext2D): void {
    if (!this.bounds || !this.context) return;
    scene.save();
    scene.resetTransform();
    scene.drawImage(this.context.canvas, this.deviceX, this.deviceY);
    scene.restore();
  }

  private draw(sprite: Sprite): void {
    this.context!.drawImage(sprite.image,
      sprite.sourceX, sprite.sourceY, sprite.sourceWidth, sprite.sourceHeight,
      sprite.x, sprite.y, sprite.width, sprite.height);
  }
}
