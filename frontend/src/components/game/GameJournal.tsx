import { useEffect, useRef } from "react";
import { CommandBar } from "./CommandBar";

export type JournalView = "journal" | "terminal";

export function GameJournal({
  view,
  onViewChange,
  lines,
  value,
  onValueChange,
  onCommand,
  placeholder,
}: {
  view: JournalView;
  onViewChange: (view: JournalView) => void;
  lines: string[];
  value: string;
  onValueChange: (value: string) => void;
  onCommand: (command: string) => void;
  placeholder: string;
}) {
  const output = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (output.current) output.current.scrollTop = output.current.scrollHeight;
  }, [lines, view]);

  return (
    <section
      className="arcade-journal flex min-h-0 flex-1 flex-col"
      aria-label="Adventure journal and terminal"
    >
      <nav className="arcade-tabs flex" aria-label="Journal views">
        <button
          type="button"
          aria-pressed={view === "journal"}
          onClick={() => onViewChange("journal")}
        >
          Journal
        </button>
        <button
          type="button"
          aria-pressed={view === "terminal"}
          onClick={() => onViewChange("terminal")}
        >
          Terminal
        </button>
      </nav>
      <div
        className={`arcade-log min-h-0 flex-1 overflow-y-auto ${view === "terminal" ? "is-terminal" : ""}`}
        ref={output}
        tabIndex={0}
        aria-label={view === "terminal" ? "Terminal output" : "Journal entries"}
      >
        <h2>
          {view === "terminal" ? "Command terminal" : "Adventure journal"}
        </h2>
        {lines.length ? (
          <ol
            className="arcade-timeline message-log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {lines.map((line, index) => (
              <li
                key={`${index}-${line}`}
                className={line.startsWith("!") ? "is-error" : undefined}
              >
                {view === "journal" ? (
                  <span className="arcade-entry-index">
                    [{" "}
                    {index === lines.length - 1
                      ? "NOW"
                      : String(index + 1).padStart(3, "0")}{" "}
                    ]
                  </span>
                ) : null}
                <p>{line}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted">Your adventure will appear here.</p>
        )}
      </div>
      <div hidden={view !== "terminal"}>
        <CommandBar
          placeholder={placeholder}
          value={value}
          onValueChange={onValueChange}
          onSubmitCommand={onCommand}
        />
      </div>
    </section>
  );
}
