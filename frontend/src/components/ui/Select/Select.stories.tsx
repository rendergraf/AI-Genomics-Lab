import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Select } from "./index";

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Select component for choosing from options.

## Features
- **Variants**: default, error
- **Sizes**: sm, md, lg
- **States**: default, error, disabled
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    selectSize: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    onChange: fn(),
    options: [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
      { value: "option3", label: "Option 3" },
    ],
  },
} as Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "-- Select an option --",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-72">
      <Select
        label="Select Option"
        placeholder="Choose..."
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
          { value: "option3", label: "Option 3" },
        ]}
      />
    </div>
  ),
};

export const Error: Story = {
  args: {
    error: "Please select an option",
    placeholder: "-- Select an option --",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "-- Select an option --",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="w-72 space-y-4">
      <Select
        selectSize="sm"
        placeholder="Small"
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ]}
      />
      <Select
        selectSize="md"
        placeholder="Medium"
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ]}
      />
      <Select
        selectSize="lg"
        placeholder="Large"
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ]}
      />
    </div>
  ),
};

export const WithHelperText: Story = {
  args: {
    helperText: "Choose from the available options",
    placeholder: "-- Select an option --",
  },
};

export const FileSelect: Story = {
  render: () => (
    <div className="w-72">
      <Select
        label="Sample File"
        placeholder="-- Select a sample --"
        options={[
          { value: "sample1", label: "sample1.fastq.gz (1.2GB)" },
          { value: "sample2", label: "sample2.fastq.gz (2.5GB)" },
          { value: "sample3", label: "sample3.fasta.gz (800MB)" },
        ]}
      />
    </div>
  ),
};