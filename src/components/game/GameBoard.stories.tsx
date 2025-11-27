import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { GameBoard } from "./GameBoard";
import { useGameStore } from "../../store/gameStore";
import { ToastProvider } from "../../providers/ToastProvider";
import { MockThemeProvider } from "../../../.storybook/MockThemeProvider";
import type { Film, Group } from "../../types";

const mockFilms: Film[] = [
  { id: 1, title: "Pulp Fiction", year: 1994 },
  { id: 2, title: "Kill Bill", year: 2003 },
  { id: 3, title: "Reservoir Dogs", year: 1992 },
  { id: 4, title: "Django Unchained", year: 2012 },
  { id: 5, title: "The Godfather", year: 1972 },
  { id: 6, title: "Goodfellas", year: 1990 },
  { id: 7, title: "Casino", year: 1995 },
  { id: 8, title: "Scarface", year: 1983 },
  { id: 9, title: "Inception", year: 2010 },
  { id: 10, title: "The Matrix", year: 1999 },
  { id: 11, title: "Tenet", year: 2020 },
  { id: 12, title: "Memento", year: 2000 },
  { id: 13, title: "Interstellar", year: 2014 },
  { id: 14, title: "Arrival", year: 2016 },
  { id: 15, title: "2001: A Space Odyssey", year: 1968 },
  { id: 16, title: "Contact", year: 1997 },
];

const mockGroups: Group[] = [
  {
    id: "1",
    films: mockFilms.slice(0, 4),
    connection: "Directed by Quentin Tarantino",
    difficulty: "easy",
    color: "yellow",
  },
  {
    id: "2",
    films: mockFilms.slice(4, 8),
    connection: "Classic mob films",
    difficulty: "medium",
    color: "green",
  },
  {
    id: "3",
    films: mockFilms.slice(8, 12),
    connection: "Mind-bending narratives",
    difficulty: "hard",
    color: "blue",
  },
  {
    id: "4",
    films: mockFilms.slice(12, 16),
    connection: "Films about human connection across space/time",
    difficulty: "hardest",
    color: "purple",
  },
];

// Helper to initialize store state
function StoreInitializer({
  films,
  groups,
  foundGroups = [],
  selectedFilmIds = [],
  mistakes = 0,
  gameStatus = "playing",
}: {
  films: Film[];
  groups: Group[];
  foundGroups?: Group[];
  selectedFilmIds?: number[];
  mistakes?: number;
  gameStatus?: "playing" | "won" | "lost";
}) {
  useEffect(() => {
    useGameStore.setState({
      films,
      groups,
      foundGroups,
      selectedFilmIds,
      mistakes,
      gameStatus,
      isShaking: false,
      notification: null,
      puzzleDate: "2024-01-15",
      previousGuesses: [],
      isLoading: false,
    });
  }, [films, groups, foundGroups, selectedFilmIds, mistakes, gameStatus]);

  return null;
}

const meta: Meta<typeof GameBoard> = {
  title: "Game/GameBoard",
  component: GameBoard,
  parameters: {
    layout: "center",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MockThemeProvider>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </MockThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GameBoard>;

export const Playing: Story = {
  decorators: [
    (Story) => (
      <>
        <StoreInitializer films={mockFilms} groups={mockGroups} />
        <Story />
      </>
    ),
  ],
};

export const WithSelections: Story = {
  decorators: [
    (Story) => (
      <>
        <StoreInitializer
          films={mockFilms}
          groups={mockGroups}
          selectedFilmIds={[1, 2, 3]}
        />
        <Story />
      </>
    ),
  ],
};

export const WithFoundGroup: Story = {
  decorators: [
    (Story) => (
      <>
        <StoreInitializer
          films={mockFilms.slice(4)}
          groups={mockGroups}
          foundGroups={[mockGroups[0]]}
        />
        <Story />
      </>
    ),
  ],
};

export const TwoGroupsFound: Story = {
  decorators: [
    (Story) => (
      <>
        <StoreInitializer
          films={mockFilms.slice(8)}
          groups={mockGroups}
          foundGroups={[mockGroups[0], mockGroups[1]]}
          mistakes={1}
        />
        <Story />
      </>
    ),
  ],
};

export const WithMistakes: Story = {
  decorators: [
    (Story) => (
      <>
        <StoreInitializer films={mockFilms} groups={mockGroups} mistakes={3} />
        <Story />
      </>
    ),
  ],
};

export const Completed: Story = {
  args: {
    onViewStats: () => {},
  },
  decorators: [
    (Story) => (
      <>
        <StoreInitializer
          films={[]}
          groups={mockGroups}
          foundGroups={mockGroups}
          gameStatus="won"
          mistakes={2}
        />
        <Story />
      </>
    ),
  ],
};

