/**
 * StatCard Component Data Model
 * 
 * Contains all the data variants, sizes, and test cases
 * for the StatCard component stories.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { StatCardIconSize } from "./StatCard.types";

/**
 * Available icon sizes
 */
export const STATCARD_ICON_SIZES: StatCardIconSize[] = ["sm", "default", "lg"];

/**
 * Sample label texts for stories
 */
export const STATCARD_LABELS = {
  samples: "Samples",
  analyses: "Analyses",
  genes: "Genes",
  mutations: "Mutations",
} as const;

/**
 * Sample values for stories
 */
export const STATCARD_VALUES = {
  low: 100,
  medium: 1250,
  high: 15000,
  veryHigh: 1000000,
} as const;

/**
 * StatCard state variants for testing different states
 */
export const STATCARD_STATES = {
  default: {
    isLoading: false,
  },
  loading: {
    isLoading: true,
  },
} as const;

/**
 * Complete StatCard configuration for stories
 */
export const STATCARD_DATA = {
  iconSizes: STATCARD_ICON_SIZES,
  labels: STATCARD_LABELS,
  values: STATCARD_VALUES,
  states: STATCARD_STATES,
  defaults: {
    iconSize: "default" as const,
  },
} as const;

export type StatCardStateKey = keyof typeof STATCARD_STATES;
export type StatCardLabelKey = keyof typeof STATCARD_LABELS;
export type StatCardValueKey = keyof typeof STATCARD_VALUES;