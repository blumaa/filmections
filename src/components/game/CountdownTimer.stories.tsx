import type { Meta, StoryObj } from "@storybook/react-vite";
import { CountdownTimer } from "./CountdownTimer";

const meta: Meta<typeof CountdownTimer> = {
  title: "Game/CountdownTimer",
  component: CountdownTimer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CountdownTimer>;

export const Default: Story = {};
