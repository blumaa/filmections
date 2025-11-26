import type { Meta, StoryObj } from "@storybook/react";
import { FilmGrid } from "./FilmGrid";
import type { Film } from "../../types";

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

const meta: Meta<typeof FilmGrid> = {
  title: "Game/FilmGrid",
  component: FilmGrid,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    onSelectFilm: { action: "selected" },
  },
};

export default meta;
type Story = StoryObj<typeof FilmGrid>;

export const Default: Story = {
  args: {
    films: mockFilms,
    selectedFilmIds: [],
    isShaking: false,
  },
};

export const WithSelections: Story = {
  args: {
    films: mockFilms,
    selectedFilmIds: [1, 5, 9, 13],
    isShaking: false,
  },
};

export const ThreeSelections: Story = {
  args: {
    films: mockFilms,
    selectedFilmIds: [2, 6, 10],
    isShaking: false,
  },
};

export const TwelveFilms: Story = {
  args: {
    films: mockFilms.slice(0, 12),
    selectedFilmIds: [],
    isShaking: false,
  },
};

export const EightFilms: Story = {
  args: {
    films: mockFilms.slice(0, 8),
    selectedFilmIds: [],
    isShaking: false,
  },
};

export const FourFilms: Story = {
  args: {
    films: mockFilms.slice(0, 4),
    selectedFilmIds: [],
    isShaking: false,
  },
};

