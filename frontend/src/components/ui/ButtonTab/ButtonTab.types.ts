/**
 * ButtonTab Types Module
 * 
 * Defines TypeScript types, interfaces, and CVA (Class Variance Authority)
 * configurations for the ButtonTab component.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cva } from "class-variance-authority";

// ============================================
// ButtonTab Types
// ============================================

/**
 * ButtonTab variant styles
 */
export type ButtonTabVariant = "default" | "active";

/**
 * ButtonTab size options
 */
export type ButtonTabSize = "sm" | "default" | "lg";

// ============================================
// ButtonTab Variant Styles - CVA with Tailwind
// ============================================

/**
 * Class Variance Authority (CVA) configuration for ButtonTab styles.
 */
export const buttonTabVariants = cva(
  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "text-muted-foreground hover:text-foreground",
        active: "border-b-2 border-primary text-primary",
      },
      size: {
        sm: "px-3 py-2 text-xs",
        default: "px-4 py-3 text-sm",
        lg: "px-5 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ============================================
// ButtonTab Props Interface
// ============================================

/**
 * Props for the ButtonTab component
 */
export interface ButtonTabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonTabVariants> {
  /**
   * Icon component to display (Lucide icon)
   */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Tab label text
   */
  label: string;
  /**
   * Whether the tab is currently active
   */
  isActive?: boolean;
}