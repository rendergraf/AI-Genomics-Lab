/**
 * Button Design Tokens Module
 * 
 * Contains design tokens for button styling including border layers,
 * container layers, text layers, and spinner sizes.
 * 
 * These tokens define the visual appearance for different color schemes
 * and variant combinations, enabling consistent theming across the UI.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { ButtonColorScheme, ButtonVariant, ButtonSize } from "./Button.types";

// ============================================
// Button Design Tokens - Style layers
// ============================================

/**
 * Border layer CSS classes for each color scheme and variant.
 * Creates a subtle 3D border effect with hover states.
 * 
 * @constant
 * @type {Record<ButtonColorScheme, Record<ButtonVariant, string>>}
 * 
 * @example
 * ```ts
 * // Using border layer
 * <span className={borderLayer.primary.solid}>
 * ```
 */
export const borderLayer: Record<ButtonColorScheme, Record<ButtonVariant, string>> = {
  primary: {
    solid: "bg-zinc-400 group-hover:bg-lime-200",
    outline: "bg-transparent group-hover:bg-zinc-400",
    ghost: "bg-zinc-400 group-hover:bg-lime-200",
  },
  secondary: {
    solid: "bg-slate-300 group-hover:bg-slate-400",
    outline: "bg-slate-300 group-hover:bg-slate-400",
    ghost: "bg-slate-300 group-hover:bg-slate-400",
  },
  success: {
    solid: "bg-green-700 group-hover:bg-green-800",
    outline: "bg-green-600 group-hover:bg-green-700",
    ghost: "bg-green-700 group-hover:bg-green-800",
  },
  warning: {
    solid: "bg-amber-600 group-hover:bg-amber-700",
    outline: "bg-amber-500 group-hover:bg-amber-600",
    ghost: "bg-amber-600 group-hover:bg-amber-700",
  },
  danger: {
    solid: "bg-red-700 group-hover:bg-red-800",
    outline: "bg-red-600 group-hover:bg-red-700",
    ghost: "bg-red-700 group-hover:bg-red-800",
  },
};

/**
 * Main container layer CSS classes for each color scheme and variant.
 * Defines the primary background styling with hover states.
 * 
 * @constant
 * @type {Record<ButtonColorScheme, Record<ButtonVariant, string>>}
 * 
 * @example
 * ```ts
 * // Using container layer
 * <span className={containerLayer.primary.solid}>
 * ```
 */
export const containerLayer: Record<ButtonColorScheme, Record<ButtonVariant, string>> = {
  primary: {
    solid: "bg-zinc-700 group-hover:bg-zinc-600",
    outline: "bg-transparent group-hover:bg-zinc-600",
    ghost: "bg-transparent group-hover:bg-blue-600/10",
  },
  secondary: {
    solid: "bg-slate-200 group-hover:bg-slate-300",
    outline: "bg-transparent group-hover:bg-slate-200/10",
    ghost: "bg-transparent group-hover:bg-slate-200/10",
  },
  success: {
    solid: "bg-green-600 group-hover:bg-green-700",
    outline: "bg-transparent group-hover:bg-green-600/10",
    ghost: "bg-transparent group-hover:bg-green-600/10",
  },
  warning: {
    solid: "bg-amber-500 group-hover:bg-amber-600",
    outline: "bg-transparent group-hover:bg-amber-500/10",
    ghost: "bg-transparent group-hover:bg-amber-500/10",
  },
  danger: {
    solid: "bg-red-600 group-hover:bg-red-700",
    outline: "bg-transparent group-hover:bg-red-600/10",
    ghost: "bg-transparent group-hover:bg-red-600/10",
  },
};

/**
 * Text layer CSS classes for each color scheme and variant.
 * Controls text color with hover states for visual feedback.
 * 
 * @constant
 * @type {Record<ButtonColorScheme, Record<ButtonVariant, string>>}
 * 
 * @example
 * ```ts
 * // Using text layer
 * <span className={textLayer.primary.solid}>
 * ```
 */
export const textLayer: Record<ButtonColorScheme, Record<ButtonVariant, string>> = {
  primary: {
    solid: "text-gray-50 group-hover:text-blue-100",
    outline: "text-gray-50 group-hover:text-gray-200",
    ghost: "text-blue-600 group-hover:text-blue-700",
  },
  secondary: {
    solid: "text-slate-900 group-hover:text-slate-950",
    outline: "text-slate-500 group-hover:text-slate-600",
    ghost: "text-slate-500 group-hover:text-slate-600",
  },
  success: {
    solid: "text-green-50 group-hover:text-green-100",
    outline: "text-green-600 group-hover:text-green-700",
    ghost: "text-green-600 group-hover:text-green-700",
  },
  warning: {
    solid: "text-amber-950 group-hover:text-amber-900",
    outline: "text-amber-500 group-hover:text-amber-600",
    ghost: "text-amber-500 group-hover:text-amber-600",
  },
  danger: {
    solid: "text-red-50 group-hover:text-red-100",
    outline: "text-red-600 group-hover:text-red-700",
    ghost: "text-red-600 group-hover:text-red-700",
  },
};

/**
 * Spinner size CSS classes mapped to button sizes.
 * Controls the size of the loading spinner based on button size.
 * 
 * @constant
 * @type {Record<ButtonSize, string>}
 * 
 * @example
 * ```ts
 * // Using spinner size
 * const size = spinnerSizeMap['lg']; // "h-5 w-5"
 * ```
 * 
 * @see {@link ButtonSize} for available sizes
 */
export const spinnerSizeMap: Record<ButtonSize, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-6 w-6",
};
