export interface CaseData {
  case_code: string;
  cancer_type: string;
  primary_site: string;
  stage: string;
  histology_subtype: string;
  metastatic_sites: string[];
  clinical_question: string;
  requested_modules: string[];
}

export interface ClinicalCase {
  id: number;
  patient_id: number;
  patient?: import('./patient').Patient;
  case_code: string;
  cancer_type: string;
  primary_site: string;
  stage: string;
  histology_subtype: string;
  metastatic_sites: string[];
  clinical_question: string;
  requested_modules: string[];
  status: 'draft' | 'pending' | 'waiting_fastq' | 'active' | 'running' | 'report' | 'critical' | 'blocked' | 'failed' | 'completed' | 'archived';
  created_at: string;
  updated_at?: string;
}
