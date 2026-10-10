import { useEffect, useRef, useState } from "react";
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
    "A viewport-sized game shell protects the map. Secondary information opens inside the game instead of extending the page.",
  ],
  [
    "04",
    "Keep the story within reach",
    "In action mode, feedback is limited to a short mobile feed; full history requires text mode.",
    "The latest outcome stays beside the actions. A dock opens the full journal, inventory and character without page scrolling.",
  ],
  [
    "05",
    "Replace abbreviations with clear labels",
    "CHAR, INV and SPL require players to learn the interface before using it.",
    "Character, Inventory and explicit action labels improve discovery. Text commands remain an optional tool.",
  ],
  [
    "06",
    "Match the dungeon's pixel identity",
    "The first concept used serif headings, soft panels and muted accents that felt disconnected from the game.",
    "Pixel typography, stepped frames, segmented resources and terminal prompts connect the HUD to the existing dungeon artwork.",
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
  const [panel, setPanel] = useState<"details" | "terminal" | "notes" | null>(
    null,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!panel || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [panel]);
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
    setPanel(null);
  }

  return (
    <div className="interface-mockup">
      <header className="im-header">
        <div className="im-wordmark">
          <span className="im-emblem">
            <PixelIcon kind="gate" />
          </span>
          <span>
            TEXT
            <br />
            <strong>ADVENTURES</strong>
          </span>
        </div>
        <div className="im-chapter">
          <span className="im-eyebrow">WORLD_01 / NEE'PEH</span>
          <span>
            Nee'Peh <span aria-hidden="true">/</span>{" "}
            {scene === "town" ? "Village" : "Ruins · Floor 01"}
          </span>
        </div>
        <div className="im-header-tools">
          <span className="im-preview-badge">
            <span className="im-live-dot" /> MOCKUP 03
          </span>
          <button onClick={() => setPanel("notes")}>Design notes</button>
          <a href="/">Open game ↗</a>
        </div>
      </header>

      <main className="im-main">
        <div className="im-page-heading">
          <div>
            <span className="im-eyebrow">
              {scene === "town"
                ? "// SAFE ZONE / REST & RESUPPLY"
                : "// DUNGEON_01 / EXPLORE THE UNKNOWN"}
            </span>
            <h1>
              {scene === "town" ? "The town of Nee'Peh" : "The Eastern Chamber"}
            </h1>
          </div>
          <label className="im-scenes">
            <span>Preview</span>
            <select
              aria-label="Preview scenario"
              value={scene}
              onChange={(event) => selectScene(event.target.value as DemoScene)}
            >
              {(Object.keys(sceneLabels) as DemoScene[]).map((name) => (
                <option key={name} value={name}>
                  {sceneLabels[name]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="im-workspace grid min-h-0 grid-cols-1 min-[901px]:grid-cols-[232px_minmax(0,1fr)]">
          <aside className="im-player" aria-label="Player overview">
            <div className="im-identity">
              <span className="im-player-mark" aria-hidden="true" />
              <div>
                <span className="im-eyebrow">PLAYER_01</span>
                <h2>Adventurer</h2>
                <span className="im-muted">LVL 03 / Adventurer</span>
              </div>
            </div>
            <div className="im-resources grid grid-cols-3 gap-4 min-[901px]:grid-cols-1">
              <Meter label="Health" current={health} max={30} kind="health" />
              <Meter label="Mana" current={9} max={12} kind="mana" />
              <Meter label="Experience" current={68} max={100} kind="xp" />
            </div>
            <div className="im-gold">
              <span>Gold carried</span>
              <strong>
                <PixelIcon kind="coin" /> {String(gold).padStart(4, "0")}
              </strong>
            </div>
            <div className="im-equipment">
              <span className="im-eyebrow">[ EQUIPMENT ]</span>
              <div>
                <span>
                  <PixelIcon kind="sword" />
                </span>
                <div>
                  Iron sword<small>10 attack</small>
                </div>
              </div>
              <div>
                <span>
                  <PixelIcon kind="shield" />
                </span>
                <div>
                  Leather armor<small>12 defense</small>
                </div>
              </div>
            </div>
            <div className="im-tip">
              <span className="im-eyebrow">[ CURRENT OBJECTIVE ]</span>
              <p>Find a path through the ruins.</p>
              <span className="im-muted">
                &gt; Your skills grow with every encounter.
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
                  ? "COMBAT / YOUR TURN"
                  : scene === "loot"
                    ? "VICTORY / LOOT READY"
                    : scene === "town"
                      ? "TOWN / SAFE ZONE"
                      : "EXPLORATION / READY"}
              </span>
              <span className="im-muted">
                {scene === "town" ? "[ TOWN ]" : "[ B1 ]"}
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
                &gt; OBJECTIVE: Find a path through the ruins.
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
              <div className="im-actions flex flex-wrap gap-2">
                <button className="im-primary" onClick={act}>
                  <PixelIcon
                    kind={
                      isCombat ? "sword" : scene === "loot" ? "coin" : "arrow"
                    }
                  />
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
                  <PixelIcon kind="potion" /> Heal{" "}
                  <span className="im-count">{potions}</span>
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
                  <PixelIcon kind="gate" /> Town
                </button>
              </div>
              <p className="im-latest" role="status">
                &gt; {messages[messages.length - 1]}
              </p>
            </div>
          </section>
        </div>
        <nav className="im-dock" aria-label="Game panels">
          {(["journal", "inventory", "character"] as JournalView[]).map(
            (name) => (
              <button
                key={name}
                onClick={() => {
                  setView(name);
                  setPanel("details");
                }}
              >
                {name[0].toUpperCase() + name.slice(1)}
              </button>
            ),
          )}
          <button onClick={() => setPanel("terminal")}>
            <span className="im-command-prompt" aria-hidden="true">
              &gt;_
            </span>{" "}
            Terminal
          </button>
          <span className="im-muted">DEMO SESSION / NOT SAVED</span>
        </nav>
      </main>
      <dialog
        ref={dialogRef}
        className={`im-dialog ${panel === "notes" ? "im-dialog-wide" : ""}`}
        aria-labelledby="im-dialog-title"
        onCancel={() => setPanel(null)}
      >
        <div className="im-dialog-heading">
          <h2 id="im-dialog-title">
            {panel === "notes"
              ? "Design notes"
              : panel === "terminal"
                ? "Command terminal"
                : "Adventure details"}
          </h2>
          <button onClick={() => setPanel(null)} aria-label="Close panel">
            Close ×
          </button>
        </div>
        <div className="im-dialog-body">
          {panel === "details" && (
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
                    <span className="im-muted">[LOG]</span>
                  </div>
                  <p className="im-journal-intro">
                    &gt; Recording your adventure...
                  </p>
                  <ol className="im-timeline">
                    {messages.map((message, index) => (
                      <li key={`${messages.length}-${index}`}>
                        <span className="im-eyebrow">
                          {index === messages.length - 1
                            ? "[ NOW ]"
                            : `[ ${String(index + 1).padStart(3, "0")} ]`}
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
                    <strong>Iron sword · 10 attack</strong>
                  </div>
                  <div className="im-inventory-row">
                    <span>Armor</span>
                    <strong>Leather armor · 12 defense</strong>
                  </div>
                  <p className="im-muted">
                    Weapon and spell use shapes your class. This preview shows
                    sample progression.
                  </p>
                </div>
              )}
              <div className="im-journal-footer">
                <span className="im-live-dot" /> DEMO SESSION / NOT SAVED
              </div>
            </aside>
          )}
          {panel === "terminal" && (
            <div className="im-command">
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
                    placeholder="look_"
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
            </div>
          )}
          {panel === "notes" && (
            <section
              id="design-review"
              className="im-review"
              aria-label="Interface assessment"
            >
              <span className="im-eyebrow">FROM OBSERVATION TO PROPOSAL</span>
              <h2>A game screen, inside one viewport.</h2>
              <p className="text-preview-muted">
                Assessment of the current browser UI at 1440 × 900 and 390 ×
                844. These are design observations, not usability-study results.
              </p>
              <div className="im-references">
                <a
                  href="https://www.nintendo.com/eu/media/images/assets/nintendo_switch_games/cavesofqud/nswitch_cavesofqud/CavesOfQud_05.jpg"
                  target="_blank"
                  rel="noreferrer"
                >
                  Caves of Qud ↗
                  <span>
                    Reference image: fixed HUD, terminal typography and a
                    dominant map.
                  </span>
                </a>
                <a
                  href="https://cdn.supersoluce.com/file/docs/docid_5e1c8296105f4d8912000001/elemid_4ee9faa20a2fe93d0e000010/stoneshard-009.jpg"
                  target="_blank"
                  rel="noreferrer"
                >
                  Stoneshard ↗
                  <span>
                    Reference image: edge-anchored actions, restrained frames
                    and contextual feedback.
                  </span>
                </a>
              </div>
              <p className="im-muted">
                Applied here: a flexible dungeon viewport, permanent resources
                and action dock, and internal windows for secondary panels. Only
                long panel content scrolls; the game screen stays in place.
                Reference artwork belongs to its respective creators and is not
                included as game assets.
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
                Scope: local presentation with simulated exploration, combat,
                loot and town. Existing artwork and dungeon renderer are reused.
                No gameplay rules, saves or server actions are changed. Next:
                validate navigation and information density with players before
                integration.
              </p>
            </section>
          )}
        </div>
      </dialog>
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
      <div className="im-meter-track">
        <progress aria-label={label} value={current} max={max} />
      </div>
    </div>
  );
}

type PixelIconKind = "gate" | "sword" | "shield" | "potion" | "coin" | "arrow";

function PixelIcon({ kind }: { kind: PixelIconKind }) {
  const paths: Record<PixelIconKind, string> = {
    gate: "M2 2h3v3h2V2h2v3h2V2h3v12h-4V9H6v5H2z M5 6v1h6V6z",
    sword: "M11 1h4v4h-2v2h-2v2H9v2H7v2H5v2H2v-3h2v-2h2V8H4V6h2l2 2V6h2V4h1z",
    shield: "M2 2h12v8h-2v2h-2v2H6v-2H4v-2H2z M7 4v6h2V4z",
    potion: "M5 1h6v2h-1v3h2v2h1v6H3V8h1V6h2V3H5z M5 9v3h2V9z",
    coin: "M5 1h6v2h2v2h2v6h-2v2h-2v2H5v-2H3v-2H1V5h2V3h2z M7 4v8h2V4z",
    arrow: "M8 2h3v2h2v2h2v4h-2v2h-2v2H8v-3h2V9H1V7h9V5H8z",
  };
  return (
    <svg
      className="im-pixel-icon"
      viewBox="0 0 16 16"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <path d={paths[kind]} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
