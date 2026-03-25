import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";
import { describe, it, expect, vi } from "vitest";

/**
 * Button Component Test Suite
 * Tests for all Button variants, sizes, colors, and states
 */
describe("Button", () => {
  /**
   * Basic rendering tests
   */
  it("renders button with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("renders as a button by default", () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
  });

  /**
   * Variant tests
   */
  describe("variants", () => {
    it("renders solid variant", () => {
      render(<Button variant="solid">Solid</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders subtle variant", () => {
      render(<Button variant="subtle">Subtle</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders surface variant", () => {
      render(<Button variant="surface">Surface</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders outline variant", () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders plain variant", () => {
      render(<Button variant="plain">Plain</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  /**
   * Size tests
   */
  describe("sizes", () => {
    it("renders 2xs size", () => {
      render(<Button size="2xs">Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders xs size", () => {
      render(<Button size="xs">Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders sm size", () => {
      render(<Button size="sm">Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders md size", () => {
      render(<Button size="md">Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders lg size", () => {
      render(<Button size="lg">Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders xl size", () => {
      render(<Button size="xl">Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders 2xl size", () => {
      render(<Button size="2xl">Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  /**
   * Color palette tests
   */
  describe("colorPalettes", () => {
    const colors = [
      "gray",
      "red",
      "orange",
      "yellow",
      "green",
      "teal",
      "blue",
      "cyan",
      "purple",
      "pink",
    ] as const;

    colors.forEach((color) => {
      it(`renders ${color} color palette`, () => {
        render(<Button colorPalette={color}>Button</Button>);
        expect(screen.getByRole("button")).toBeInTheDocument();
      });
    });
  });

  /**
   * Disabled state tests
   */
  it("renders disabled button", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("handles disabled prop correctly", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  /**
   * Loading state tests
   */
  it("renders loading state with spinner", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("renders loading state with loading text", () => {
    render(<Button loading loadingText="Saving...">
      Click me
    </Button>);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("shows spinner at start by default", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    // Check that the spinner is rendered
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows spinner at end when specified", () => {
    render(
      <Button loading spinnerPlacement="end">
        Loading
      </Button>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  /**
   * Click handler tests
   */
  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when loading", () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  /**
   * Custom spinner tests
   */
  it("renders custom spinner", () => {
    const customSpinner = <span data-testid="custom-spinner">Spinner</span>;
    render(
      <Button loading spinner={customSpinner}>
        Loading
      </Button>
    );
    expect(screen.getByTestId("custom-spinner")).toBeInTheDocument();
  });

  /**
   * asChild (Slot) tests
   */
  it("renders as child when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("Link Button");
  });

  /**
   * Additional props tests
   */
  it("applies custom className", () => {
    render(<Button className="custom-class">Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("applies type attribute", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("applies default type as button", () => {
    render(<Button>Button</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("handles additional HTML attributes", () => {
    render(<Button data-testid="test-button">Button</Button>);
    expect(screen.getByTestId("test-button")).toBeInTheDocument();
  });

  /**
   * Accessibility tests
   */
  it("has proper accessibility attributes when loading", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("has proper accessibility attributes when disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });
});
