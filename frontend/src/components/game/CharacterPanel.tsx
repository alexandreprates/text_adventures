import type { GameState, PlayerState } from "../../lib/types";
import {
  classLine,
  equipmentLine,
  labelize,
  plainAsciiBar,
} from "../../lib/viewModels";
import { ResourceBar } from "./ResourceBar";

type CharacterPanelProps = {
  state: GameState | null;
};

export function CharacterPanel({ state }: CharacterPanelProps) {
  const player = state?.player;
  const mana = player?.mana || { current: 0, max: 0 };
  const statuses = player?.statuses?.length ? player.statuses.join(", ") : "clear";

  return (
    <section className="terminal-panel character-panel" aria-label="Adventurer status">
      <div className="character-frame">
        <div className="frame-line">╔══════════════════╗</div>
        <div className="frame-name">{player ? classLine(player) : "Adventurer"}</div>
        <div className="frame-line">╚══════════════════╝</div>
      </div>

      <div className="vitals">
        <ResourceBar
          label="HP"
          current={player?.health.current || 0}
          max={player?.health.max || 0}
          kind="danger"
        />
        <ResourceBar label="MP" current={mana.current} max={mana.max} kind="mana" />
        <div className="status-row">
          <span>STATUS</span>
          <strong className={statuses === "clear" ? "status-clear" : "status-alert"}>
            {statuses}
          </strong>
        </div>
      </div>

      <div className="section-label">-- CLASSES --</div>
      <div className="terminal-output class-output" aria-live="polite">
        {player ? <ClassProgress player={player} /> : null}
      </div>

      <div className="section-label">-- EQUIPMENT --</div>
      <pre className="terminal-output status-output" aria-live="polite">
        {player ? equipmentLines(player) : "Gold    --"}
      </pre>
    </section>
  );
}

function ClassProgress({ player }: { player: PlayerState }) {
  return (
    <>
      {Object.entries(player.skills).map(([name, skill]) => (
        <div className="class-row" key={name}>
          <span className="class-name">{labelize(name)}</span>
          <span className="class-level">{skill.level}</span>
          <span className="class-bar">{plainAsciiBar(skill.xp, skill.next_level_xp)}</span>
        </div>
      ))}
    </>
  );
}

function equipmentLines(player: PlayerState): string {
  return [
    `Gold    ${player.gold}`,
    equipmentLine("ARM", player.equipment.weapon, "Unarmed", "DMG", "attack"),
    equipmentLine("DEF", player.equipment.armor, "No armor", "DEF", "defense"),
  ].join("\n");
}
