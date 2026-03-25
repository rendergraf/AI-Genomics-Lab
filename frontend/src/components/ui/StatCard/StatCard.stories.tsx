import type { Meta, StoryObj } from "@storybook/react";
import { Dna, Beaker, Network, Activity } from "lucide-react";
import { StatCard, STATCARD_DATA } from "./index";

/**
 * StatCard Component Stories
 * 
 * Uses StatCard.data.ts model to avoid hardcoded values.
 */
const meta = {
  title: "Components/StatCard",
  component: StatCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    iconSize: {
      control: "select",
      options: STATCARD_DATA.iconSizes,
    },
    isLoading: {
      control: "boolean",
    },
    value: {
      control: "number",
    },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default stat card with Samples
 */
export const Samples: Story = {
  args: {
    icon: Dna,
    label: STATCARD_DATA.labels.samples,
    value: STATCARD_DATA.values.medium,
    isLoading: false,
  },
};

/**
 * Stat card with Analyses
 */
export const Analyses: Story = {
  args: {
    icon: Beaker,
    label: STATCARD_DATA.labels.analyses,
    value: STATCARD_DATA.values.low,
    isLoading: false,
  },
};

/**
 * Stat card with Genes
 */
export const Genes: Story = {
  args: {
    icon: Network,
    label: STATCARD_DATA.labels.genes,
    value: STATCARD_DATA.values.high,
    isLoading: false,
  },
};

/**
 * Stat card with Mutations
 */
export const Mutations: Story = {
  args: {
    icon: Activity,
    label: STATCARD_DATA.labels.mutations,
    value: STATCARD_DATA.values.veryHigh,
    isLoading: false,
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    icon: Dna,
    label: STATCARD_DATA.labels.samples,
    value: 0,
    isLoading: true,
  },
};

/**
 * Small icon size
 */
export const SmallIcon: Story = {
  args: {
    icon: Dna,
    label: STATCARD_DATA.labels.samples,
    value: STATCARD_DATA.values.medium,
    iconSize: "sm",
  },
};

/**
 * Large icon size
 */
export const LargeIcon: Story = {
  args: {
    icon: Dna,
    label: STATCARD_DATA.labels.samples,
    value: STATCARD_DATA.values.medium,
    iconSize: "lg",
  },
};

/**
 * All icon sizes grid
 */
export const AllIconSizes: Story = {
  args: {
    icon: Dna,
    label: "Icon Size",
    value: 1250,
  },
  render: (args) => (
    <div className="flex flex-wrap gap-4">
      {STATCARD_DATA.iconSizes.map((size) => (
        <StatCard
          key={size}
          {...args}
          iconSize={size}
        />
      ))}
    </div>
  ),
};

/**
 * All labels grid
 */
export const AllLabels: Story = {
  args: {
    icon: Dna,
    label: "Label",
    value: 1250,
  },
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <StatCard icon={Dna} label={STATCARD_DATA.labels.samples} value={STATCARD_DATA.values.medium} />
      <StatCard icon={Beaker} label={STATCARD_DATA.labels.analyses} value={STATCARD_DATA.values.low} />
      <StatCard icon={Network} label={STATCARD_DATA.labels.genes} value={STATCARD_DATA.values.high} />
      <StatCard icon={Activity} label={STATCARD_DATA.labels.mutations} value={STATCARD_DATA.values.veryHigh} />
    </div>
  ),
};