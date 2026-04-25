export interface Hospital {
  id: number;
  name: string;
  code: string;
  created_at: string;
}

export interface Patient {
  id: number;
  external_patient_id: string;
  sex: 'M' | 'F' | 'other' | null;
  date_of_birth: string | null;
  hospital_id?: number;
  consent_status: 'granted' | 'pending' | 'denied';
  clinical_notes?: string;
  created_at: string;
}

export interface CreatePatientData {
  external_patient_id: string;
  sex?: string;
  date_of_birth?: string;
  hospital_id?: number;
  consent_status?: string;
  clinical_notes?: string;
}
