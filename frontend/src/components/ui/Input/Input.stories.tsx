import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Input } from "./index";

/**
 * Input Component Stories
 */
const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Input component for text entry.

## Features
- **Variants**: default, error
- **Sizes**: sm, md, lg
- **States**: default, error, success, disabled
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: {
      control: "boolean",
    },
    success: {
      control: "boolean",
    },
  },
  args: {
    onChange: fn(),
    placeholder: "Enter text...",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default input
 */
export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

/**
 * With label
 */
export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-72">
      <label className="text-sm font-medium text-gray-700">Email</label>
      <Input type="email" placeholder="email@example.com" />
    </div>
  ),
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    error: "This field is required",
    placeholder: "Enter email",
  },
};

/**
 * Success state
 */
export const Success: Story = {
  args: {
    success: true,
    placeholder: "Valid input",
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled input",
  },
};

/**
 * Size variants
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-72">
      <Input inputSize="sm" placeholder="Small" />
      <Input inputSize="md" placeholder="Medium" />
      <Input inputSize="lg" placeholder="Large" />
    </div>
  ),
};

/**
 * Input types
 */
export const Types: Story = {
  render: () => (
    <div className="space-y-4 w-72">
      <Input type="text" placeholder="Text" />
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
    </div>
  ),
};
