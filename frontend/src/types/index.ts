export type TabType = 
  | 'dashboard' 
  | 'variants' 
  | 'knowledge' 
  | 'analysis' 
  | 'genome' 
  | 'settings' 
  | 'genomes' 
  | 'samples'

export type ServiceStatusType = 'running' | 'stopped' | 'error'

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

export type GenomeStatus = 'uploaded' | 'indexing' | 'ready' | 'error'

export type SampleStatus = 'uploaded' | 'processing' | 'completed' | 'failed'

export interface ServiceStatus {
  name: string
  status: ServiceStatusType
  latency?: number
}

export interface PipelineJob {
  id: string
  sampleId: string
  status: JobStatus
  startTime?: string
  endTime?: string
  progress: number
  logs?: string
}

export interface AvailableFile {
  id: string
  name: string
  size: string
}

export interface DashboardStats {
  samples: number
  analyses: number
  genes: number
  mutations: number
}

export interface ReferenceGenome {
  id: number
  name: string
  species: string
  build: string
  status: string
  file_path: string
  gz_path?: string
  created_at?: string
}

export interface Sample {
  id: number
  name: string
  sample_type: string
  reference_genome_id: number
  reference_genome_name?: string
  status: string
  r1_path?: string
  r2_path?: string
  vcf_path?: string
  created_at?: string
}

export interface PipelineConfig {
  referenceGenome: string
  variantCaller: string
  qualityThreshold: string
  minCoverage: string
}

export interface TabConfig {
  id: TabType
  label: string
  icon: string
}