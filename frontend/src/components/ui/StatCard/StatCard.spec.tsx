import React from "react";
import { render, screen } from "@testing-library/react";
import { Dna, Beaker, Network, Activity } from "lucide-react";
import { StatCard } from "./StatCard";
import { describe, it, expect } from "vitest";

/**
 * StatCard Component Test Suite
 * Tests for all StatCard variants, sizes, and states
 */
describe("StatCard", () => {
  /**
   * Basic rendering tests
   */
  it("renders stat card with all props", () => {
    render(
      <StatCard icon={Dna} label="Samples" value={1250} isLoading={false} />
    );
    expect(screen.getByText("Samples")).toBeInTheDocument();
    expect(screen.getByText("1,250")).toBeInTheDocument();
  });

  it("renders icon correctly", () => {
    render(<StatCard icon={Dna} label="Test" value={100} />);
    const icon = screen.getByRole("img");
    expect(icon).toBeInTheDocument();
  });

  /**
   * Icon size tests
   */
  describe("iconSizes", () => {
    it("renders sm icon size", () => {
      render(
        <StatCard icon={Dna} label="Test" value={100} iconSize="sm" />
      );
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("renders default icon size", () => {
      render(
        <StatCard icon={Dna} label="Test" value={100} iconSize="default" />
      );
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("renders lg icon size", () => {
      render(
        <StatCard icon={Dna} label="Test" value={100} iconSize="lg" />
      );
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });

  /**
   * Loading state tests
   */
  it("renders loading state", () => {
    render(
      <StatCard icon={Dna} label="Samples" value={0} isLoading={true} />
    );
    expect(screen.getByText("Samples")).toBeInTheDocument();
    // Loading should show a skeleton/pulse element
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("does not show skeleton when not loading", () => {
    render(
      <StatCard icon={Dna} label="Samples" value={100} isLoading={false} />
    );
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).not.toBeInTheDocument();
  });

  /**
   * Value formatting tests
   */
  it("formats large numbers with commas", () => {
    render(<StatCard icon={Dna} label="Test" value={1000000} />);
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
  });

  it("formats medium numbers with commas", () => {
    render(<StatCard icon={Dna} label="Test" value={12500} />);
    expect(screen.getByText("12,500")).toBeInTheDocument();
  });

  it("formats small numbers without commas", () => {
    render(<StatCard icon={Dna} label="Test" value={100} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  /**
   * Different icons tests
   */
  it("renders with Beaker icon", () => {
    render(<StatCard icon={Beaker} label="Analyses" value={50} />);
    expect(screen.getByText("Analyses")).toBeInTheDocument();
  });

  it("renders with Network icon", () => {
    render(<StatCard icon={Network} label="Genes" value={2847} />);
    expect(screen.getByText("Genes")).toBeInTheDocument();
  });

  it("renders with Activity icon", () => {
    render(<StatCard icon={Activity} label="Mutations" value={15234} />);
    expect(screen.getByText("Mutations")).toBeInTheDocument();
  });

  /**
   * Custom className tests
   */
  it("applies custom className", () => {
    render(
      <StatCard
        icon={Dna}
        label="Test"
        value={100}
        className="custom-class"
      />
    );
    const container = document.querySelector(".custom-class");
    expect(container).toBeInTheDocument();
  });

  /**
   * Additional props tests
   */
  it("handles additional HTML attributes", () => {
    render(
      <StatCard
        icon={Dna}
        label="Test"
        value={100}
        data-testid="stat-card"
      />
    );
    expect(screen.getByTestId("stat-card")).toBeInTheDocument();
  });
});