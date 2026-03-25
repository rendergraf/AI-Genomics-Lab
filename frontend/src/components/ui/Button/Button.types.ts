/**
 * Button Types Module
 * 
 * Defines TypeScript types, interfaces, and CVA (Class Variance Authority)
 * configurations for the Button component.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { VariantProps } from "class-variance-authority";
import { Size, Variant, ColorScheme } from "@/tokens";
import * as React from "react";
import { cva } from "class-variance-authority";

// ============================================
// Button Types - Types and interfaces separated
// ============================================

/**
 * Button size variants mapped from design tokens.
 * 
 * @typedef {Size}
 * @see {@link Size} for available sizes
 */
export type ButtonSize = Size;

/**
 * Button visual style variants.
 * 
 * @typedef {Variant}
 * @see {@link Variant} for available variants
 */
export type ButtonVariant = Variant;

/**
 * Button color scheme options mapped from design tokens.
 * 
 * @typedef {ColorScheme}
 * @see {@link ColorScheme} for available color schemes
 */
export type ButtonColorScheme = ColorScheme;

/**
 * Spinner (loading indicator) placement within the button.
 * 
 * @typedef {("start" | "end")}
 */
export type SpinnerPlacement = "start" | "end";

// ============================================
// Button Variant Styles - CVA with Tailwind
// ============================================

/**
 * Class Variance Authority (CVA) configuration for button styles.
 * Defines base classes and variant-specific styling rules.
 * 
 * @example
 * ```ts
 * const variants = buttonVariants({ variant: 'solid', size: 'lg', colorScheme: 'primary' })
 * ```
 */
export const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap font-electrolize font-medium uppercase tracking-widest transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "overflow-visible px-4 py-2 text-shadow-md hover:text-shadow-lg",
        outline: "overflow-visible px-4 py-2 text-shadow-md hover:text-shadow-lg",
        ghost: "overflow-visible px-4 py-2 text-shadow-md hover:text-shadow-lg",
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base",
      },
      colorScheme: {
        primary: "focus-visible:ring-blue-500",
        secondary: "focus-visible:ring-slate-500",
        success: "focus-visible:ring-green-500",
        warning: "focus-visible:ring-amber-500",
        danger: "focus-visible:ring-red-500",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "lg",
      colorScheme: "primary",
    },
  }
);

// ============================================
// Button Props Interface
// ============================================

/**
 * Props for the Button component.
 * 
 * Extends native HTML button attributes plus CVA variant props.
 * 
 * @interface
 * @extends {React.ButtonHTMLAttributes<HTMLButtonElement>}
 * @extends {VariantProps<typeof buttonVariants>}
 * 
 * @property {SpinnerPlacement} [spinnerPlacement] - Where to position the loading spinner
 * @property {boolean} [loading] - Whether to show loading state
 * @property {React.ReactNode} [loadingText] - Text to display during loading (replaces children)
 * @property {React.ReactNode} [spinner] - Custom spinner element
 * @property {boolean} [asChild] - Whether to render as child component using Radix Slot
 * 
 * @example
 * ```tsx
 * <Button
 *   variant="outline"
 *   size="lg"
 *   colorScheme="success"
 *   loading={isSubmitting}
 *   onClick={handleClick}
 * >
 *   Submit
 * </Button>
 * ```
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  spinnerPlacement?: SpinnerPlacement;
  loading?: boolean;
  loadingText?: React.ReactNode;
  spinner?: React.ReactNode;
  asChild?: boolean;
}