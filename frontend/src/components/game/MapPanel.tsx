import { useEffect, useMemo, useRef } from "react";
import type { ConnectionStatus, DungeonViewport, GameEvent, GameState } from "../../lib/types";
import {
  locationArts,
  locationPanels,
  playerDefeated,
  textRowsFromViewport,
} from "../../lib/viewModels";
import { ConnectionIndicator } from "./ConnectionIndicator";

declare global {
  interface Window {
    DungeonMapRenderer?: DungeonMapRendererFactory;
  }
}

type DungeonMapRendererFactory = {
  create: (canvas: HTMLCanvasElement | null) => DungeonMapRenderer;
};

type DungeonMapRenderer = {
  render: (
    viewport: DungeonViewport,
    options?: {
      playerClass?: string;
      playerDirection?: string;
      playerDead?: boolean;
    },
  ) => boolean;
  animateAttack: (source: string, effect?: string) => boolean;
  clearAttackAnimation: () => void;
};

type MapPanelProps = {
  state: GameState | null;
  status: ConnectionStatus;
  events: GameEvent[];
  zoom: number;
  playerDirection: string;
  onZoomChange: (zoom: number) => void;
  onCommand: (command: string) => void;
};

const mapZoomMin = 0.76;
const mapZoomMax = 2.94;
const mapZoomStep = 0.12;
const dungeonMapBaseZoom = 1.18;
const locationArtBaseZoom = 1.12;
const combatFeedbackStepMs = 520;

export function MapPanel({
  state,
  status,
  events,
  zoom,
  playerDirection,
  onZoomChange,
  onCommand,
}: MapPanelProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<DungeonMapRenderer | null>(null);
  const combatTimersRef = useRef<number[]>([]);
  const dungeon = state?.scene === "ruins" ? state.dungeon : null;
  const viewport = dungeon?.viewport;
  const locationArt = state ? locationArts[state.scene] : null;
  const hasCanvasMap = Boolean(viewport);
  const hasLocationArt = Boolean(!hasCanvasMap && locationArt);
  const textRows = useMemo(() => {
    if (viewport) return textRowsFromViewport(viewport);

    return state ? locationPanels[state.scene] || [state.scene_display_name || state.scene] : ["Connecting"];
  }, [state, viewport]);

  useEffect(() => {
    if (!rendererRef.current && window.DungeonMapRenderer) {
      rendererRef.current = window.DungeonMapRenderer.create(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (!viewport || !rendererRef.current) return;

    rendererRef.current.render(viewport, {
      playerClass: state?.player.current_class,
      playerDirection,
      playerDead: playerDefeated(state),
    });
    fitCanvas(canvasRef.current, stageRef.current, zoom);
  }, [playerDirection, state, viewport, zoom]);

  useEffect(() => {
    function handleResize() {
      if (viewport) fitCanvas(canvasRef.current, stageRef.current, zoom);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewport, zoom]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    combatTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    combatTimersRef.current = [];

    const exchanges = combatExchanges(events);
    if (!exchanges.length) return;

    exchanges.forEach((exchange, index) => {
      const timer = window.setTimeout(() => {
        renderer.animateAttack(exchange.source, exchange.effect);
      }, index * combatFeedbackStepMs);
      combatTimersRef.current.push(timer);
    });

    const clearTimer = window.setTimeout(() => {
      renderer.clearAttackAnimation();
    }, exchanges.length * combatFeedbackStepMs);
    combatTimersRef.current.push(clearTimer);

    return () => {
      combatTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      combatTimersRef.current = [];
    };
  }, [events]);

  return (
    <section className="center-column" aria-label={`${state?.prompt || "Starting"} map`}>
      <section className="terminal-panel map-panel">
        <div
          ref={stageRef}
          className={[
            "map-stage",
            hasCanvasMap ? "has-canvas-map" : "",
            hasLocationArt ? "has-location-art" : "",
          ].join(" ")}
        >
          <ConnectionIndicator status={status} />
          {hasCanvasMap ? (
            <div className="map-zoom-controls" aria-label="Map zoom controls">
              <button
                className="map-zoom-button"
                type="button"
                aria-label="Zoom in"
                title="Zoom in"
                disabled={zoom >= mapZoomMax}
                onClick={() => onZoomChange(clampZoom(zoom + mapZoomStep))}
              >
                +
              </button>
              <button
                className="map-zoom-button"
                type="button"
                aria-label="Zoom out"
                title="Zoom out"
                disabled={zoom <= mapZoomMin}
                onClick={() => onZoomChange(clampZoom(zoom - mapZoomStep))}
              >
                -
              </button>
            </div>
          ) : null}

          {locationArt ? (
            <img
              className="location-art"
              src={locationArt.src}
              alt={locationArt.alt}
              style={{ transform: `scale(${locationArtBaseZoom.toFixed(2)})` }}
            />
          ) : null}
          <canvas className="map-canvas" ref={canvasRef} width="576" height="480" aria-label="Dungeon map" />
          <pre className="map-grid" aria-live="polite">
            {textRows.join("\n")}
          </pre>

          <div
            className={`death-overlay ${playerDefeated(state) ? "" : "hidden"}`}
            role="dialog"
            aria-labelledby="death-title"
            aria-modal="false"
          >
            <div className="death-window">
              <h3 id="death-title">You Died!</h3>
              <div className="death-actions">
                <button type="button" onClick={() => onCommand("reload")}>
                  Revive in Town
                </button>
                <button type="button" onClick={() => onCommand("new")}>
                  New Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

function fitCanvas(
  canvas: HTMLCanvasElement | null,
  stage: HTMLDivElement | null,
  zoom: number,
): void {
  if (!canvas?.width || !canvas.height || !stage) return;

  const scale =
    Math.min(stage.clientWidth / canvas.width, stage.clientHeight / canvas.height) *
    dungeonMapBaseZoom *
    zoom;

  canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
  canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
}

function clampZoom(zoom: number): number {
  return Math.max(mapZoomMin, Math.min(mapZoomMax, Math.round(zoom * 100) / 100));
}

function combatExchanges(events: GameEvent[]): Array<{ source: string; effect: string }> {
  return events.flatMap((event) => {
    if (event.type !== "combat.damage") return [];

    if (/^You (attack|cast) /.test(event.text)) {
      return [{ source: "player", effect: event.effect || combatEffectFromText(event.text) }];
    }
    if (/^[A-Z].+ attacks you with .+ causing \d+ of damage/.test(event.text)) {
      return [{ source: "enemy", effect: event.effect || combatEffectFromText(event.text) }];
    }

    return [];
  });
}

function combatEffectFromText(text: string): string {
  return /^You cast /.test(text) ? "magic" : "slash";
}
