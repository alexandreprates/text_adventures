import { useState } from "react";
import { MapPanel } from "../game/MapPanel";
import {
  initialMessages,
  mockupState,
  sceneLabels,
  type DemoScene,
} from "./mockupState";
import "./InterfaceMockup.css";

type JournalView = "journal" | "inventory" | "character";

const findings = [
  [
    "01",
    "Give the next move a clear priority",
    "Explore, Go Town and Go Deep currently share the same strong yellow treatment.",
    "One primary action follows the situation: explore, attack or collect. Travel stays secondary.",
  ],
  [
    "02",
    "Keep resources readable",
    "Desktop repeats HP and MP in the character panel; mobile hides their numeric values.",
    "A single compact resource strip keeps current and maximum values visible at every width.",
  ],
  [
    "03",
    "Let the dungeon breathe",
    "Character and collection panels float over the scene, competing with the artwork.",
    "Dedicated desktop regions protect the map. On mobile, secondary information follows the action area.",
  ],
  [
    "04",
    "Keep the story within reach",
    "In action mode, feedback is limited to a short mobile feed; full history requires text mode.",
    "A persistent journal shows action outcomes. Inventory and character details share the same secondary region.",
  ],
  [
    "05",
    "Replace abbreviations with clear labels",
    "CHAR, INV and SPL require players to learn the interface before using it.",
    "Character, Inventory and explicit action labels improve discovery. Text commands remain an optional tool.",
  ],
];

export function InterfaceMockup() {
  const [scene, setScene] = useState<DemoScene>("exploration");
  const [health, setHealth] = useState(24);
  const [enemyHealth, setEnemyHealth] = useState(24);
  const [gold, setGold] = useState(128);
  const [potions, setPotions] = useState(3);
  const [messages, setMessages] = useState(initialMessages);
  const [view, setView] = useState<JournalView>("journal");
  const [zoom, setZoom] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [command, setCommand] = useState("");
  const [error, setError] = useState("");
  const state = mockupState(scene, health, enemyHealth, gold);
  const isCombat = scene === "combat";
  const primaryLabel = isCombat
    ? "Attack skeleton"
    : scene === "loot"
      ? "Collect rewards"
      : scene === "town"
        ? "Enter the ruins"
        : "Explore the chamber";

  function record(message: string) {
    setMessages((previous) => [...previous, message]);
  }

  function selectScene(next: DemoScene) {
    setScene(next);
    setEnemyHealth(24);
    setHealth(24);
    setGold(128);
    setPotions(3);
    setMessages([
      ...initialMessages,
      `Preview: ${sceneLabels[next].toLowerCase()}.`,
    ]);
    setError("");
  }

  function act() {
    setError("");
    if (scene === "exploration") {
      setScene("combat");
      setEnemyHealth(24);
      record("A skeleton guard blocks the passage. Your turn.");
    } else if (scene === "combat") {
      const remaining = Math.max(0, enemyHealth - 8);
      setEnemyHealth(remaining);
      if (remaining === 0) {
        setScene("loot");
        record("Skeleton defeated. A pouch of 18 gold lies at your feet.");
      } else {
        setHealth((current) => Math.max(1, current - 2));
        record(
          `Your sword deals 8 damage. The guard hits back for 2. Enemy HP: ${remaining}/24.`,
        );
      }
    } else if (scene === "loot") {
      setGold((current) => current + 18);
      setScene("exploration");
      record("Collected 18 gold. The chamber is quiet again.");
    } else {
      setScene("exploration");
      record("You step through the portal into the Eastern Chamber.");
    }
  }

  function drinkPotion() {
    if (potions === 0 || health === 30) return;
    setHealth(30);
    setPotions((current) => current - 1);
    record("Health restored to 30/30. Used one health potion.");
  }

  function returnToTown() {
    if (isCombat) return;
    setScene("town");
    record("You return safely to Nee'Peh.");
  }

  function submitCommand() {
    const value = command.trim().toLowerCase();
    const supported =
      scene === "combat"
        ? "attack"
        : scene === "loot"
          ? "loot"
          : scene === "town"
            ? "go ruins"
            : "explore";
    if (value === supported) act();
    else if (value === "look") {
      record(
        scene === "town"
          ? "The village is quiet. The ruins await."
          : "Torchlight reveals a passage through the old stone walls.",
      );
      setError("");
    } else {
      setError(`Try “${supported}” or “look” in this preview.`);
      return;
    }
    setCommand("");
  }

  return (
    <div className="interface-mockup">
      <div className="im-presentation">
        <span>
          <span className="im-live-dot" /> INTERFACE STUDY{" "}
          <span className="im-version">/ 01</span>
        </span>
        <div>
          <span className="im-demo-label">
            Interactive mockup · sample data
          </span>
          <button
            aria-expanded={showNotes}
            aria-controls="design-review"
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? "Hide" : "Design"} notes{" "}
            <span aria-hidden="true">↗</span>
          </button>
          <a href="/">Open game ↗</a>
        </div>
      </div>
      <header className="im-header">
        <div className="im-wordmark">
          <span className="im-emblem" aria-hidden="true">
            ✧
          </span>
          <span>
            TEXT
            <br />
            <strong>ADVENTURES</strong>
          </span>
        </div>
        <div className="im-chapter">
          <span className="im-eyebrow">YOUR ADVENTURE</span>
          <span>
            Nee'Peh <span aria-hidden="true">/</span>{" "}
            {scene === "town" ? "Village" : "Ruins · Floor 01"}
          </span>
        </div>
        <span className="im-preview-badge">LOCAL PREVIEW</span>
      </header>

      <main className="im-main">
        <div className="im-page-heading">
          <div>
            <span className="im-eyebrow">
              {scene === "town"
                ? "A MOMENT OF RESPITE"
                : "BENEATH THE OLD STONES"}
            </span>
            <h1>
              {scene === "town" ? "The town of Nee'Peh" : "The Eastern Chamber"}
            </h1>
          </div>
          <div className="im-scenes" role="group" aria-label="Preview scenario">
            {(Object.keys(sceneLabels) as DemoScene[]).map((name) => (
              <button
                key={name}
                aria-pressed={scene === name}
                onClick={() => selectScene(name)}
              >
                {sceneLabels[name]}
              </button>
            ))}
          </div>
        </div>

        <div className="im-workspace">
          <aside className="im-player" aria-label="Player overview">
            <div className="im-identity">
              <span className="im-player-mark" aria-hidden="true">
                ♜
              </span>
              <div>
                <span className="im-eyebrow">YOUR CHARACTER</span>
                <h2>Adventurer</h2>
                <span className="im-muted">Level 3 · Wayfarer</span>
              </div>
            </div>
            <div className="im-resources">
              <Meter label="Health" current={health} max={30} kind="health" />
              <Meter label="Mana" current={9} max={12} kind="mana" />
              <Meter label="Experience" current={68} max={100} kind="xp" />
            </div>
            <div className="im-gold">
              <span>Gold carried</span>
              <strong>
                <span aria-hidden="true">◇</span> {gold}
              </strong>
            </div>
            <div className="im-equipment">
              <span className="im-eyebrow">EQUIPPED</span>
              <div>
                <span aria-hidden="true">⚔</span>
                <div>
                  Iron sword<small>10 attack</small>
                </div>
              </div>
              <div>
                <span aria-hidden="true">♜</span>
                <div>
                  Leather armor<small>12 defense</small>
                </div>
              </div>
            </div>
            <div className="im-tip">
              <span className="im-eyebrow">THE WAY FORWARD</span>
              <p>
                Explore the ruins.
                <br />
                Grow stronger with every encounter.
              </p>
              <span className="im-muted">
                Your skills improve as you use them.
              </span>
            </div>
          </aside>

          <section className="im-adventure" aria-label="Adventure preview">
            <div className="im-scene-heading">
              <span>
                <span
                  className={`im-live-dot ${isCombat ? "im-danger" : ""}`}
                />
                {isCombat
                  ? "In combat · Your turn"
                  : scene === "loot"
                    ? "Victory · Rewards waiting"
                    : scene === "town"
                      ? "Safe haven"
                      : "Exploring · No active threats"}
              </span>
              <span className="im-muted">
                {scene === "town" ? "NEE'PEH" : "FLOOR 01"}
              </span>
            </div>
            <div className="im-map">
              <MapPanel
                state={state}
                status="online"
                events={[]}
                zoom={zoom}
                playerDirection="right"
                onZoomChange={setZoom}
                onCommand={() => undefined}
              />
              <span className="im-map-caption">
                {scene === "town"
                  ? "A familiar light on the road home."
                  : "Old walls. New stories."}
              </span>
            </div>
            <div className="im-action-area">
              <div className="im-context">
                <div>
                  <span className="im-eyebrow">
                    {isCombat
                      ? "SKELETON GUARD"
                      : scene === "loot"
                        ? "THE SPOILS OF BATTLE"
                        : scene === "town"
                          ? "READY WHEN YOU ARE"
                          : "AN UNEXPLORED PASSAGE"}
                  </span>
                  <p>
                    {isCombat
                      ? "A rusted blade rises. Make your move."
                      : scene === "loot"
                        ? "18 gold. Yours for the taking."
                        : scene === "town"
                          ? "The ruins hold another story."
                          : "Torchlight spills into the next chamber."}
                  </p>
                </div>
                {isCombat && (
                  <Meter
                    label="Enemy health"
                    current={enemyHealth}
                    max={24}
                    kind="health"
                  />
                )}
              </div>
              <div className="im-actions">
                <button className="im-primary" onClick={act}>
                  <span aria-hidden="true">
                    {isCombat ? "⚔" : scene === "loot" ? "◇" : "↗"}
                  </span>
                  {primaryLabel}
                </button>
                <button
                  disabled={health === 30 || potions === 0}
                  onClick={drinkPotion}
                  title={
                    health === 30
                      ? "Health is already full"
                      : potions === 0
                        ? "No potions remaining"
                        : "Restore health"
                  }
                >
                  Heal <span className="im-count">{potions}</span>
                </button>
                <button
                  disabled={isCombat || scene === "town"}
                  title={
                    isCombat
                      ? "Finish combat before returning to town"
                      : scene === "town"
                        ? "You are already in town"
                        : "Return to town"
                  }
                  onClick={returnToTown}
                >
                  Town <span aria-hidden="true">↗</span>
                </button>
              </div>
              {isCombat && (
                <small className="im-muted">
                  Defeat the guard before returning to town.
                </small>
              )}
            </div>
          </section>

          <aside className="im-journal" aria-label="Adventure details">
            <nav
              className="im-detail-tabs"
              aria-label="Adventure details views"
            >
              {(["journal", "inventory", "character"] as JournalView[]).map(
                (name) => (
                  <button
                    key={name}
                    aria-pressed={view === name}
                    onClick={() => setView(name)}
                  >
                    {name[0].toUpperCase() + name.slice(1)}
                  </button>
                ),
              )}
            </nav>
            {view === "journal" ? (
              <div className="im-journal-content">
                <div className="im-section-heading">
                  <h2>Adventure journal</h2>
                  <span className="im-muted">01</span>
                </div>
                <p className="im-journal-intro">
                  Every journey leaves a trace.
                </p>
                <ol className="im-timeline">
                  {messages.slice(-5).map((message, index) => (
                    <li key={`${messages.length}-${index}`}>
                      <span className="im-eyebrow">
                        {index === messages.slice(-5).length - 1
                          ? "LATEST"
                          : `EVENT ${String(Math.max(0, messages.length - 5) + index + 1).padStart(2, "0")}`}
                      </span>
                      <p>{message}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : view === "inventory" ? (
              <div className="im-journal-content">
                <h2>Inventory</h2>
                <p className="im-journal-intro">
                  Everything for the road ahead.
                </p>
                <div className="im-inventory-row">
                  <div>
                    <strong>Health potion</strong>
                    <small>Restores your health · {potions} remaining</small>
                  </div>
                  <button
                    onClick={drinkPotion}
                    disabled={health === 30 || potions === 0}
                  >
                    Use
                  </button>
                </div>
                {potions === 0 && (
                  <p>No potions left. Visit a merchant in town.</p>
                )}
                <div className="im-inventory-row">
                  <span>Gold pouch</span>
                  <strong>{gold} gold</strong>
                </div>
              </div>
            ) : (
              <div className="im-journal-content">
                <h2>Your character</h2>
                <p className="im-journal-intro">Adventurer · Level 3</p>
                <div className="im-inventory-row">
                  <span>Weapon</span>
                  <strong>Iron sword</strong>
                </div>
                <div className="im-inventory-row">
                  <span>Armor</span>
                  <strong>Leather armor</strong>
                </div>
                <p className="im-muted">
                  Weapon and spell use shapes your class. This preview shows
                  sample progression.
                </p>
              </div>
            )}
            <div className="im-journal-footer">
              <span className="im-live-dot" /> Preview only · progress is not
              saved
            </div>
          </aside>
        </div>

        <div className="im-below">
          <details className="im-command">
            <summary>
              Prefer words? Type a command <span aria-hidden="true">⌄</span>
            </summary>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitCommand();
              }}
            >
              <label htmlFor="preview-command">Command</label>
              <div>
                <input
                  id="preview-command"
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={
                    error ? "preview-error" : "preview-command-hint"
                  }
                  placeholder="Try look"
                />
                <button type="submit">Send ↵</button>
              </div>
              <small id="preview-command-hint">
                Demo commands: look, explore, attack, loot, go ruins.
                Availability follows the current scenario.
              </small>
              {error && (
                <p role="alert" id="preview-error">
                  {error}
                </p>
              )}
            </form>
          </details>
          <span className="im-muted">
            A quieter interface. A deeper adventure.
          </span>
        </div>
        <p className="sr-only" role="status">
          {messages[messages.length - 1]}
        </p>

        <section
          id="design-review"
          className="im-review"
          hidden={!showNotes}
          aria-label="Interface assessment"
        >
          <span className="im-eyebrow">FROM OBSERVATION TO PROPOSAL</span>
          <h2>Keep the world. Clear the interface.</h2>
          <p className="text-preview-muted">
            Assessment of the current browser UI at 1440 × 900 and 390 × 844.
            These are design observations, not usability-study results.
          </p>
          <div className="im-findings my-8 grid grid-cols-1 gap-6 min-[701px]:grid-cols-2 min-[1151px]:grid-cols-3">
            {findings.map(([number, title, current, proposal]) => (
              <article key={number}>
                <span className="im-eyebrow">{number}</span>
                <h3>{title}</h3>
                <p>
                  <strong>Today</strong> {current}
                </p>
                <p>
                  <strong>Proposal</strong> {proposal}
                </p>
              </article>
            ))}
          </div>
          <p className="im-muted">
            Scope: local presentation with simulated exploration, combat, loot
            and town. Existing artwork and dungeon renderer are reused. No
            gameplay rules, saves or server actions are changed. Next: validate
            navigation and information density with players before integration.
          </p>
        </section>
      </main>
      <footer className="im-footer">
        <span>
          TEXT ADVENTURES <span className="im-muted">/ Interface concept</span>
        </span>
        <span className="im-muted">Built around the adventure.</span>
      </footer>
    </div>
  );
}

function Meter({
  label,
  current,
  max,
  kind,
}: {
  label: string;
  current: number;
  max: number;
  kind: "health" | "mana" | "xp";
}) {
  return (
    <div className={`im-meter im-meter-${kind}`}>
      <div>
        <span>{label}</span>
        <strong>
          {current}
          <span> / {max}</span>
        </strong>
      </div>
      <progress aria-label={label} value={current} max={max} />
    </div>
  );
}
