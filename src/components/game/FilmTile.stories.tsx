import type { Meta, StoryObj } from "@storybook/react";
import { FilmTile } from "./FilmTile";
import type { Film } from "../../types";

const mockFilm: Film = {
  id: 1,
  title: "The Shawshank Redemption",
  year: 1994,
};

const meta: Meta<typeof FilmTile> = {
  title: "Game/FilmTile",
  component: FilmTile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isSelected: { control: "boolean" },
    isShaking: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof FilmTile>;

export const Default: Story = {
  args: {
    film: mockFilm,
    isSelected: false,
    isShaking: false,
  },
};

export const Selected: Story = {
  args: {
    film: mockFilm,
    isSelected: true,
    isShaking: false,
  },
};

export const Shaking: Story = {
  args: {
    film: mockFilm,
    isSelected: true,
    isShaking: true,
  },
};

export const LongTitle: Story = {
  args: {
    film: {
      id: 2,
      title: "The Lord of the Rings: The Return of the King",
      year: 2003,
    },
    isSelected: false,
    isShaking: false,
  },
};

export const ShortTitle: Story = {
  args: {
    film: {
      id: 3,
      title: "Jaws",
      year: 1975,
    },
    isSelected: false,
    isShaking: false,
  },
};

