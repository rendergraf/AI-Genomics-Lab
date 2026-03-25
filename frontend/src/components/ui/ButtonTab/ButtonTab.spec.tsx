import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Activity } from "lucide-react";
import { ButtonTab } from "./ButtonTab";
import { describe, it, expect, vi } from "vitest";

/**
 * ButtonTab Component Test Suite
 */
describe("ButtonTab", () => {
  /**
   * Basic rendering tests
   */
  it("renders button tab with label", () => {
    render(<ButtonTab label="Dashboard" onClick={() => {}} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders button tab with icon and label", () => {
    render(<ButtonTab label="Dashboard" icon={Activity} onClick={() => {}} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders as a button element", () => {
    render(<ButtonTab label="Test" onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  /**
   * Active state tests
   */
  it("renders active state correctly", () => {
    render(<ButtonTab label="Dashboard" icon={Activity} isActive={true} onClick={() => {}} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-primary", "text-primary");
  });

  it("renders inactive state correctly", () => {
    render(<ButtonTab label="Dashboard" icon={Activity} isActive={false} onClick={() => {}} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-muted-foreground");
  });

  /**
   * Size tests
   */
  it("renders small size", () => {
    render(<ButtonTab label="Test" icon={Activity} size="sm" onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders default size", () => {
    render(<ButtonTab label="Test" icon={Activity} size="default" onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders large size", () => {
    render(<ButtonTab label="Test" icon={Activity} size="lg" onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  /**
   * Click handler tests
   */
  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<ButtonTab label="Test" onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  /**
   * Icon rendering tests
   */
  it("does not render icon when not provided", () => {
    render(<ButtonTab label="Test" onClick={() => {}} />);
    // Should still have a button but no icon
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBe(0);
  });

  it("renders icon when provided", () => {
    render(<ButtonTab label="Test" icon={Activity} onClick={() => {}} />);
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBe(1);
  });

  /**
   * Custom className tests
   */
  it("applies custom className", () => {
    render(
      <ButtonTab 
        label="Test" 
        icon={Activity} 
        onClick={() => {}} 
        className="custom-class" 
      />
    );
    expect(document.querySelector(".custom-class")).toBeInTheDocument();
  });

  /**
   * Accessibility tests
   */
  it("has proper button role", () => {
    render(<ButtonTab label="Test" onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});