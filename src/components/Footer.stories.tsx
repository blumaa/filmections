import type { Meta, StoryObj } from "@storybook/react-vite";
import { Footer } from "./Footer";
import { MockThemeProvider } from "../../.storybook/MockThemeProvider";

const meta: Meta<typeof Footer> = {
  title: "Components/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MockThemeProvider>
        <div style={{ minHeight: "200px", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }} />
          <Story />
        </div>
      </MockThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {};
