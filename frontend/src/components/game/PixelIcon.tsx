export type PixelIconKind =
  "gate" | "sword" | "shield" | "potion" | "coin" | "arrow";

export function PixelIcon({ kind }: { kind: PixelIconKind }) {
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
