import type { Meta, StoryObj } from "@storybook/react-vite";
import { MistakesIndicator } from "./MistakesIndicator";

const meta: Meta<typeof MistakesIndicator> = {
  title: "Game/MistakesIndicator",
  component: MistakesIndicator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    mistakes: { control: { type: "number", min: 0, max: 4 } },
    maxMistakes: { control: { type: "number", min: 1, max: 10 } },
  },
};

export default meta;
type Story = StoryObj<typeof MistakesIndicator>;

export const NoMistakes: Story = {
  args: {
    mistakes: 0,
    maxMistakes: 4,
  },
};

export const OneMistake: Story = {
  args: {
    mistakes: 1,
    maxMistakes: 4,
  },
};

export const TwoMistakes: Story = {
  args: {
    mistakes: 2,
    maxMistakes: 4,
  },
};

export const ThreeMistakes: Story = {
  args: {
    mistakes: 3,
    maxMistakes: 4,
  },
};

export const AllMistakes: Story = {
  args: {
    mistakes: 4,
    maxMistakes: 4,
  },
};

