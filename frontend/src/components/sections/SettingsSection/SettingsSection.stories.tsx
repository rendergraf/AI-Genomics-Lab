import type { Meta, StoryObj } from "@storybook/react";
import { SettingsSection, SETTINGS_SECTION_DATA } from "./index";

/**
 * SettingsSection Component Stories
 * 
 * Uses SettingsSection.data.ts model to avoid hardcoded values.
 */
const meta = {
  title: "Components/SettingsSection",
  component: SettingsSection,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SettingsSection>;

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