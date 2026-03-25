import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button, BUTTON_DATA } from "./index";

/**
 * Button Component Stories
 * 
 * Uses Button.data.ts model to avoid hardcoded values.
 */
const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: BUTTON_DATA.variants,
    },
    size: {
      control: "select",
      options: BUTTON_DATA.sizes,
    },
    colorScheme: {
      control: "select",
      options: BUTTON_DATA.colorSchemes,
    },
    disabled: {
      control: "boolean",
    },
    loading: {
      control: "boolean",
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Solid variant - Default button style
 */
export const Solid: Story = {
  args: {
    variant: BUTTON_DATA.defaults.variant,
    children: BUTTON_DATA.samples.short,
  },
};

/**
 * Outline variant
 */
export const Outline: Story = {
  args: {
    variant: "outline",
    children: BUTTON_DATA.samples.short,
  },
};

/**
 * Ghost variant
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: BUTTON_DATA.samples.short,
  },
};

/**
 * Loading state with loading text
 */
export const Loading: Story = {
  args: {
    ...BUTTON_DATA.states.loading,
    children: BUTTON_DATA.samples.medium,
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    ...BUTTON_DATA.states.disabled,
    children: BUTTON_DATA.samples.short,
  },
};

/**
 * Small size variant
 */
export const Small: Story = {
  args: {
    size: "sm",
    children: BUTTON_DATA.samples.short,
  },
};

/**
 * Large size variant
 */
export const Large: Story = {
  args: {
    size: "lg",
    children: BUTTON_DATA.samples.medium,
  },
};

/**
 * Success color scheme
 */
export const Success: Story = {
  args: {
    colorScheme: "success",
    children: BUTTON_DATA.samples.medium,
  },
};

/**
 * Warning color scheme
 */
export const Warning: Story = {
  args: {
    colorScheme: "warning",
    children: BUTTON_DATA.samples.medium,
  },
};

/**
 * Danger color scheme
 */
export const Danger: Story = {
  args: {
    colorScheme: "danger",
    children: BUTTON_DATA.samples.medium,
  },
};

/**
 * Secondary color scheme
 */
export const Secondary: Story = {
  args: {
    colorScheme: "secondary",
    children: BUTTON_DATA.samples.medium,
  },
};

/**
 * AsChild - Render as child component (e.g., anchor link)
 */
export const AsChild: Story = {
  args: {
    asChild: true,
    children: BUTTON_DATA.samples.link,
  },
  render: (args) => (
    <Button {...args} asChild>
      <a href="/">{BUTTON_DATA.samples.link}</a>
    </Button>
  ),
};

/**
 * All variants grid - Shows all available variants at once
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {BUTTON_DATA.variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

/**
 * All sizes grid - Shows all available sizes at once
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {BUTTON_DATA.sizes.map((size) => (
        <Button key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

/**
 * All color schemes grid - Shows all available color schemes at once
 */
export const AllColorSchemes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {BUTTON_DATA.colorSchemes.map((colorScheme) => (
        <Button key={colorScheme} colorScheme={colorScheme}>
          {colorScheme}
        </Button>
      ))}
    </div>
  ),
};
