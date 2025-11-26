import type { Meta, StoryObj } from "@storybook/react";
import { GameHeader } from "./GameHeader";
import { StatsProvider } from "../../providers/StatsProvider";
import { StorageProvider } from "../../providers/StorageProvider";

const meta: Meta<typeof GameHeader> = {
  title: "Game/GameHeader",
  component: GameHeader,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <StorageProvider>
        <StatsProvider>
          <Story />
        </StatsProvider>
      </StorageProvider>
    ),
  ],
  argTypes: {
    mistakes: { control: { type: "number", min: 0, max: 4 } },
    maxMistakes: { control: { type: "number", min: 1, max: 10 } },
    gameStatus: { control: "select", options: ["playing", "won", "lost"] },
    puzzleDate: { control: "text" },
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


