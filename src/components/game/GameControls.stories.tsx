import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameControls } from "./GameControls";

const meta: Meta<typeof GameControls> = {
  title: "Game/GameControls",
  component: GameControls,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onSubmit: { action: "submit" },
    onShuffle: { action: "shuffle" },
    onDeselect: { action: "deselect" },
    hasSelection: { control: "boolean" },
    canSubmit: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof GameControls>;

export const NoSelection: Story = {
  args: {
    hasSelection: false,
    canSubmit: false,
  },
};

export const PartialSelection: Story = {
  args: {
    hasSelection: true,
    canSubmit: false,
  },
};

export const CanSubmit: Story = {
  args: {
    hasSelection: true,
    canSubmit: true,
  },
};

