/**
 * Select Types Module
 * 
 * Defines TypeScript types, interfaces for the Select component.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import * as React from "react";

// ============================================
// Select Types - Types and interfaces
// ============================================

/**
 * Select size variants.
 */
export type SelectSize = "sm" | "md" | "lg";

/**
 * Select visual style variants.
 */
export type SelectVariant = "default" | "error";

/**
 * Select option interface.
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select props interface.
 */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size" | "onChange"> {
  variant?: SelectVariant;
  selectSize?: SelectSize;
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  placeholderValue?: string;
  onChange?: (value: string) => void;
  labelClassName?: string;
}

// ============================================
// Select Variant Styles
// ============================================

/**
 * Select variant styles configuration
 */
export const selectVariants = {
  variant: {
    default: "border-gray-300 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-300",
    error: "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-300",
  },
  size: {
    sm: "h-8 px-2 text-sm",
    md: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base",
  },
} as const;

/**
 * Helper to build select variant classes
 */
export function getSelectVariantClasses(params: {
  variant?: SelectVariant;
  selectSize?: SelectSize;
  error?: boolean;
}): string {
  const { variant = "default", selectSize = "md", error = false } = params;
  
  const classes: string[] = [
    "w-full rounded-md border bg-background transition-colors duration-200 outline-none",
    selectVariants.variant[error ? "error" : variant],
    selectVariants.size[selectSize],
  ];
  
  return classes.join(" ");
}