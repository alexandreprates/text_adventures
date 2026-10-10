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
  const [sidebarView, setSidebarView] = useState<"journal" | "terminal">(
    "journal",
  );
  const [zoom, setZoom] = useState(1.3);
  const [panel, setPanel] = useState<
    "details" | "terminal" | "notes" | "preview" | null
  >(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!panel || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [panel]);
  const [command, setCommand] = useState("");
  const [error, setError] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const output = terminalRef.current;
    if (output) output.scrollTop = output.scrollHeight;
  }, [messages, sidebarView]);
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
        <h1>
          {scene === "town" ? "The town of Nee'Peh" : "The Eastern Chamber"}
        </h1>
        <span className="im-header-location">
          NEE'PEH / {scene === "town" ? "SAFE ZONE" : "RUINS · B1"}
        </span>
        <button onClick={() => setPanel("preview")}>Preview</button>
      </header>
      <main className="im-main">
        <section className="im-adventure" aria-label="Adventure preview">
          <aside className="im-player" aria-label="Player overview">
            <div className="im-resources grid grid-cols-3 gap-4">
              <Meter label="Health" current={health} max={30} kind="health" />
              <Meter label="Mana" current={9} max={12} kind="mana" />
              <Meter label="Experience" current={68} max={100} kind="xp" />
            </div>
            <span className="im-hud-identity">ADVENTURER · LVL 03</span>
            <span className="im-hud-gold">
              <PixelIcon kind="coin" /> {gold}
            </span>
          </aside>
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
            <div className="im-scene-heading">
              <span>
                <span
                  className={`im-live-dot ${isCombat ? "im-danger" : ""}`}
                />
                {isCombat
                  ? "YOUR TURN"
                  : scene === "loot"
                    ? "LOOT READY"
                    : scene === "town"
                      ? "SAFE ZONE"
                      : "EXPLORING"}
              </span>
              {isCombat && (
                <Meter
                  label="Enemy health"
                  current={enemyHealth}
                  max={24}
                  kind="health"
                />
              )}
            </div>
          </div>
          <div className="im-controls">
            <div className="im-actions flex flex-wrap gap-2">
              <button
                className="im-primary"
                aria-label={primaryLabel}
                onClick={act}
              >
                <PixelIcon
                  kind={
                    isCombat ? "sword" : scene === "loot" ? "coin" : "arrow"
                  }
                />
                {isCombat
                  ? "Attack"
                  : scene === "loot"
                    ? "Collect"
                    : scene === "town"
                      ? "Enter ruins"
                      : "Explore"}
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

            <nav className="im-dock" aria-label="Game panels">
              {(["journal", "inventory", "character"] as JournalView[]).map(
                (name) => (
                  <button
                    key={name}
                    className={
                      name === "journal" ? "im-mobile-panel" : undefined
                    }
                    onClick={() => {
                      setView(name);
                      setPanel("details");
                    }}
                  >
                    {name[0].toUpperCase() + name.slice(1)}
                  </button>
                ),
              )}
              <button
                className="im-mobile-panel"
                onClick={() => setPanel("terminal")}
              >
                <span className="im-command-prompt" aria-hidden="true">
                  &gt;_
                </span>{" "}
                Terminal
              </button>
            </nav>

            <p
              className="im-latest"
              role="status"
              title={messages[messages.length - 1]}
            >
              &gt; {messages[messages.length - 1]}
            </p>
          </div>
        </section>
        <aside className="im-sidebar" aria-label="Journal and terminal">
          <nav className="im-detail-tabs" aria-label="Sidebar views">
            <button
              aria-pressed={sidebarView === "journal"}
              onClick={() => setSidebarView("journal")}
            >
              Journal
            </button>
            <button
              aria-pressed={sidebarView === "terminal"}
              onClick={() => setSidebarView("terminal")}
            >
              Terminal
            </button>
          </nav>
          {sidebarView === "journal" ? (
            <JournalContent messages={messages} />
          ) : (
            <div className="im-sidebar-terminal">
              <div
                className="im-terminal-output"
                ref={terminalRef}
                tabIndex={0}
                aria-label="Terminal output"
              >
                <span className="im-eyebrow">TEXT ADVENTURES / TERMINAL</span>
                {messages.map((message, index) => (
                  <p key={index}>&gt; {message}</p>
                ))}
              </div>
              <CommandForm
                id="sidebar-command"
                value={command}
                error={error}
                onChange={setCommand}
                onSubmit={submitCommand}
              />
            </div>
          )}
          <div className="im-journal-footer">
            <span className="im-live-dot" /> DEMO SESSION / NOT SAVED
          </div>
        </aside>
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
                : panel === "preview"
                  ? "Mockup controls"
                  : "Adventure details"}
          </h2>
          <button onClick={() => setPanel(null)} aria-label="Close panel">
            Close ×
          </button>
        </div>
        <div className="im-dialog-body">
          {panel === "preview" && (
            <div className="im-preview-controls grid gap-4 p-6">
              <p className="im-muted">
                TEXT ADVENTURES / MOCKUP 04 · Sample data
              </p>
              <label className="im-scenes">
                Preview scenario
                <select
                  value={scene}
                  onChange={(event) => {
                    selectScene(event.target.value as DemoScene);
                    setPanel(null);
                  }}
                >
                  {(Object.keys(sceneLabels) as DemoScene[]).map((name) => (
                    <option key={name} value={name}>
                      {sceneLabels[name]}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={() => setPanel("notes")}>Design notes</button>
              <a href="/">Open game ↗</a>
            </div>
          )}
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
                <JournalContent messages={messages} />
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
                  <p className="im-muted">
                    Current objective: find a path through the ruins.
                  </p>
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
            <CommandForm
              id="preview-command"
              value={command}
              error={error}
              onChange={setCommand}
              onSubmit={submitCommand}
            />
          )}
          {panel === "notes" && (
            <section
              id="design-review"
              className="im-review"
              aria-label="Interface assessment"
            >
              <span className="im-eyebrow">FROM OBSERVATION TO PROPOSAL</span>
              <h2>The dungeon takes the screen.</h2>
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
                Applied here: an edge-to-edge dungeon, compact resource and
                action strips, and internal windows for secondary panels. Only
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

function JournalContent({ messages }: { messages: string[] }) {
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const content = contentRef.current;
    if (content) content.scrollTop = content.scrollHeight;
  }, [messages]);
  return (
    <div className="im-journal-content" ref={contentRef}>
      <div className="im-section-heading">
        <h2>Adventure journal</h2>
        <span className="im-muted">[LOG]</span>
      </div>
      <p className="im-journal-intro">&gt; Recording your adventure...</p>
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
  );
}

function CommandForm({
  id,
  value,
  error,
  onChange,
  onSubmit,
}: {
  id: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="im-command">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor={id}>Command</label>
        <div>
          <input
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : `${id}-hint`}
            placeholder="look_"
          />
          <button type="submit">Send ↵</button>
        </div>
        <small id={`${id}-hint`}>
          Demo commands: look, explore, attack, loot, go ruins. Availability
          follows the current scenario.
        </small>
        {error && (
          <p role="alert" id={`${id}-error`}>
            {error}
          </p>
        )}
      </form>
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
