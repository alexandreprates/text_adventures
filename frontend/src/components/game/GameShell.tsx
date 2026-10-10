import { useEffect, useState } from "react";
import type {
  CollectionTab,
  ConnectionStatus,
  GameAction,
  GameEvent,
  GameState,
  PlayerState,
  Resource,
} from "../../lib/types";
import type { AutoExploreControls } from "../../hooks/useAutoExplore";
import { commandPlaceholder } from "../../lib/viewModels";
import { autoExploreStepDuration } from "../../lib/autoExploreTiming";
import { CharacterPanel } from "./CharacterPanel";
import { CollectionPanel } from "./CollectionPanel";
import { CommandPanel, CombatSummary } from "./CommandPanel";
import { MapPanel } from "./MapPanel";
import { TradeOverlay } from "./TradeOverlay";
import { GameTools } from "./GameTools";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { GameDialog } from "./GameDialog";
import { GameJournal, type JournalView } from "./GameJournal";

type Panel = "character" | "inventory" | "spells" | "journal" | "auto";
const interfaceModeStorageKey = "text_adventures.interface_mode";

type GameShellProps = {
  state: GameState | null;
  status: ConnectionStatus;
  events: GameEvent[];
  logLines: string[];
  activeTab: CollectionTab;
  commandValue: string;
  shopOpen: boolean;
  autoExplore: AutoExploreControls;
  mapZoom: number;
  playerDirection: string;
  onTabChange: (tab: CollectionTab) => void;
  onCommandValueChange: (command: string) => void;
  onCommand: (command: string) => void;
  onOpenShop: () => void;
  onCloseShop: () => void;
  onMapZoomChange: (zoom: number) => void;
  onSubmitAction: (action: GameAction) => Promise<unknown>;
};

export function GameShell({
  state,
  status,
  events,
  logLines,
  activeTab,
  commandValue,
  shopOpen,
  autoExplore,
  mapZoom,
  playerDirection,
  onTabChange,
  onCommandValueChange,
  onCommand,
  onOpenShop,
  onCloseShop,
  onMapZoomChange,
  onSubmitAction,
}: GameShellProps) {
  const player = state?.player || null;
  const mana = player?.mana || { current: 0, max: 0 };
  const xp = currentSkillProgress(player);
  const locationName = state?.scene === "ruins"
    ? `Ruins Floor ${state.dungeon?.level ?? 1}`
    : state
      ? `Town - ${state.scene_display_name || state.prompt}`
      : "Connecting";
  const compact = useCompactViewport();
  const [view, setView] = useState<JournalView>(savedJournalView);
  const [panel, setPanel] = useState<Panel | null>(() =>
    compact && savedJournalView() === "terminal" ? "journal" : null,
  );
  const journalDialog = compact && panel === "journal";
  const detailsOpen =
    panel === "character" || panel === "inventory" || panel === "spells";

  function selectView(next: JournalView) {
    setView(next);
    try {
      window.localStorage.setItem(
        interfaceModeStorageKey,
        next === "terminal" ? "text" : "actions",
      );
    } catch {
      /* Storage may be unavailable in restricted browser contexts. */
    }
  }

  function openPanel(next: Panel) {
    if (next === "inventory" || next === "spells") onTabChange(next);
    setPanel(next);
  }

  const journal = (
    <GameJournal
      view={view}
      onViewChange={selectView}
      lines={logLines}
      value={commandValue}
      onValueChange={onCommandValueChange}
      onCommand={(command) => {
        if (command.trim().toLowerCase() === "shop") setPanel(null);
        onCommand(command);
      }}
      placeholder={commandPlaceholder(state, compact)}
    />
  );
  const detailsButtons = (
    <>
      <button
        type="button"
        aria-label="Inventory"
        aria-pressed={panel === "inventory"}
        onClick={() => openPanel("inventory")}
      >
        Inventory
      </button>
      <button
        type="button"
        aria-label="Spellbook"
        aria-pressed={panel === "spells"}
        onClick={() => openPanel("spells")}
      >
        Spells
      </button>
      <button
        type="button"
        aria-label="Character"
        aria-pressed={panel === "character"}
        onClick={() => openPanel("character")}
      >
        Character
      </button>
    </>
  );

  return (
    <div className="arcade-shell arcade-theme">
      <header
        className="arcade-header platform-top-hud flex items-center gap-4"
        aria-label="Game status"
      >
        <h1 aria-label={`Text Adventures - ${locationName}`}>
          <span aria-label="Game title">Text Adventures</span>
          {" - "}
          <span aria-label="Current location">
            {locationName}
          </span>
        </h1>
        <div className="arcade-header-tools flex items-center gap-1">
          <ConnectionIndicator status={status} />
          <GameTools scene={state?.scene} />
        </div>
      </header>
      <main className="arcade-main grid min-h-0 flex-1">
        <section
          className="arcade-adventure grid min-h-0 min-w-0"
          aria-label="Adventure"
        >
          <aside
            className="arcade-resources flex items-center gap-6"
            aria-label="Resources"
          >
            <span className="arcade-class" aria-label="Player class and level">
              {player?.current_class || "Adventurer"}{" "}
              <span aria-label="Player level">({player?.level || 0})</span>
            </span>
            <div className="arcade-meters grid grid-cols-3 gap-4">
              <HudMeter
                label="Health"
                value={`${player?.health.current || 0} / ${player?.health.max || 0}`}
                percent={resourcePercent(player?.health)}
                kind="health"
              />
              <HudMeter
                label="Mana"
                value={`${mana.current} / ${mana.max}`}
                percent={resourcePercent(mana)}
                kind="mana"
              />
              <HudMeter
                label="Experience"
                value={xp.label}
                percent={xp.percent}
                kind="xp"
              />
            </div>
            <span className="arcade-gold" aria-label="Wallet">
              {player?.gold || 0} G
            </span>
          </aside>
          <div className="arcade-map platform-live-playfield">
            <MapPanel
              state={state}
              status={status}
              events={events}
              zoom={mapZoom}
              lootAnimation={autoExplore.lootAnimation}
              playerDirection={playerDirection}
              movementDurationMs={
                autoExplore.enabled
                  ? autoExploreStepDuration(autoExplore.speedMultiplier)
                  : undefined
              }
              onZoomChange={onMapZoomChange}
              onCommand={onCommand}
              showZoomControls={false}
              showConnectionIndicator={false}
            />
            <div className="arcade-scene-status">
              <span>
                {!state
                  ? "CONNECTING"
                  : state.player.health.current <= 0
                    ? "DEFEATED"
                    : state.battle?.active
                      ? "YOUR TURN"
                      : state.scene === "ruins"
                        ? "EXPLORING"
                        : "SAFE ZONE"}
              </span>
              <CombatSummary state={state} />
            </div>
            {state?.scene === "ruins" || autoExplore.enabled ? (
              <div className="arcade-auto-shortcut flex items-center gap-2">
                {autoExplore.enabled ? (
                  <button type="button" onClick={() => autoExplore.stop()}>
                    Stop
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label="Auto settings"
                  onClick={() => setPanel("auto")}
                >
                  Auto {autoExplore.speedMultiplier}x
                </button>
              </div>
            ) : null}
          </div>
          <footer className="arcade-controls">
            <CommandPanel
              state={state}
              connectionStatus={status}
              autoExplore={autoExplore}
              onCommand={onCommand}
              onOpenShop={onOpenShop}
            />
            <nav className="arcade-dock flex" aria-label="Loadout">
              {compact ? (
                <button
                  type="button"
                  onClick={() => {
                    selectView("journal");
                    setPanel("journal");
                  }}
                >
                  Journal
                </button>
              ) : null}
              {detailsButtons}
              {compact ? (
                <button
                  type="button"
                  onClick={() => {
                    selectView("terminal");
                    setPanel("journal");
                  }}
                >
                  Terminal
                </button>
              ) : null}
            </nav>
            <aside
              className="arcade-latest"
              aria-label="Recent messages"
              aria-live="polite"
            >
              {autoExplore.enabled ? (
                <span>{autoExplore.statusText} · </span>
              ) : null}
              {logLines.at(-1) ||
                (status === "error" || status === "offline"
                  ? "Connection lost. Reconnecting…"
                  : "Awaiting your next move…")}
            </aside>
          </footer>
        </section>
        {!compact ? (
          <aside
            className="arcade-sidebar flex min-h-0 flex-col"
            aria-label="Journal and terminal"
          >
            {journal}
          </aside>
        ) : null}
      </main>
      {detailsOpen || journalDialog || panel === "auto" ? (
        <GameDialog
          title={
            detailsOpen
              ? "Adventurer"
              : panel === "auto"
                ? "Exploration settings"
                : "Journal / Terminal"
          }
          onClose={() => setPanel(null)}
        >
          {detailsOpen ? (
            <>
              <nav className="arcade-tabs flex" aria-label="Adventurer panels">
                {detailsButtons}
              </nav>
              <div className="arcade-dialog-body min-h-0 overflow-y-auto">
                {panel === "character" ? (
                  <aside
                    className="platform-live-character"
                    aria-label="Character overview"
                  >
                    <CharacterPanel state={state} />
                  </aside>
                ) : (
                  <aside className="platform-live-collection">
                    <CollectionPanel
                      player={player}
                      activeTab={activeTab}
                      onItemCommand={(command) => {
                        onCommand(command);
                        setPanel(null);
                      }}
                      canTeleport={
                        state?.scene === "ruins" &&
                        !state.battle?.active &&
                        (player?.health.current || 0) > 0
                      }
                    />
                  </aside>
                )}
              </div>
            </>
          ) : panel === "auto" ? (
            <AutoSettings
              controls={autoExplore}
              onNavigate={() => setPanel(null)}
            />
          ) : (
            journal
          )}
        </GameDialog>
      ) : null}
      <TradeOverlay
        open={shopOpen}
        state={state}
        onClose={onCloseShop}
        onSubmitAction={onSubmitAction}
      />
    </div>
  );
}

function AutoSettings({
  controls,
  onNavigate,
}: {
  controls: AutoExploreControls;
  onNavigate: () => void;
}) {
  return (
    <div className="arcade-dialog-body p-4">
      <div className="auto-explore-controls">
        <button
          type="button"
          aria-pressed={controls.enabled}
          disabled={!controls.enabled && !controls.canRun}
          onClick={() =>
            controls.enabled ? controls.stop() : controls.start()
          }
        >
          Auto
        </button>
        <strong role="status">{controls.statusText}</strong>
        <div className="auto-speed-buttons" aria-label="Auto speed">
          {controls.speeds.map((speed) => (
            <button
              key={speed}
              type="button"
              className="map-speed-button"
              aria-label={`Auto speed ${speed}x`}
              aria-pressed={controls.speedMultiplier === speed}
              onClick={() => controls.setSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        disabled={!controls.canRun}
        onClick={() => {
          controls.setGoal("descent");
          onNavigate();
        }}
      >
        Go Deep
      </button>
    </div>
  );
}

function HudMeter({
  label,
  value,
  percent,
  kind,
}: {
  label: string;
  value: string;
  percent: number;
  kind: "health" | "mana" | "xp";
}) {
  return (
    <div className={`arcade-meter arcade-meter-${kind}`}>
      <div className="flex justify-between gap-2">
        <span>{{ health: "HP", mana: "MP", xp: "XP" }[kind]}</span>
        <strong>{value}</strong>
      </div>
      <div
        className="arcade-meter-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={value}
      >
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function resourcePercent(resource?: Resource | null): number {
  return resource?.max
    ? clampPercent((resource.current / resource.max) * 100)
    : 0;
}

function currentSkillProgress(player: PlayerState | null): {
  label: string;
  percent: number;
} {
  if (!player) return { label: "0%", percent: 0 };
  const progress = Object.values(player.skills || {})[0];
  if (!progress?.next_level_xp)
    return { label: `Lv ${player.level}`, percent: 0 };
  return {
    label: `${Math.round((progress.xp / progress.next_level_xp) * 100)}%`,
    percent: clampPercent((progress.xp / progress.next_level_xp) * 100),
  };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function savedJournalView(): JournalView {
  try {
    return window.localStorage.getItem(interfaceModeStorageKey) === "text"
      ? "terminal"
      : "journal";
  } catch {
    return "journal";
  }
}

function useCompactViewport(): boolean {
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width: 1023px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}
