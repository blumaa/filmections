import type { Meta, StoryObj } from "@storybook/react";
import { Stats } from "./Stats";

const meta: Meta<typeof Stats> = {
  title: "Game/Stats",
  component: Stats,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Stats>;

export const Default: Story = {
  args: {
    stats: {
      gamesPlayed: 42,
      winRate: 76,
      currentStreak: 5,
      maxStreak: 12,
    },
  },
};

export const NewPlayer: Story = {
  args: {
    stats: {
      gamesPlayed: 1,
      winRate: 100,
      currentStreak: 1,
      maxStreak: 1,
    },
  },
};

export const NoWins: Story = {
  args: {
    stats: {
      gamesPlayed: 10,
      winRate: 0,
      currentStreak: 0,
      maxStreak: 0,
    },
  },
};

export const PerfectRecord: Story = {
  args: {
    stats: {
      gamesPlayed: 100,
      winRate: 100,
      currentStreak: 100,
      maxStreak: 100,
    },
  },
};
