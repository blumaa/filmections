import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameHeader } from "./GameHeader";

const meta: Meta<typeof GameHeader> = {
  title: "Game/GameHeader",
  component: GameHeader,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    gameStatus: { control: "select", options: ["playing", "won", "lost"] },
    puzzleDate: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof GameHeader>;

export const Playing: Story = {
  args: {
    gameStatus: "playing",
    puzzleDate: "2024-01-15",
  },
};

export const NoPuzzleDate: Story = {
  args: {
    gameStatus: "playing",
  },
};

export const Won: Story = {
  args: {
    gameStatus: "won",
    puzzleDate: "2024-01-15",
  },
};

export const Lost: Story = {
  args: {
    gameStatus: "lost",
    puzzleDate: "2024-01-15",
  },
};

