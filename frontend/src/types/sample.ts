export type SamplePurpose = 'tumor' | 'normal' | 'germline' | 'rna' | 'ctdna' | 'relapse' | 'baseline' | 'followup';
export type AnatomicalSite = 'primary_tumor' | 'liver_metastasis' | 'lung_metastasis' | 'bone_metastasis' | 'brain_metastasis' | 'lymph_node_metastasis' | 'peritoneal_metastasis' | 'pleural_effusion' | 'bone_marrow' | 'blood' | 'csf' | 'other';
export type PreservationMethod = 'ffpe' | 'fresh_frozen' | 'blood' | 'plasma' | 'bone_marrow_aspirate' | 'saliva' | 'other';
export type QualityStatus = 'pending' | 'passed' | 'failed' | 'low_quality' | 'contaminated' | 'insufficient_material';

export const SAMPLE_PURPOSE_LABELS: Record<SamplePurpose, string> = {
  tumor: 'Tumor',
  normal: 'Normal (Blood)',
  germline: 'Germline',
  rna: 'RNA',
  ctdna: 'ctDNA (Plasma)',
  relapse: 'Relapse',
  baseline: 'Baseline',
  followup: 'Follow-up',
};

export const ANATOMICAL_SITE_LABELS: Record<AnatomicalSite, string> = {
  primary_tumor: 'Primary Tumor',
  liver_metastasis: 'Liver Metastasis',
  lung_metastasis: 'Lung Metastasis',
  bone_metastasis: 'Bone Metastasis',
  brain_metastasis: 'Brain Metastasis',
  lymph_node_metastasis: 'Lymph Node Metastasis',
  peritoneal_metastasis: 'Peritoneal Metastasis',
  pleural_effusion: 'Pleural Effusion',
  bone_marrow: 'Bone Marrow',
  blood: 'Blood',
  csf: 'CSF',
  other: 'Other',
};

export const PRESERVATION_LABELS: Record<PreservationMethod, string> = {
  ffpe: 'FFPE',
  fresh_frozen: 'Fresh Frozen',
  blood: 'Blood (EDTA)',
  plasma: 'Plasma',
  bone_marrow_aspirate: 'Bone Marrow Aspirate',
  saliva: 'Saliva',
  other: 'Other',
};

export const QUALITY_LABELS: Record<QualityStatus, string> = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
  low_quality: 'Low Quality',
  contaminated: 'Contaminated',
  insufficient_material: 'Insufficient Material',
};

export const QUALITY_ICONS: Record<QualityStatus, string> = {
  pending: '⏳',
  passed: '✅',
  failed: '❌',
  low_quality: '⚠️',
  contaminated: '☣️',
  insufficient_material: '📉',
};

export interface ClinicalSample {
  id?: number;
  case_id?: number;
  sample_code?: string;
  sample_type: 'tissue' | 'blood' | 'saliva' | 'other';
  tissue_type?: string;
  collection_date?: string;
  preservation_method?: string;
  notes?: string;

  sample_purpose?: SamplePurpose;
  tumor_content?: number;
  matched_normal?: boolean;
  matched_normal_sample_id?: number | null;
  anatomical_site?: AnatomicalSite | string;
  pathology_notes?: string;
  quality_status?: QualityStatus;
}

export interface SequencingRun {
  id?: number;
  sample_id?: number;
  platform: 'illumina' | 'ont' | 'pacbio' | 'other';
  sequencing_type: 'wgs' | 'wes' | 'rna_seq' | 'targeted';
  read_type: 'single_end' | 'paired_end';
  coverage_target?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
}

export interface FastqFile {
  id?: number;
  sequencing_run_id?: number;
  filename: string;
  file_path: string;
  file_size?: number;
  read_pair: 'r1' | 'r2';
  checksum?: string;
  upload_status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  upload_progress?: number;
}
