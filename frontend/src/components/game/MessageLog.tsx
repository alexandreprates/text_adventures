import { useEffect, useMemo, useRef } from "react";

type MessageLogProps = {
  lines: string[];
};

export function MessageLog({ lines }: MessageLogProps) {
  const logRef = useRef<HTMLPreElement | null>(null);
  const visibleLines = useMemo(() => (lines.length ? lines : [" "]), [lines]);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;

    log.scrollTop = log.scrollHeight;
  }, [visibleLines]);

  return (
    <section className="terminal-panel log-panel" aria-labelledby="log-title">
      <div className="panel-title" id="log-title">
        === LOG ==
      </div>
      <pre className="terminal-output message-log" ref={logRef} aria-live="polite">
        {visibleLines.map((line) => `> ${line || " "}`).join("\n")}
      </pre>
    </section>
  );
}
