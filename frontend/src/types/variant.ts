export interface Variant {
  id: string;
  gene: string;
  position: number;
  ref: string;
  alt: string;
  type: string;
  pathogenicity: string;
  quality?: number;
  coverage?: number;
  frequency?: number;
}

export interface ClinicalReport {
  id?: number;
  case_id?: number;
  variants: Variant[];
  biomarkers: Biomarker[];
  clinical_summary?: string;
  status: 'draft' | 'final';
  generated_at?: string;
}

export interface Biomarker {
  gene: string;
  variant: string;
  significance: 'pathogenic' | 'likely_pathogenic' | 'vus' | 'benign';
  associated_disease?: string;
  drug_targets?: string[];
  evidence_level?: string;
}
