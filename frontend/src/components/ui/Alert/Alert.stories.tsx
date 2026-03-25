import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertTitle, AlertDescription } from "./index";

/**
 * Alert Component Stories
 */
const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Alert component for displaying important messages.

## Features
- **Variants**: info, warning, success, error
- **Customizable Icon**: Can show/hide icon or use custom icon
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "warning", "success", "error"],
    },
    showIcon: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Info alert (default)
 */
export const Info: Story = {
  render: () => (
    <Alert variant="info">
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>This is an informational message for the user.</AlertDescription>
    </Alert>
  ),
};

/**
 * Warning alert
 */
export const Warning: Story = {
  render: () => (
    <Alert variant="warning">
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>Please review your input before continuing.</AlertDescription>
    </Alert>
  ),
};

/**
 * Success alert
 */
export const Success: Story = {
  render: () => (
    <Alert variant="success">
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Your changes have been saved successfully.</AlertDescription>
    </Alert>
  ),
};

/**
 * Error alert
 */
export const Error: Story = {
  render: () => (
    <Alert variant="error">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again.</AlertDescription>
    </Alert>
  ),
};

/**
 * Alert without icon
 */
export const NoIcon: Story = {
  args: {
    showIcon: false,
  },
  render: () => (
    <Alert variant="info" showIcon={false}>
      <AlertDescription>Alert without icon</AlertDescription>
    </Alert>
  ),
};

/**
 * Alert with description only
 */
export const DescriptionOnly: Story = {
  render: () => (
    <Alert variant="info">
      <AlertDescription>This is just a description without a title.</AlertDescription>
    </Alert>
  ),
};

/**
 * All alert variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="info">
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>Informational message</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Warning message</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Success message</AlertDescription>
      </Alert>
      <Alert variant="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Error message</AlertDescription>
      </Alert>
    </div>
  ),
};
