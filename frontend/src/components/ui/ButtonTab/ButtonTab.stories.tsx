import type { Meta, StoryObj } from "@storybook/react";
import { 
  Activity, Dna, Network, Database, Beaker, FolderOpen, Settings 
} from "lucide-react";
import { ButtonTab, BUTTONTAB_DATA } from "./index";

/**
 * ButtonTab Component Stories
 * 
 * Uses ButtonTab.data.ts model to avoid hardcoded values.
 */
const meta = {
  title: "Components/ButtonTab",
  component: ButtonTab,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: BUTTONTAB_DATA.variants,
    },
    size: {
      control: "select",
      options: BUTTONTAB_DATA.sizes,
    },
    isActive: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ButtonTab>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default tab (inactive)
 */
export const Default: Story = {
  args: {
    label: BUTTONTAB_DATA.tabs.dashboard.label,
    icon: Activity,
    isActive: false,
  },
};

/**
 * Active tab
 */
export const Active: Story = {
  args: {
    label: BUTTONTAB_DATA.tabs.dashboard.label,
    icon: Activity,
    isActive: true,
  },
};

/**
 * Tab without icon
 */
export const WithoutIcon: Story = {
  args: {
    label: "Settings",
    isActive: false,
  },
};

/**
 * Small size
 */
export const SmallSize: Story = {
  args: {
    label: BUTTONTAB_DATA.tabs.dashboard.label,
    icon: Activity,
    size: "sm",
    isActive: false,
  },
};

/**
 * Large size
 */
export const LargeSize: Story = {
  args: {
    label: BUTTONTAB_DATA.tabs.dashboard.label,
    icon: Activity,
    size: "lg",
    isActive: false,
  },
};

/**
 * All variants
 */
export const AllSizes: Story = {
  args: {
    label: "Tab",
    icon: Activity,
  },
  render: (args) => (
    <div className="flex flex-wrap gap-4">
      {BUTTONTAB_DATA.sizes.map((size) => (
        <ButtonTab key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

/**
 * Active states comparison
 */
export const ActiveStates: Story = {
  args: {
    label: "Dashboard",
    icon: Activity,
  },
  render: (args) => (
    <div className="flex gap-4">
      <ButtonTab {...args} isActive={false} label="Inactive" />
      <ButtonTab {...args} isActive={true} label="Active" />
    </div>
  ),
};

/**
 * Navigation tabs example
 */
export const NavigationTabs: Story = {
  args: {
    label: "Tab",
    icon: Activity,
  },
  render: (args) => (
    <div className="flex gap-1 border-b">
      <ButtonTab icon={Activity} label="Dashboard" isActive={true} />
      <ButtonTab icon={Dna} label="Variants" isActive={false} />
      <ButtonTab icon={Network} label="Knowledge" isActive={false} />
      <ButtonTab icon={Database} label="Genomes" isActive={false} />
      <ButtonTab icon={Beaker} label="Samples" isActive={false} />
      <ButtonTab icon={Settings} label="Settings" isActive={false} />
    </div>
  ),
};