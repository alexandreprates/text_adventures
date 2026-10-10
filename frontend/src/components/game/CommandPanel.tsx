import type {
  AutoExploreGoal,
  ConnectionStatus,
  GameState,
} from "../../lib/types";
import type { AutoExploreControls } from "../../hooks/useAutoExplore";
import { quickCommandsFor, type QuickCommand } from "../../lib/commands";
import { DungeonActions } from "./DungeonActions";

type CommandPanelProps = {
  state: GameState | null;
  connectionStatus: ConnectionStatus;
  autoExplore: AutoExploreControls;
  onCommand: (command: string) => void;
  onOpenShop: () => void;
};

export function CommandPanel({
  state,
  connectionStatus,
  autoExplore,
  onCommand,
  onOpenShop,
}: CommandPanelProps) {
  const commands = shouldShowAutoExploreCommands(state, autoExplore)
    ? autoExploreCommands()
    : quickCommandsFor(state);
  const connectionWarning = connectionWarningFor(connectionStatus);
  const dungeonActions =
    state?.scene === "ruins" &&
    state.player.health.current > 0 &&
    !state.pending?.confirmation;
  const potions =
    state?.player.inventory.reduce(
      (count, item) =>
        item.name === "potion of heal" ? count + (item.quantity ?? 1) : count,
      0,
    ) ?? 0;
  const healthFull = Boolean(
    state && state.player.health.current >= state.player.health.max,
  );
  const fighting = Boolean(state?.battle?.active);
  const lootReady = Boolean(!fighting && state?.dungeon?.nearby_loot);

  return (
    <section
      className="terminal-panel commands-panel"
      aria-labelledby="commands-title"
    >
      <div className="panel-title" id="commands-title">
        === COMMANDS ==
      </div>
      {connectionWarning ? (
        <aside
          className="command-connection-warning"
          role="status"
          aria-label="Connection warning"
        >
          {connectionWarning}
        </aside>
      ) : null}
      {dungeonActions ? (
        <DungeonActions
          primaryLabel={fighting ? "Attack" : lootReady ? "Collect" : "Explore"}
          primaryIcon={fighting ? "sword" : lootReady ? "coin" : "arrow"}
          potions={potions}
          healDisabled={healthFull || potions === 0}
          healHint={
            healthFull
              ? "Health is already full"
              : potions === 0
                ? "No potions remaining"
                : "Restore health"
          }
          townDisabled={fighting}
          townHint={
            fighting
              ? "Finish combat before returning to town"
              : "Return to town"
          }
          onPrimary={() =>
            fighting
              ? onCommand("attack")
              : lootReady
                ? onCommand("loot")
                : autoExplore.setGoal("explore")
          }
          onHeal={() => onCommand("use potion of heal")}
          onTown={() => autoExplore.setGoal("town")}
        />
      ) : (
        <div className="context-commands" aria-live="polite">
          {commands.map((command) => (
            <button
              key={`${command.command}-${command.label}`}
              type="button"
              data-kind={command.kind}
              data-shortcut={shortcutForCommand(command.command, command.label)}
              disabled={command.disabled}
              onClick={() => {
                if (command.command === "shop") {
                  onOpenShop();
                } else if (command.command.startsWith("auto ")) {
                  autoExplore.setGoal(autoGoalFromCommand(command.command));
                } else {
                  onCommand(command.command);
                }
              }}
            >
              {command.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function connectionWarningFor(status: ConnectionStatus): string | null {
  if (status === "offline") return "Connection lost. Commands may not send.";
  if (status === "error") return "Connection problem. Commands may not send.";

  return null;
}

function shouldShowAutoExploreCommands(
  state: GameState | null,
  autoExplore: AutoExploreControls,
): boolean {
  if (!state) return false;
  if ((state.player.health.current || 0) <= 0) return false;
  if (state.pending?.confirmation) return false;
  if (state.battle?.active) return false;

  return state.scene === "ruins" || autoExplore.enabled;
}

function autoExploreCommands(): QuickCommand[] {
  return [
    { label: "Explore", command: "auto explore", kind: "primary" },
    { label: "Go Town", command: "auto town", kind: "primary" },
    { label: "Go Deep", command: "auto descent", kind: "primary" },
  ];
}

function autoGoalFromCommand(command: string): AutoExploreGoal {
  if (command === "auto town") return "town";
  if (command === "auto descent") return "descent";

  return "explore";
}

function shortcutForCommand(command: string, label: string): string {
  const shortcuts: Record<string, string> = {
    "go up": "w/k/↑",
    "go right": "d/l/→",
    "go down": "s/j/↓",
    "go left": "a/h/←",
    "auto explore": "e",
    "auto town": "t",
    "auto descent": "d",
    attack: "a",
    loot: "l",
  };

  return shortcuts[command] || label.slice(0, 1).toLowerCase();
}

export function CombatSummary({ state }: { state: GameState | null }) {
  const enemy = state?.battle?.active ? state.battle.enemy : null;
  if (!enemy) return null;

  const current = enemy.health.current || 0;
  const max = enemy.health.max || 0;
  const percent = max
    ? Math.max(0, Math.min(100, Math.round((current / max) * 100)))
    : 0;
  const statuses = enemy.statuses?.length ? enemy.statuses.join(", ") : "clear";

  return (
    <aside className="combat-summary" aria-label="Enemy status">
      <div className="combat-summary-title">
        <span>Enemy</span>
        <strong>{enemy.display_name || enemy.name}</strong>
      </div>
      <div
        className="combat-summary-meter"
        aria-label={`Enemy HP ${current} of ${max}`}
      >
        <i style={{ width: `${percent}%` }} />
        <strong>
          {current}/{max}
        </strong>
      </div>
      <span
        className={
          statuses === "clear" ? "combat-status-clear" : "combat-status-alert"
        }
      >
        {statuses}
      </span>
    </aside>
  );
}
