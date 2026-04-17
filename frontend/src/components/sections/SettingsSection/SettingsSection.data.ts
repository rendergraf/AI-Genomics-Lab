/**
 * SettingsSection Component Data Model
 *
 * Bioinformatics-grade configuration model for genome indexing pipelines.
 * Designed for reproducibility, provenance tracking, and multi-database integration.
 *
 * @module
 * @version 2.0.0
 * @author Xavier Araque
 */

import { Database, HardDrive, FolderOpen, Cpu } from 'lucide-react'

import type {
  PipelineConfig,
  ServiceConnection,
  ReferenceGenomeOption,
  VariantCallerOption,
  SettingsSectionPipelineConfigKey,
} from './SettingsSection.types'

/* =========================================================
   🧩 SERVICES LAYER
========================================================= */

export const SETTINGS_SECTION_SERVICES: ServiceConnection[] = [
  { name: 'Neo4j', icon: Database, status: 'connected' },
  { name: 'PostgreSQL', icon: HardDrive, status: 'connected' },
  { name: 'MinIO', icon: FolderOpen, status: 'connected' },
  { name: 'API', icon: Cpu, status: 'connected' },
]

/* =========================================================
   🧬 REFERENCE GENOME REGISTRY (CORE DATA LAYER)
========================================================= */

export interface ReferenceGenome {
  id: string
  name: string
  assembly: string
  species: string
  source: 'Ensembl' | 'NCBI' | 'UCSC'

  file: string
  url: string
  checksumUrl?: string

  sizeMB?: number
  recommended?: boolean

  indexed?: boolean
  indexedAt?: string
}

export const REFERENCE_GENOMES: ReferenceGenome[] = [
  {
    id: 'hg38',
    name: 'Homo sapiens (GRCh38 / hg38)',
    assembly: 'GRCh38',
    species: 'Homo sapiens',
    source: 'Ensembl',
    recommended: true,

    file: 'Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz',
    url: 'https://ftp.ensembl.org/pub/current_fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz',
    checksumUrl: 'https://ftp.ensembl.org/pub/current_fasta/homo_sapiens/dna/CHECKSUMS',

    sizeMB: 841,
  },
  {
    id: 'hg19',
    name: 'Homo sapiens (GRCh37 / hg19)',
    assembly: 'GRCh37',
    species: 'Homo sapiens',
    source: 'UCSC',

    file: 'hg19.fa.gz',
    url: 'https://hgdownload.soe.ucsc.edu/goldenPath/hg19/bigZips/hg19.fa.gz',

    sizeMB: 3200,
  },
]

/* =========================================================
   🎛 UI OPTIONS (DERIVED FROM REGISTRY)
========================================================= */

export const SETTINGS_SECTION_REFERENCE_GENOMES: ReferenceGenomeOption[] =
  REFERENCE_GENOMES.map((g) => ({
    value: g.id,
    label: `${g.id} (${g.assembly})`,
  }))

/* =========================================================
   🧬 VARIANT CALLERS
========================================================= */

export const SETTINGS_SECTION_VARIANT_CALLERS: VariantCallerOption[] = [
  { value: 'bcftools', label: 'bcftools (fast)' },
  { value: 'gatk', label: 'GATK (clinical-grade)' },
  { value: 'freebayes', label: 'FreeBayes (population)' },
]

/* =========================================================
   ⚙️ PIPELINE CONFIGS (BIOINFORMATICS PROFILES)
========================================================= */

export const SETTINGS_SECTION_PIPELINE_CONFIGS: Record<
  SettingsSectionPipelineConfigKey,
  PipelineConfig
> = {
  defaults: {
    referenceGenome: 'hg38',
    variantCaller: 'bcftools',
    qualityThreshold: '30',
    minCoverage: '10',
  },

  lowQuality: {
    referenceGenome: 'hg38',
    variantCaller: 'bcftools',
    qualityThreshold: '20',
    minCoverage: '5',
  },

  clinical: {
    referenceGenome: 'hg19',
    variantCaller: 'gatk',
    qualityThreshold: '50',
    minCoverage: '20',
  },

  population: {
    referenceGenome: 'hg38',
    variantCaller: 'freebayes',
    qualityThreshold: '40',
    minCoverage: '15',
  },
}

/* =========================================================
   🧠 FULL EXPORT BUNDLE
========================================================= */

export const SETTINGS_SECTION_DATA = {
  services: SETTINGS_SECTION_SERVICES,

  referenceGenomes: SETTINGS_SECTION_REFERENCE_GENOMES,
  referenceGenomeRegistry: REFERENCE_GENOMES,

  variantCallers: SETTINGS_SECTION_VARIANT_CALLERS,

  pipelineConfigs: SETTINGS_SECTION_PIPELINE_CONFIGS,
  defaults: SETTINGS_SECTION_PIPELINE_CONFIGS.defaults,
} as const