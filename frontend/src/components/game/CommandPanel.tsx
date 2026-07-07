import type { AutoExploreGoal, ConnectionStatus, GameState } from "../../lib/types";
import type { AutoExploreControls } from "../../hooks/useAutoExplore";
import { quickCommandsFor, type QuickCommand } from "../../lib/commands";

type CommandPanelProps = {
  state: GameState | null;
  connectionStatus: ConnectionStatus;
  autoExplore: AutoExploreControls;
  recentLines: string[];
  onCommand: (command: string) => void;
  onOpenShop: () => void;
};

export function CommandPanel({
  state,
  connectionStatus,
  autoExplore,
  recentLines,
  onCommand,
  onOpenShop,
}: CommandPanelProps) {
  const commands = shouldShowAutoExploreCommands(state, autoExplore)
    ? autoExploreCommands()
    : quickCommandsFor(state);
  const connectionWarning = connectionWarningFor(connectionStatus);

  return (
    <section className="terminal-panel commands-panel" aria-labelledby="commands-title">
      <div className="panel-title" id="commands-title">
        === COMMANDS ==
      </div>
      <CombatSummary state={state} />
      <MobileCommandFeed lines={recentLines} />
      {connectionWarning ? (
        <aside
          className="command-connection-warning"
          role="status"
          aria-label="Connection warning"
        >
          {connectionWarning}
        </aside>
      ) : null}
      {state?.scene === "ruins" || autoExplore.enabled ? (
        <div className="auto-explore-controls" aria-live="polite">
          <button
            type="button"
            aria-pressed={autoExplore.enabled ? "true" : "false"}
            disabled={!autoExplore.enabled && !autoExplore.canRun}
            onClick={() => {
              if (autoExplore.enabled) {
                autoExplore.stop();
              } else {
                autoExplore.start();
              }
            }}
          >
            Auto
          </button>
          <strong>{autoExplore.statusText}</strong>
          <div className="auto-speed-buttons" aria-label="Auto speed">
            {autoExplore.speeds.map((speed) => (
              <button
                className="map-speed-button"
                key={speed}
                type="button"
                aria-label={`Auto speed ${speed}x`}
                aria-pressed={autoExplore.speedMultiplier === speed ? "true" : "false"}
                onClick={() => autoExplore.setSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      ) : null}
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

function CombatSummary({ state }: { state: GameState | null }) {
  const enemy = state?.battle?.active ? state.battle.enemy : null;
  if (!enemy) return null;

  const current = enemy.health.current || 0;
  const max = enemy.health.max || 0;
  const percent = max ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;
  const statuses = enemy.statuses?.length ? enemy.statuses.join(", ") : "clear";

  return (
    <aside className="combat-summary" aria-label="Enemy status">
      <div className="combat-summary-title">
        <span>Enemy</span>
        <strong>{enemy.display_name || enemy.name}</strong>
      </div>
      <div className="combat-summary-meter" aria-label={`Enemy HP ${current} of ${max}`}>
        <i style={{ width: `${percent}%` }} />
        <strong>
          {current}/{max}
        </strong>
      </div>
      <span className={statuses === "clear" ? "combat-status-clear" : "combat-status-alert"}>
        {statuses}
      </span>
    </aside>
  );
}

function MobileCommandFeed({ lines }: { lines: string[] }) {
  const visibleLines = lines.map((line) => line.trim()).filter(Boolean);
  if (!visibleLines.length) return null;

  return (
    <aside className="mobile-command-feed" aria-label="Recent messages" aria-live="polite">
      {visibleLines.map((line, index) => (
        <span key={`${line}-${index}`}>{line}</span>
      ))}
    </aside>
  );
}
