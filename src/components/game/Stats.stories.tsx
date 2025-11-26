import type { Meta, StoryObj } from "@storybook/react-vite";
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
      gamesWon: 32,
      winRate: 76,
      currentStreak: 5,
      maxStreak: 12,
      lastPlayedDate: "2024-01-15",
      gameHistory: [],
    },
  },
};

export const NewPlayer: Story = {
  args: {
    stats: {
      gamesPlayed: 1,
      gamesWon: 1,
      winRate: 100,
      currentStreak: 1,
      maxStreak: 1,
      lastPlayedDate: "2024-01-15",
      gameHistory: [],
    },
  },
};

export const NoWins: Story = {
  args: {
    stats: {
      gamesPlayed: 10,
      gamesWon: 0,
      winRate: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: "2024-01-15",
      gameHistory: [],
    },
  },
};

export const PerfectRecord: Story = {
  args: {
    stats: {
      gamesPlayed: 100,
      gamesWon: 100,
      winRate: 100,
      currentStreak: 100,
      maxStreak: 100,
      lastPlayedDate: "2024-01-15",
      gameHistory: [],
    },
  },
};
