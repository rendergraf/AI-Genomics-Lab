/**
 * Input Types Module
 * 
 * Defines TypeScript types, interfaces for the Input component.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import * as React from "react";

// ============================================
// Input Types - Types and interfaces
// ============================================

/**
 * Input size variants.
 */
export type InputSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Input visual style variants.
 */
export type InputVariant = "solid" | "outline" | "ghost";

/**
 * Input color scheme options.
 */
export type InputColorScheme = "primary" | "secondary" | "success" | "warning" | "danger";

/**
 * Input type variants.
 */
export type InputType = "text" | "file" | "select" | "textarea" | "password" | "email" | "number" | "search" | "tel" | "url";

// ============================================
// Input Props Interface
// ============================================

/**
 * Props for the Input component.
 * 
 * @interface
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  colorScheme?: InputColorScheme;
  label?: string;
  error?: string;
  helperText?: string;
  showLabel?: boolean;
  labelClassName?: string;
}

// ============================================
// Label Props
// ============================================

/**
 * Props for the InputLabel component.
 */
export interface InputLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
}

// ============================================
// Input Variant Styles
// ============================================

/**
 * CVA configuration for input styles - kept as simple config object for compatibility
 */
export const inputVariants = {
  variant: {
    solid: "",
    outline: "border-2",
    ghost: "bg-muted border-0",
  },
  size: {
    xs: "h-8 px-2 text-xs",
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-4 text-base",
    xl: "h-14 px-6 text-base",
  },
  colorScheme: {
    primary: "focus-visible:ring-2 focus-visible:ring-primary",
    secondary: "focus-visible:ring-2 focus-visible:ring-slate-500",
    success: "focus-visible:ring-2 focus-visible:ring-green-500",
    warning: "focus-visible:ring-2 focus-visible:ring-amber-500",
    danger: "focus-visible:ring-2 focus-visible:ring-red-500",
  },
} as const;

/**
 * Helper to build input variant classes
 */
export function getInputVariantClasses(params: {
  variant?: InputVariant;
  inputSize?: InputSize;
  colorScheme?: InputColorScheme;
  error?: boolean;
}): string {
  const { variant = "solid", inputSize = "md", colorScheme = "primary", error = false } = params;
  
  const classes: string[] = [
    "w-full rounded-md border bg-background transition-colors duration-200 outline-none",
    inputVariants.variant[variant],
    inputVariants.size[inputSize],
    inputVariants.colorScheme[colorScheme],
  ];
  
  if (error) {
    classes.push("border-red-500 focus-visible:ring-red-500");
  }
  
  return classes.join(" ");
}