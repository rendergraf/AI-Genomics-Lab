export type PipelineModule = 
  | 'quality_control'
  | 'alignment'
  | 'variant_calling'
  | 'annotation'
  | 'pharmacogenomics'
  | 'tumor_only'
  | 'rnaseq'
  | 'cnv';

export interface PipelineRun {
  id?: number;
  case_id?: number;
  modules: PipelineModule[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  started_at?: string;
  completed_at?: string;
  logs?: PipelineLog[];
}

export interface PipelineLog {
  id?: number;
  pipeline_run_id?: number;
  module: PipelineModule;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
}

export interface PipelineModuleStatus {
  module: PipelineModule;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  progress: number;
}
