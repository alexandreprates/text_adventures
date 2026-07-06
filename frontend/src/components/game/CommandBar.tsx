import { useRef, useState } from "react";

type CommandBarProps = {
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onSubmitCommand: (command: string) => void;
};

export function CommandBar({
  placeholder,
  value,
  onValueChange,
  onSubmitCommand,
}: CommandBarProps) {
  const historyRef = useRef<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [draft, setDraft] = useState("");

  function submit(command: string) {
    const normalized = command.trim();
    if (!normalized) return;

    if (historyRef.current[historyRef.current.length - 1] !== normalized) {
      historyRef.current = [...historyRef.current, normalized];
    }
    setHistoryIndex(historyRef.current.length);
    setDraft("");
    onValueChange("");
    onSubmitCommand(normalized);
  }

  function recall(direction: number) {
    if (!historyRef.current.length) return;

    const atEnd = historyIndex === historyRef.current.length;
    const nextDraft = atEnd ? value : draft;
    const nextIndex = Math.max(0, Math.min(historyRef.current.length, historyIndex + direction));

    setDraft(nextDraft);
    setHistoryIndex(nextIndex);
    onValueChange(historyRef.current[nextIndex] || nextDraft);
  }

  return (
    <form
      className="command-bar"
      onSubmit={(event) => {
        event.preventDefault();
        submit(value);
      }}
    >
      <label htmlFor="command-input">COMMAND</label>
      <input
        id="command-input"
        name="command"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            recall(-1);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            recall(1);
          }
        }}
      />
      <button type="submit">Send</button>
    </form>
  );
}
