/**
 * SettingsSection Component Types
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

import type { LucideIcon } from 'lucide-react'

export interface PipelineConfig {
  referenceGenome: string
  variantCaller: string
  qualityThreshold: string
  minCoverage: string
}

export interface ServiceConnection {
  name: string
  icon: LucideIcon
  status: 'connected' | 'disconnected'
}

export interface ReferenceGenomeOption {
  value: string
  label: string
}

export interface VariantCallerOption {
  value: string
  label: string
}

export type SettingsSectionPipelineConfigKey = 'defaults' | 'lowQuality' | 'clinical' | 'population'