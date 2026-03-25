/**
 * Button Component Data Model
 * 
 * Contains all the data variants, sizes, color schemes, and test cases
 * for the Button component stories.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { ButtonColorScheme, ButtonSize, ButtonVariant } from "./Button.types";

/**
 * Available button visual variants
 */
export const BUTTON_VARIANTS: ButtonVariant[] = ["solid", "outline", "ghost"];

/**
 * Available button sizes
 */
export const BUTTON_SIZES: ButtonSize[] = ["xs", "sm", "md", "lg", "xl"];

/**
 * Available button color schemes
 */
export const BUTTON_COLOR_SCHEMES: ButtonColorScheme[] = [
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
];

/**
 * Button state variants for testing different states
 */
export const BUTTON_STATES = {
  default: {
    loading: false,
    disabled: false,
  },
  loading: {
    loading: true,
    loadingText: "Loading...",
    disabled: false,
  },
  disabled: {
    loading: false,
    disabled: true,
  },
} as const;

/**
 * Sample button texts for stories
 */
export const BUTTON_SAMPLES = {
  short: "Click me",
  medium: "Submit Form",
  long: "Perform Action Now",
  icon: "→",
  link: "Go Home",
} as const;

/**
 * Complete button configuration for stories
 * Used to avoid hardcoding values in stories
 */
export const BUTTON_DATA = {
  variants: BUTTON_VARIANTS,
  sizes: BUTTON_SIZES,
  colorSchemes: BUTTON_COLOR_SCHEMES,
  states: BUTTON_STATES,
  samples: BUTTON_SAMPLES,
  defaults: {
    variant: "solid" as const,
    size: "xl" as const,
    colorScheme: "primary" as const,
  },
} as const;

export type ButtonStateKey = keyof typeof BUTTON_STATES;
export type ButtonSampleKey = keyof typeof BUTTON_SAMPLES;