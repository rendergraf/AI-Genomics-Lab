import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./index";
import { Button } from "../Button";

/**
 * Card Component Stories
 */
const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Card component for displaying content in a container.

## Features
- **Variants**: default (shadow), outline
- **Padding Options**: none, sm, md, lg
- **Sections**: Header, Title, Description, Content, Footer
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default card with all sections
 */
export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-200">Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur, modi tenetur corrupti iure vel repellendus excepturi amet dignissimos cum nobis numquam architecto velit eum adipisci accusantium, suscipit sint recusandae? Nihil.</p>
      </CardContent>
      <CardFooter>
        <Button size="lg">Action</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Outline variant
 */
export const Outline: Story = {
  args: {
    variant: "outline",
  },
  render: () => (
    <Card variant="outline">
      <CardHeader>
        <CardTitle>Outline Card</CardTitle>
        <CardDescription>Card with outline border</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Content goes here</p>
      </CardContent>
    </Card>
  ),
};

/**
 * Card with different padding
 */
export const PaddingSm: Story = {
  args: {
    padding: "sm",
  },
  render: () => (
    <Card padding="sm">
      <CardTitle>Small Padding</CardTitle>
      <CardContent>
        <p className="text-gray-600">Less padding</p>
      </CardContent>
    </Card>
  ),
};

export const PaddingLg: Story = {
  args: {
    padding: "lg",
  },
  render: () => (
    <Card padding="lg">
      <CardTitle>Large Padding</CardTitle>
      <CardContent>
        <p className="text-gray-600">More padding</p>
      </CardContent>
    </Card>
  ),
};

/**
 * Card without padding
 */
export const NoPadding: Story = {
  args: {
    padding: "none",
  },
  render: () => (
    <Card padding="none" className="bg-gray-50">
      <div className="p-6">
        <CardTitle>No Padding</CardTitle>
        <CardContent>
          <p className="text-gray-600">Custom padding</p>
        </CardContent>
      </div>
    </Card>
  ),
};
