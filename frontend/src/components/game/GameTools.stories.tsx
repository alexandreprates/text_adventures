import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameTools } from "./GameTools";
import "../../App.css";

const meta = {
  title: "Game/GameTools",
  component: GameTools,
  args: { scene: "town" },
} satisfies Meta<typeof GameTools>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Town: Story = {};
export const Dungeon: Story = { args: { scene: "ruins" } };
