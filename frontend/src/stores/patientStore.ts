import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';

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

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  isCreateDialogOpen: boolean;

  loadPatients: () => Promise<void>;
  loadPatient: (id: number) => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  createPatient: (data: CreatePatientData) => Promise<Patient | null>;
  updatePatient: (id: number, data: Partial<CreatePatientData>) => Promise<Patient | null>;
  deletePatient: (id: number) => Promise<boolean>;
  setCreateDialogOpen: (open: boolean) => void;
  clearError: () => void;
}

export const usePatientStore = create<PatientState>()(
  devtools((set, get) => ({
    patients: [],
    selectedPatient: null,
    isLoading: false,
    isSearching: false,
    error: null,
    isCreateDialogOpen: false,

    loadPatients: async () => {
      set({ isLoading: true, error: null });
      try {
        const patients = await apiClient.get<Patient[]>('/api/v1/patients');
        set({ patients, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    loadPatient: async (id: number) => {
      set({ isLoading: true, error: null });
      try {
        const patient = await apiClient.get<Patient>(`/api/v1/patients/${id}`);
        set({ selectedPatient: patient, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    searchPatients: async (query: string) => {
      if (!query.trim()) {
        set({ isSearching: false });
        return;
      }
      set({ isSearching: true, error: null });
      try {
        const params = new URLSearchParams({ search: query, limit: '20' });
        const patients = await apiClient.get<Patient[]>(`/api/v1/patients?${params}`);
        set({ patients, isSearching: false });
      } catch (error) {
        set({ error: (error as Error).message, isSearching: false });
      }
    },

    createPatient: async (data: CreatePatientData) => {
      set({ isLoading: true, error: null });
      try {
        const newPatient = await apiClient.post<Patient>('/api/v1/patients', data);
        set((state) => ({
          patients: [newPatient, ...state.patients],
          isLoading: false,
          isCreateDialogOpen: false,
        }));
        return newPatient;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    updatePatient: async (id: number, data: Partial<CreatePatientData>) => {
      set({ isLoading: true, error: null });
      try {
        const updated = await apiClient.put<Patient>(`/api/v1/patients/${id}`, data);
        set((state) => ({
          patients: state.patients.map((p) => (p.id === id ? updated : p)),
          selectedPatient: state.selectedPatient?.id === id ? updated : state.selectedPatient,
          isLoading: false,
        }));
        return updated;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    deletePatient: async (id: number) => {
      set({ isLoading: true });
      try {
        await apiClient.delete(`/api/v1/patients/${id}`);
        set((state) => ({
          patients: state.patients.filter((p) => p.id !== id),
          isLoading: false,
        }));
        return true;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return false;
      }
    },

    setCreateDialogOpen: (open: boolean) => set({ isCreateDialogOpen: open, error: null }),
    clearError: () => set({ error: null }),
  }))
);
