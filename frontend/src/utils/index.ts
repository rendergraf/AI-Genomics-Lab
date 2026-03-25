/**
 * Design System - Core Utilities
 * 
 * Generic helpers for the Design System
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Type guard to check if value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Type guard to check if string is not empty
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Pick only defined properties from object
 */
export function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isDefined(value)) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/**
 * Create a reactive style object from CSS variables
 */
export function createCSSVariableResolver(prefix: string = '--color') {
  return (name: string): string => {
    return `hsl(var(${prefix}-${name}))`;
  };
}

/**
 * Format token name to CSS variable name
 */
export function toCSSVariableName(token: string, prefix?: string): string {
  const prefixPart = prefix ? `${prefix}-` : '';
  return `--${prefixPart}${token}`;
}

/**
 * Create HSL color string from HSL components
 */
export function hsl(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

/**
 * Parse HSL string to components
 */
export function parseHSL(hslString: string): { h: number; s: number; l: number } | null {
  const match = hslString.match(/^(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%$/);
  if (!match) return null;
  
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output: Record<string, unknown> = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      
      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        output[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else {
        output[key] = sourceValue as unknown;
      }
    }
  }
  
  return output as T;
}

/**
 * Create a style object from color configuration
 */
export function createColorStyles(
  fill: string,
  hover: string,
  text: string,
  border: string
) {
  return {
    container: {
      backgroundColor: fill,
      borderColor: border,
    },
    hover: {
      backgroundColor: hover,
    },
    text: {
      color: text,
    },
  };
}

/**
 * Array of color scheme names
 */
export const COLOR_SCHEMES = ['primary', 'secondary', 'success', 'warning', 'danger'] as const;

/**
 * Array of size names
 */
export const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

/**
 * Array of variant names
 */
export const VARIANTS = ['solid', 'outline', 'ghost'] as const;

export default {
  cn,
  isDefined,
  isNonEmptyString,
  pickDefined,
  createCSSVariableResolver,
  toCSSVariableName,
  hsl,
  parseHSL,
  deepMerge,
  createColorStyles,
};
