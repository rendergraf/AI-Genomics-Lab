/**
 * StatCard Types Module
 * 
 * Defines TypeScript types, interfaces, and CVA (Class Variance Authority)
 * configurations for the StatCard component.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cva } from "class-variance-authority";

// ============================================
// StatCard Types
// ============================================

/**
 * Icon size variants
 */
export type StatCardIconSize = "sm" | "default" | "lg";

// ============================================
// StatCard Variant Styles - CVA with Tailwind
// ============================================

/**
 * Class Variance Authority (CVA) configuration for StatCard styles.
 * Defines base classes and variant-specific styling rules.
 */
export const statCardVariants = cva(
  "p-6 bg-card bg-zinc-900/50 shadow-xl",
  {
    variants: {
      iconSize: {
        sm: "",
        default: "",
        lg: "",
      },
    },
    defaultVariants: {
      iconSize: "default",
    },
  }
);

// ============================================
// StatCard Props Interface
// ============================================

/**
 * Props for the StatCard component
 */
export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  /**
   * Icon component to display (Lucide icon)
   */
  icon: React.ComponentType<{ className?: string }>;
  /**
   * Label text describing the statistic
   */
  label: string;
  /**
   * Numeric value to display
   */
  value: number;
  /**
   * Whether to show loading state
   * @default false
   */
  isLoading?: boolean;
}