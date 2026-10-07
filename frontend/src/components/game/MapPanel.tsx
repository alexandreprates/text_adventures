import { useEffect, useMemo, useRef, useState } from "react";
import { IsometricDungeonRenderer } from "../../game/isometric";
import type { ConnectionStatus, GameEvent, GameState, LootAnimationGate } from "../../lib/types";
import {
  locationArts,
  locationPanels,
  playerDefeated,
  textRowsFromViewport,
} from "../../lib/viewModels";
import { ConnectionIndicator } from "./ConnectionIndicator";

type MapPanelProps = {
  lootAnimation?: LootAnimationGate;
  state: GameState | null;
  status: ConnectionStatus;
  events: GameEvent[];
  zoom: number;
  playerDirection: string;
  movementDurationMs?: number;
  onZoomChange: (zoom: number) => void;
  onCommand: (command: string) => void;
};

const mapZoomMin = 0.76;
const mapZoomMax = 2.94;
const mapZoomStep = 0.12;
const dungeonMapBaseZoom = 1.18;
const locationArtBaseZoom = 1.12;
type RendererStatus = "loading" | "ready" | "error";

export function MapPanel({
  lootAnimation,
  state,
  status,
  events,
  zoom,
  playerDirection,
  movementDurationMs,
  onZoomChange,
  onCommand,
}: MapPanelProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<IsometricDungeonRenderer | null>(null);
  const [rendererStatus, setRendererStatus] = useState<RendererStatus>("loading");
  const reducedMotion = useReducedMotion();
  const dungeon = state?.scene === "ruins" ? state.dungeon : null;
  const viewport = dungeon?.viewport;
  const locationArt = state ? locationArts[state.scene] : null;
  const hasCanvasMap = Boolean(viewport && rendererStatus !== "error");
  const hasLocationArt = Boolean(!hasCanvasMap && locationArt);
  const textRows = useMemo(() => {
    if (viewport) return textRowsFromViewport(viewport);

    return state ? locationPanels[state.scene] || [state.scene_display_name || state.scene] : ["Connecting"];
  }, [state, viewport]);

  useEffect(() => {
    if (!canvasRef.current) return;

    let cancelled = false;
    const renderer = new IsometricDungeonRenderer(canvasRef.current);
    rendererRef.current = renderer;
    setRendererStatus("loading");

    renderer
      .load()
      .then(() => {
        if (!cancelled) setRendererStatus("ready");
      })
      .catch(() => {
        renderer.clear();
        if (!cancelled) setRendererStatus("error");
      });

    return () => {
      cancelled = true;
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;
    if (!viewport || rendererStatus === "error") {
      rendererRef.current.clear();
      return;
    }

    rendererRef.current.render(viewport, {
      lootAnimation,
      playerClass: state?.player.current_class,
      playerDirection,
      playerDead: playerDefeated(state),
      reducedMotion,
      movementDurationMs,
      dungeonLevel: dungeon?.level,
    });
    fitCanvas(canvasRef.current, stageRef.current, zoom);
  }, [dungeon?.level, lootAnimation, movementDurationMs, playerDirection, reducedMotion, rendererStatus, state, viewport, zoom]);

  useEffect(() => {
    function handleResize() {
      if (viewport) fitCanvas(canvasRef.current, stageRef.current, zoom);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewport, zoom]);

  useEffect(() => {
    rendererRef.current?.play(events);
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
          aria-busy={Boolean(viewport && rendererStatus === "loading")}
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
          {viewport && rendererStatus !== "ready" ? (
            <div
              className={`map-render-status is-${rendererStatus}`}
              role={rendererStatus === "error" ? "alert" : "status"}
            >
              {rendererStatus === "loading"
                ? "Loading isometric dungeon…"
                : "The isometric renderer could not load. Showing the tactical map."}
            </div>
          ) : null}
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

  const logicalWidth = Number(canvas.dataset.logicalWidth) || canvas.width;
  const logicalHeight = Number(canvas.dataset.logicalHeight) || canvas.height;
  const responsiveZoom = stage.clientWidth <= 700 ? 1.45 : 1;
  const scale =
    Math.min(stage.clientWidth / logicalWidth, stage.clientHeight / logicalHeight) *
    dungeonMapBaseZoom *
    zoom *
    responsiveZoom;

  canvas.style.width = `${Math.floor(logicalWidth * scale)}px`;
  canvas.style.height = `${Math.floor(logicalHeight * scale)}px`;
}

function clampZoom(zoom: number): number {
  return Math.max(mapZoomMin, Math.min(mapZoomMax, Math.round(zoom * 100) / 100));
}

function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}
