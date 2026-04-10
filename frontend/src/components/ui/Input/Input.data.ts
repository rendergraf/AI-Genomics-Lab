/**
 * Input Component Data Model
 * 
 * Contains all the data variants, sizes, color schemes, and test cases
 * for the Input component stories.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { InputColorScheme, InputSize, InputVariant } from "./Input.types";

/**
 * Available input visual variants
 */
export const INPUT_VARIANTS: InputVariant[] = ["solid", "outline", "ghost"];

/**
 * Available input sizes
 */
export const INPUT_SIZES: InputSize[] = ["xs", "sm", "md", "lg", "xl"];

/**
 * Available input color schemes
 */
export const INPUT_COLOR_SCHEMES: InputColorScheme[] = [
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
];

/**
 * Supported file extensions for genomic data
 */
export const INPUT_FILE_ACCEPT = {
  fastq: ".fastq,.fastq.gz,.fq,.fq.gz",
  fasta: ".fa,.fasta,.fa.gz,.fasta.gz",
  vcf: ".vcf,.vcf.gz",
  genome: ".fa,.fasta,.fa.gz,.fasta.gz,.bed,.gtf,.gtf.gz",
} as const;

/**
 * Input state variants for testing different states
 */
export const INPUT_STATES = {
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
 * Sample input placeholders for stories
 */
export const INPUT_SAMPLES = {
  text: "Enter text...",
  email: "email@example.com",
  search: "Search...",
  genomeName: "e.g., hg38",
  species: "e.g., Homo sapiens",
  build: "e.g., GRCh38",
  sampleId: "e.g., SRR1517848",
  geneSymbol: "e.g., BRCA1, TP53",
  mutationId: "e.g., c.68_69delAG",
} as const;

/**
 * Sample file names for stories
 */
export const INPUT_FILE_SAMPLES = {
  fastq: "sample_R1.fastq.gz",
  fasta: "hg38.fa.gz",
  vcf: "results.vcf",
} as const;

/**
 * Sample helper texts for stories
 */
export const INPUT_HELPERS = {
  default: "Enter a valid value",
  email: "We'll never share your email",
  genomeName: "Reference genome identifier (e.g., hg38)",
  sampleId: "SRA or local sample identifier",
} as const;

/**
 * Sample error messages for stories
 */
export const INPUT_ERRORS = {
  required: "This field is required",
  invalid: "Invalid value",
  fileTooLarge: "File size exceeds limit",
  unsupportedFormat: "Unsupported file format",
} as const;

/**
 * Complete input configuration for stories
 * Used to avoid hardcoding values in stories
 */
export const INPUT_DATA = {
  variants: INPUT_VARIANTS,
  sizes: INPUT_SIZES,
  colorSchemes: INPUT_COLOR_SCHEMES,
  states: INPUT_STATES,
  samples: INPUT_SAMPLES,
  fileAccept: INPUT_FILE_ACCEPT,
  helpers: INPUT_HELPERS,
  errors: INPUT_ERRORS,
  defaults: {
    variant: "solid" as const,
    inputSize: "md" as const,
    colorScheme: "primary" as const,
  },
} as const;

export type InputStateKey = keyof typeof INPUT_STATES;
export type InputSampleKey = keyof typeof INPUT_SAMPLES;
export type InputHelperKey = keyof typeof INPUT_HELPERS;
export type InputErrorKey = keyof typeof INPUT_ERRORS;
export type InputFileAcceptKey = keyof typeof INPUT_FILE_ACCEPT;