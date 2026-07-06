type ResourceBarProps = {
  label: string;
  current: number;
  max: number;
  kind: "danger" | "mana" | "xp";
};

export function ResourceBar({ label, current, max, kind }: ResourceBarProps) {
  const width = 10;
  const ratio = max ? Math.max(0, Math.min(1, current / max)) : 0;
  const filled = Math.round(ratio * width);

  return (
    <div className={`bar-row ${kind}`}>
      <span>{label}</span>
      <span className="ascii-bar" aria-hidden="true">
        <span className="bar-bracket">[</span>
        <span className={`bar-fill-${kind}`}>{"|".repeat(filled)}</span>
        <span className="bar-empty">{" ".repeat(width - filled)}</span>
        <span className="bar-bracket">]</span>
      </span>
      <strong>
        {Math.floor(current)}/{Math.floor(max)}
      </strong>
    </div>
  );
}
