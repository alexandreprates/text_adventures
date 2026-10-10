import type { Meta, StoryObj } from "@storybook/react-vite";
import { DungeonActions } from "./DungeonActions";
import "../../App.css";
import "./ArcadeShell.css";

const meta = {
  title: "Game/Dungeon actions",
  component: DungeonActions,
  decorators: [
    (Story) => (
      <div
        className="arcade-shell arcade-theme"
        style={{ height: "auto", padding: 12 }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    primaryLabel: "Explore",
    primaryIcon: "arrow",
    potions: 3,
    healDisabled: false,
    healHint: "Restore health",
    townDisabled: false,
    townHint: "Return to town",
    onPrimary: () => undefined,
    onHeal: () => undefined,
    onTown: () => undefined,
  },
} satisfies Meta<typeof DungeonActions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Exploration: Story = {};
export const Combat: Story = {
  args: {
    primaryLabel: "Attack",
    primaryIcon: "sword",
    townDisabled: true,
    townHint: "Finish combat before returning to town",
  },
};
export const Loot: Story = {
  args: {
    primaryLabel: "Collect",
    primaryIcon: "coin",
    potions: 0,
    healDisabled: true,
    healHint: "No potions remaining",
  },
};
