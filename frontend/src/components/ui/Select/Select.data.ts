/**
 * Select Component Data Model
 * 
 * Contains all the data variants, sizes, and test cases
 * for the Select component stories.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { SelectSize, SelectVariant, SelectOption } from "./Select.types";

/**
 * Available select visual variants
 */
export const SELECT_VARIANTS: SelectVariant[] = ["default", "error"];

/**
 * Available select sizes
 */
export const SELECT_SIZES: SelectSize[] = ["sm", "md", "lg"];

/**
 * Sample select options for genomic data
 */
export const SELECT_OPTIONS: SelectOption[] = [
  { value: "sample1", label: "Sample 1 (1.2GB)" },
  { value: "sample2", label: "Sample 2 (2.5GB)" },
  { value: "sample3", label: "Sample 3 (800MB)" },
];

/**
 * Sample file options for stories
 */
export const SELECT_FILE_OPTIONS: SelectOption[] = [
  { value: "file1", label: "file1.fastq.gz (1.2GB)" },
  { value: "file2", label: "file2.fastq.gz (2.5GB)" },
  { value: "file3", label: "file3.fasta.gz (800MB)" },
];

/**
 * Sample genome build options
 */
export const SELECT_GENOME_OPTIONS: SelectOption[] = [
  { value: "hg38", label: "hg38 (GRCh38)" },
  { value: "hg19", label: "hg19 (GRCh37)" },
  { value: "mm10", label: "mm10 (GRCm38)" },
];

/**
 * Sample species options
 */
export const SELECT_SPECIES_OPTIONS: SelectOption[] = [
  { value: "homo_sapiens", label: "Homo sapiens" },
  { value: "mus_musculus", label: "Mus musculus" },
  { value: "danio_rerio", label: "Danio rerio" },
];

/**
 * Select state variants for testing different states
 */
export const SELECT_STATES = {
  default: {
    error: false,
    disabled: false,
  },
  error: {
    error: true,
    disabled: false,
  },
  disabled: {
    error: false,
    disabled: true,
  },
} as const;

/**
 * Sample placeholders for stories
 */
export const SELECT_SAMPLES = {
  default: "-- Select an option --",
  sample: "-- Select a sample --",
  genome: "-- Select genome build --",
  species: "-- Select species --",
  file: "-- Select a file --",
} as const;

/**
 * Sample error messages for stories
 */
export const SELECT_ERRORS = {
  required: "Please select an option",
  invalid: "Invalid selection",
  noOptions: "No options available",
} as const;

/**
 * Sample helper texts for stories
 */
export const SELECT_HELPERS = {
  default: "Choose from the list",
  sample: "Select a sample to analyze",
  genome: "Reference genome identifier",
  species: "Organism for analysis",
  file: "Select a file to upload",
} as const;

/**
 * Complete select configuration for stories
 * Used to avoid hardcoding values in stories
 */
export const SELECT_DATA = {
  variants: SELECT_VARIANTS,
  sizes: SELECT_SIZES,
  states: SELECT_STATES,
  samples: SELECT_SAMPLES,
  helpers: SELECT_HELPERS,
  errors: SELECT_ERRORS,
  defaults: {
    variant: "default" as const,
    selectSize: "md" as const,
    placeholder: "-- Select an option --" as const,
  },
} as const;

export type SelectStateKey = keyof typeof SELECT_STATES;
export type SelectSampleKey = keyof typeof SELECT_SAMPLES;
export type SelectHelperKey = keyof typeof SELECT_HELPERS;
export type SelectErrorKey = keyof typeof SELECT_ERRORS;