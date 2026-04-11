/**
 * Select Design Tokens Module
 * 
 * Contains design tokens for select styling including size layers,
 * state layers, and label styles.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { SelectSize, SelectVariant } from "./Select.types";

// ============================================
// Select Design Tokens - Style layers
// ============================================

/**
 * Size layer CSS classes for each select size.
 */
export const sizeLayer: Record<SelectSize, string> = {
  sm: "h-8 px-2 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

/**
 * Container layer CSS classes for each variant.
 */
export const containerLayer: Record<SelectVariant, string> = {
  default: "border-gray-300",
  error: "border-red-500",
};

/**
 * State layer CSS classes for different states.
 */
export const stateLayer = {
  default: "focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-300",
  error: "focus:border-red-500 focus:ring-2 focus:ring-red-300",
  disabled: "disabled:bg-muted disabled:opacity-50 disabled:cursor-not-allowed",
} as const;

/**
 * Focus ring layer CSS classes.
 */
export const focusRingLayer = {
  default: "focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-300",
  error: "focus:border-red-500 focus:ring-2 focus:ring-red-300",
} as const;

/**
 * Label layer CSS classes.
 */
export const labelLayer = {
  base: "block text-sm font-medium mb-2",
  required: "after:content-['*'] after:ml-1 after:text-red-500",
  optional: "after:content-['(optional)'] after:ml-1 after:text-muted-foreground after:text-xs",
} as const;

/**
 * Helper text layer CSS classes.
 */
export const helperTextLayer = {
  base: "text-xs mt-1",
  default: "text-muted-foreground",
  error: "text-red-500",
} as const;
