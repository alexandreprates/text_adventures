import { useEffect, useRef } from "react";

const stageSize = {
  width: 1280,
  height: 720,
};

const palette = {
  skyTop: "#182d3d",
  skyBottom: "#081016",
  farStone: "#183141",
  midStone: "#244b45",
  platformTop: "#7a9a64",
  platformSide: "#35513b",
  platformDeep: "#1f302a",
  line: "#12201d",
  moss: "#b7d66b",
  gold: "#f5c85a",
  danger: "#e65454",
  health: "#f15b5b",
  mana: "#6fb7ff",
  stamina: "#8be071",
  magic: "#b48cff",
  playerCape: "#d74245",
  playerArmor: "#d9e6dc",
  playerBoots: "#352724",
  enemy: "#b94256",
  fog: "rgba(5, 9, 12, 0.54)",
  highlight: "rgba(245, 200, 90, 0.26)",
};

export function PlatformerFrontendMockup() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const density = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = stageSize.width * density;
    canvas.height = stageSize.height * density;
    context.setTransform(density, 0, 0, density, 0, 0);
    drawPlatformStage(context);
  }, []);

  return (
    <div className="platform-mockup-shell">
      <header className="platform-top-hud" aria-label="Game status">
        <button className="platform-brand" type="button">
          Text Adventures
        </button>
        <div className="platform-location-chip" aria-label="Current location">
          <span>Ruins L1</span>
          <strong>Descent Gate</strong>
        </div>
        <div className="platform-meter-group" aria-label="Resources">
          <Meter label="HP" value="24/30" kind="health" />
          <Meter label="MP" value="09/12" kind="mana" />
          <Meter label="XP" value="68%" kind="stamina" />
        </div>
        <div className="platform-pocket" aria-label="Wallet">
          <span>Gold</span>
          <strong>128</strong>
        </div>
      </header>

      <main className="platform-playfield" aria-label="Platform-style game screen">
        <canvas
          ref={canvasRef}
          className="platform-game-canvas"
          width={stageSize.width}
          height={stageSize.height}
          aria-label="Large platform-style dungeon canvas"
        />

        <div className="platform-level-badge" aria-label="Dungeon depth">
          <span>Floor</span>
          <strong>01</strong>
        </div>

        <section className="platform-encounter-panel" aria-label="Enemy status">
          <div>
            <span>Enemy</span>
            <strong>Gate Warden</strong>
          </div>
          <div className="platform-meter-track">
            <i className="platform-meter-fill platform-meter-danger" />
          </div>
        </section>

        <aside className="platform-loadout-rail" aria-label="Loadout">
          <button type="button" aria-label="Inventory">
            INV
          </button>
          <button type="button" aria-label="Spellbook">
            SPL
          </button>
          <button type="button" aria-label="Equipment">
            EQP
          </button>
        </aside>

        <section className="platform-minimap" aria-label="Known rooms">
          {Array.from({ length: 9 }, (_value, index) => (
            <span
              className={[
                "platform-minimap-cell",
                index === 4 ? "current" : "",
                index === 8 ? "goal" : "",
              ].join(" ")}
              key={index}
            />
          ))}
        </section>

        <nav className="platform-action-dock" aria-label="Actions">
          <div className="platform-dpad" aria-label="Movement">
            <button type="button" aria-label="Move up">
              ^
            </button>
            <button type="button" aria-label="Move left">
              &lt;
            </button>
            <button type="button" aria-label="Move right">
              &gt;
            </button>
            <button type="button" aria-label="Move down">
              v
            </button>
          </div>
          <button className="platform-action-button primary" type="button">
            Attack
          </button>
          <button className="platform-action-button" type="button">
            Loot
          </button>
          <button className="platform-action-button" type="button">
            Explore
          </button>
          <button className="platform-action-button" type="button">
            Town
          </button>
        </nav>
      </main>

      <form className="platform-command-strip" aria-label="Command input">
        <label htmlFor="platform-command-input">Command</label>
        <input id="platform-command-input" defaultValue="" placeholder="go right, attack, loot" />
        <button type="button">Send</button>
      </form>
    </div>
  );
}

function Meter({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind: "health" | "mana" | "stamina";
}) {
  return (
    <div className={`platform-meter platform-meter-${kind}`}>
      <span>{label}</span>
      <div className="platform-meter-track">
        <i className="platform-meter-fill" />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function drawPlatformStage(context: CanvasRenderingContext2D): void {
  drawBackground(context);
  drawPlatforms(context);
  drawGate(context);
  drawPickups(context);
  drawEnemy(context, 930, 438);
  drawPlayer(context, 528, 420);
  drawForeground(context);
}

function drawBackground(context: CanvasRenderingContext2D): void {
  const gradient = context.createLinearGradient(0, 0, 0, stageSize.height);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(0.58, palette.skyBottom);
  gradient.addColorStop(1, "#05080b");

  context.fillStyle = gradient;
  context.fillRect(0, 0, stageSize.width, stageSize.height);

  drawSilhouette(context, palette.farStone, 0, 430, [
    [0, 0],
    [96, -84],
    [186, -26],
    [290, -126],
    [388, -40],
    [512, -118],
    [648, -30],
    [774, -94],
    [910, -38],
    [1040, -132],
    [1160, -52],
    [1280, -108],
    [1280, 290],
    [0, 290],
  ]);

  drawSilhouette(context, palette.midStone, 0, 512, [
    [0, 0],
    [126, -76],
    [244, -24],
    [360, -104],
    [474, -18],
    [612, -92],
    [734, -22],
    [850, -114],
    [986, -28],
    [1108, -86],
    [1280, -44],
    [1280, 208],
    [0, 208],
  ]);

  context.fillStyle = "rgba(245, 200, 90, 0.18)";
  context.fillRect(0, 514, stageSize.width, 2);
  context.fillStyle = "rgba(111, 183, 255, 0.08)";
  for (let index = 0; index < 18; index += 1) {
    const x = index * 76 + (index % 3) * 10;
    context.fillRect(x, 96 + (index % 5) * 44, 22, 3);
  }
}

function drawSilhouette(
  context: CanvasRenderingContext2D,
  color: string,
  offsetX: number,
  offsetY: number,
  points: number[][],
): void {
  context.fillStyle = color;
  context.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) {
      context.moveTo(offsetX + x, offsetY + y);
    } else {
      context.lineTo(offsetX + x, offsetY + y);
    }
  });
  context.closePath();
  context.fill();
}

function drawPlatforms(context: CanvasRenderingContext2D): void {
  drawPlatform(context, 0, 596, 1280, 124);
  drawPlatform(context, 84, 480, 318, 54);
  drawPlatform(context, 468, 520, 270, 48);
  drawPlatform(context, 812, 500, 290, 52);
  drawPlatform(context, 296, 360, 228, 44);
  drawPlatform(context, 658, 334, 196, 42);
  drawPlatform(context, 1004, 342, 178, 42);

  context.strokeStyle = "rgba(183, 214, 107, 0.34)";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(686, 334);
  context.lineTo(1026, 342);
  context.stroke();

  context.fillStyle = palette.platformDeep;
  for (let index = 0; index < 7; index += 1) {
    context.fillRect(226 + index * 18, 534, 10, 62);
  }
  for (let index = 0; index < 5; index += 1) {
    context.fillRect(900 + index * 18, 552, 10, 44);
  }
}

function drawPlatform(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  context.fillStyle = palette.platformTop;
  context.fillRect(x, y, width, 12);
  context.fillStyle = palette.moss;
  context.fillRect(x, y, width, 4);
  context.fillStyle = palette.platformSide;
  context.fillRect(x, y + 12, width, height - 12);
  context.fillStyle = palette.platformDeep;
  context.fillRect(x, y + height - 16, width, 16);

  context.strokeStyle = palette.line;
  context.lineWidth = 2;
  for (let tileX = x; tileX < x + width; tileX += 48) {
    context.strokeRect(tileX, y + 12, Math.min(48, x + width - tileX), height - 12);
  }
}

function drawGate(context: CanvasRenderingContext2D): void {
  context.fillStyle = "rgba(180, 140, 255, 0.16)";
  context.fillRect(1036, 214, 100, 128);
  context.fillStyle = palette.magic;
  context.fillRect(1056, 238, 60, 92);
  context.fillStyle = "#170f24";
  context.fillRect(1068, 252, 36, 78);
  context.fillStyle = "rgba(245, 200, 90, 0.72)";
  context.fillRect(1078, 224, 16, 18);
  context.fillRect(1044, 330, 84, 12);
}

function drawPickups(context: CanvasRenderingContext2D): void {
  drawChest(context, 154, 436);
  drawCrystal(context, 734, 290);
}

function drawChest(context: CanvasRenderingContext2D, x: number, y: number): void {
  context.fillStyle = "#7e4b2f";
  context.fillRect(x, y, 48, 28);
  context.fillStyle = palette.gold;
  context.fillRect(x + 4, y - 8, 40, 12);
  context.fillRect(x + 22, y - 8, 6, 40);
  context.fillStyle = "#332014";
  context.fillRect(x + 4, y + 10, 40, 4);
}

function drawCrystal(context: CanvasRenderingContext2D, x: number, y: number): void {
  context.fillStyle = palette.highlight;
  context.fillRect(x - 16, y - 18, 56, 74);
  context.fillStyle = palette.magic;
  context.beginPath();
  context.moveTo(x + 12, y - 16);
  context.lineTo(x + 34, y + 16);
  context.lineTo(x + 20, y + 54);
  context.lineTo(x - 6, y + 24);
  context.closePath();
  context.fill();
}

function drawEnemy(context: CanvasRenderingContext2D, x: number, y: number): void {
  context.fillStyle = "rgba(230, 84, 84, 0.18)";
  context.fillRect(x - 24, y - 52, 98, 100);
  context.fillStyle = palette.enemy;
  context.fillRect(x, y - 44, 48, 56);
  context.fillStyle = "#3a1420";
  context.fillRect(x - 10, y + 6, 68, 22);
  context.fillStyle = palette.gold;
  context.fillRect(x + 10, y - 28, 8, 8);
  context.fillRect(x + 30, y - 28, 8, 8);
}

function drawPlayer(context: CanvasRenderingContext2D, x: number, y: number): void {
  context.fillStyle = "rgba(5, 8, 11, 0.34)";
  context.fillRect(x - 28, y + 86, 98, 16);
  context.fillStyle = palette.playerCape;
  context.fillRect(x - 20, y + 8, 34, 80);
  context.fillStyle = palette.playerArmor;
  context.fillRect(x, y, 50, 72);
  context.fillStyle = "#f1c99a";
  context.fillRect(x + 12, y - 28, 28, 30);
  context.fillStyle = palette.playerBoots;
  context.fillRect(x + 4, y + 72, 16, 28);
  context.fillRect(x + 32, y + 72, 16, 28);
  context.fillStyle = palette.gold;
  context.fillRect(x + 48, y + 16, 54, 8);
  context.fillRect(x + 96, y + 8, 8, 24);
}

function drawForeground(context: CanvasRenderingContext2D): void {
  context.fillStyle = palette.fog;
  context.fillRect(0, 0, 94, stageSize.height);
  context.fillRect(stageSize.width - 102, 0, 102, stageSize.height);
  context.fillStyle = "rgba(4, 8, 10, 0.36)";
  context.fillRect(0, 672, stageSize.width, 48);
}
