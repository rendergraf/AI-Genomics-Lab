/**
 * ButtonTab Component Data Model
 * 
 * Contains all the data variants, sizes, and test cases
 * for the ButtonTab component stories.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { ButtonTabSize, ButtonTabVariant } from "./ButtonTab.types";

/**
 * Available button tab variants
 */
export const BUTTONTAB_VARIANTS: ButtonTabVariant[] = ["default", "active"];

/**
 * Available button tab sizes
 */
export const BUTTONTAB_SIZES: ButtonTabSize[] = ["sm", "default", "lg"];

/**
 * Sample tab data for stories
 */
export const BUTTONTAB_TABS = {
  dashboard: { label: "Dashboard", icon: "Activity" },
  variants: { label: "Variants", icon: "Dna" },
  knowledge: { label: "Knowledge Graph", icon: "Network" },
  genomes: { label: "Reference Genomes", icon: "Database" },
  samples: { label: "Samples/Tests", icon: "Beaker" },
  analysis: { label: "Analysis", icon: "Beaker" },
  genome: { label: "Genome Browser", icon: "FolderOpen" },
  settings: { label: "Settings", icon: "Settings" },
} as const;

/**
 * ButtonTab state variants for testing different states
 */
export const BUTTONTAB_STATES = {
  default: {
    isActive: false,
  },
  active: {
    isActive: true,
  },
} as const;

/**
 * Complete ButtonTab configuration for stories
 */
export const BUTTONTAB_DATA = {
  variants: BUTTONTAB_VARIANTS,
  sizes: BUTTONTAB_SIZES,
  tabs: BUTTONTAB_TABS,
  states: BUTTONTAB_STATES,
  defaults: {
    variant: "default" as const,
    size: "default" as const,
  },
} as const;

export type ButtonTabStateKey = keyof typeof BUTTONTAB_STATES;
export type ButtonTabTabKey = keyof typeof BUTTONTAB_TABS;