import { useEffect, useMemo, useState } from "react";
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
import { CharacterPanel } from "./CharacterPanel";
import { CollectionPanel } from "./CollectionPanel";
import { CommandBar } from "./CommandBar";
import { CommandPanel } from "./CommandPanel";
import { MapPanel } from "./MapPanel";
import { MessageLog } from "./MessageLog";
import { TradeOverlay } from "./TradeOverlay";

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
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [statusDrawer, setStatusDrawer] = useState<{ scene: string | null; open: boolean }>({
    scene: null,
    open: false,
  });
  const compactViewport = useCompactViewport();
  const recentLogLines = useMemo(() => logLines.slice(-2), [logLines]);
  const statusScene = state?.scene || null;
  const statusOpen = statusDrawer.open && statusDrawer.scene === statusScene && !shopOpen;

  function toggleCollection(tab: CollectionTab) {
    if (activeTab === tab) {
      setCollectionOpen((open) => !open);
      return;
    }

    onTabChange(tab);
    setCollectionOpen(true);
  }

  return (
    <>
      <div className="app-shell platform-live-shell">
        <header className="platform-top-hud" aria-label="Game status">
          <div
            className="platform-brand"
            aria-label="Game title"
          >
            Text Adventures
          </div>
          <h1 className="sr-only">{state?.scene_display_name || "Starting adventure"}</h1>

          <div className="platform-location-chip" aria-label="Current location">
            <span>{state?.scene_display_name || state?.scene || "Starting"}</span>
            <strong>{state?.prompt || "Connecting"}</strong>
          </div>

          <div className="platform-meter-group" aria-label="Resources">
            <HudMeter
              label="HP"
              value={`${player?.health.current || 0}/${player?.health.max || 0}`}
              percent={resourcePercent(player?.health)}
              kind="health"
            />
            <HudMeter
              label="MP"
              value={`${mana.current}/${mana.max}`}
              percent={resourcePercent(mana)}
              kind="mana"
            />
            <HudMeter
              label="XP"
              value={xp.label}
              percent={xp.percent}
              kind="stamina"
            />
          </div>

          <div className="platform-pocket" aria-label="Wallet">
            <span>Gold</span>
            <strong>{player?.gold || 0}</strong>
          </div>
        </header>

        <main
          className={`platform-live-playfield ${state?.scene === "ruins" ? "is-ruins" : ""}`}
        >
          <details
            className="platform-status-drawer"
            open={statusOpen}
            onToggle={(event) =>
              setStatusDrawer({ scene: statusScene, open: event.currentTarget.open })
            }
          >
            <summary>
              Status
              <span className="status-drawer-state" aria-hidden="true">
                {statusOpen ? "-" : "+"}
              </span>
            </summary>
            <CharacterPanel state={state} />
          </details>

          <aside className="platform-loadout-rail" aria-label="Loadout">
            <button
              type="button"
              aria-label="Inventory"
              aria-pressed={collectionOpen && activeTab === "inventory"}
              onClick={() => toggleCollection("inventory")}
            >
              INV
            </button>
            <button
              type="button"
              aria-label="Spellbook"
              aria-pressed={collectionOpen && activeTab === "spells"}
              onClick={() => toggleCollection("spells")}
            >
              SPL
            </button>
          </aside>

          <MapPanel
            state={state}
            status={status}
            events={events}
            zoom={mapZoom}
            playerDirection={playerDirection}
            onZoomChange={onMapZoomChange}
            onCommand={onCommand}
          />

          <aside
            className={`platform-live-collection ${collectionOpen ? "" : "is-hidden"}`}
            aria-hidden={!collectionOpen}
          >
            <CollectionPanel
              player={player}
              activeTab={activeTab}
              onFillCommand={onCommandValueChange}
            />
          </aside>

          <aside className="platform-live-log">
            <MessageLog lines={logLines} />
          </aside>

          <CommandPanel
            state={state}
            autoExplore={autoExplore}
            recentLines={recentLogLines}
            onCommand={onCommand}
            onOpenShop={onOpenShop}
          />
        </main>

        <CommandBar
          placeholder={commandPlaceholder(state, compactViewport)}
          value={commandValue}
          onValueChange={onCommandValueChange}
          onSubmitCommand={onCommand}
        />
      </div>

      <TradeOverlay
        open={shopOpen}
        state={state}
        onClose={onCloseShop}
        onSubmitAction={onSubmitAction}
      />
    </>
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
  kind: "health" | "mana" | "stamina";
}) {
  return (
    <div className={`platform-meter platform-meter-${kind}`}>
      <span>{label}</span>
      <div className="platform-meter-track">
        <i className="platform-meter-fill" style={{ width: `${percent}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function resourcePercent(resource?: Resource | null): number {
  if (!resource?.max) return 0;

  return clampPercent((resource.current / resource.max) * 100);
}

function currentSkillProgress(player: PlayerState | null): { label: string; percent: number } {
  if (!player) return { label: "0%", percent: 0 };

  const progress = Object.values(player.skills || {})[0];
  if (!progress?.next_level_xp) return { label: `Lv ${player.level}`, percent: 0 };

  return {
    label: `${Math.round((progress.xp / progress.next_level_xp) * 100)}%`,
    percent: clampPercent((progress.xp / progress.next_level_xp) * 100),
  };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function useCompactViewport(): boolean {
  const [compact, setCompact] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 700px)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const updateCompact = () => setCompact(query.matches);

    updateCompact();
    query.addEventListener("change", updateCompact);

    return () => query.removeEventListener("change", updateCompact);
  }, []);

  return compact;
}
