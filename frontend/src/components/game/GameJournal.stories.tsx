import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameJournal, type JournalView } from "./GameJournal";
import "../../App.css";
import "./ArcadeShell.css";

function JournalPreview() {
  const [view, setView] = useState<JournalView>("journal");
  const [value, setValue] = useState("");
  const [lines, setLines] = useState([
    "You entered the ruins beneath Nee'Peh.",
    "A skeleton blocks the passage.",
  ]);
  return (
    <div
      className="arcade-shell arcade-theme"
      style={{ maxWidth: 360, height: 640 }}
    >
      <GameJournal
        view={view}
        onViewChange={setView}
        value={value}
        onValueChange={setValue}
        lines={lines}
        placeholder="look, inventory"
        onCommand={(command) =>
          setLines((previous) => [...previous, `Command: ${command}`])
        }
      />
    </div>
  );
}

const meta = {
  title: "Game/Journal",
  component: JournalPreview,
} satisfies Meta<typeof JournalPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Interactive: Story = {};
