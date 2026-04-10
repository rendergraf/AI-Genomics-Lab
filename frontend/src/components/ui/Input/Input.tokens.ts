/**
 * Input Design Tokens Module
 * 
 * Contains design tokens for input styling including size layers,
 * state layers, and label styles.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { InputColorScheme, InputSize, InputVariant } from "./Input.types";

// ============================================
// Input Design Tokens - Style layers
// ============================================

/**
 * Size layer CSS classes for each input size.
 * 
 * @constant
 */
export const sizeLayer: Record<InputSize, string> = {
  xs: "h-8 px-2 text-xs",
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-4 text-base",
  xl: "h-14 px-6 text-base",
};

/**
 * Container layer CSS classes for each variant.
 * 
 * @constant
 */
export const containerLayer: Record<InputVariant, string> = {
  solid: "border border-input bg-background",
  outline: "border-2 border-input bg-background",
  ghost: "border-0 bg-muted",
};

/**
 * State layer CSS classes for different states.
 * 
 * @constant
 */
export const stateLayer = {
  default: "focus:border-primary focus:ring-2 focus:ring-primary/20",
  error: "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
  success: "border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20",
  disabled: "disabled:bg-muted disabled:opacity-50 disabled:cursor-not-allowed",
} as const;

/**
 * Label layer CSS classes.
 * 
 * @constant
 */
export const labelLayer = {
  base: "block text-sm font-medium mb-2",
  required: "after:content-['*'] after:ml-1 after:text-red-500",
  optional: "after:content-['(optional)'] after:ml-1 after:text-muted-foreground after:text-xs",
} as const;

/**
 * Helper text layer CSS classes.
 * 
 * @constant
 */
export const helperTextLayer = {
  base: "text-xs mt-1",
  default: "text-muted-foreground",
  error: "text-red-500",
  success: "text-green-500",
} as const;

/**
 * Focus ring layer CSS classes for each color scheme.
 * 
 * @constant
 */
export const focusRingLayer: Record<InputColorScheme, string> = {
  primary: "focus-visible:ring-2 focus-visible:ring-primary/50",
  secondary: "focus-visible:ring-2 focus-visible:ring-slate-500/50",
  success: "focus-visible:ring-2 focus-visible:ring-green-500/50",
  warning: "focus-visible:ring-2 focus-visible:ring-amber-500/50",
  danger: "focus-visible:ring-2 focus-visible:ring-red-500/50",
} as const;

/**
 * File input layer CSS classes.
 * 
 * @constant
 */
export const fileInputLayer = {
  container: "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors",
  containerDragging: "border-primary bg-primary/5",
  containerError: "border-red-500",
  icon: "h-8 w-8 mx-auto text-muted-foreground mb-2",
  text: "text-sm",
  subtext: "text-xs text-muted-foreground",
} as const;