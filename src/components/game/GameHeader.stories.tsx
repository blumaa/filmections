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
    mistakes: { control: { type: "number", min: 0, max: 4 } },
    maxMistakes: { control: { type: "number", min: 1, max: 10 } },
    gameStatus: { control: "select", options: ["playing", "won", "lost"] },
    puzzleDate: { control: "text" },
    onViewStats: { action: "viewStats" },
  },
};

export default meta;
type Story = StoryObj<typeof GameHeader>;

export const Playing: Story = {
  args: {
    mistakes: 0,
    maxMistakes: 4,
    gameStatus: "playing",
    puzzleDate: "2024-01-15",
  },
};

export const NoPuzzleDate: Story = {
  args: {
    mistakes: 0,
    maxMistakes: 4,
    gameStatus: "playing",
  },
};

export const Won: Story = {
  args: {
    mistakes: 2,
    maxMistakes: 4,
    gameStatus: "won",
    puzzleDate: "2024-01-15",
    onViewStats: () => {},
  },
};

export const Lost: Story = {
  args: {
    mistakes: 4,
    maxMistakes: 4,
    gameStatus: "lost",
    puzzleDate: "2024-01-15",
    onViewStats: () => {},
  },
};

