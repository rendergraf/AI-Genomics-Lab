import type { Meta, StoryObj } from "@storybook/react";
import { AlignGenomeSection, SETTINGS_SECTION_DATA } from "./index";

/**
 * AlignGenomeSection Component Stories
 * 
 * Uses AlignGenomeSection.data.ts model to avoid hardcoded values.
 */
const meta = {
  title: "Components/AlignGenomeSection",
  component: AlignGenomeSection,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AlignGenomeSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialConfig: SETTINGS_SECTION_DATA.defaults,
  },
};

export const Clinical: Story = {
  args: {
    initialConfig: SETTINGS_SECTION_DATA.pipelineConfigs.clinical,
  },
};

export const LowQuality: Story = {
  args: {
    initialConfig: SETTINGS_SECTION_DATA.pipelineConfigs.lowQuality,
  },
};

export const Population: Story = {
  args: {
    initialConfig: SETTINGS_SECTION_DATA.pipelineConfigs.population,
  },
};