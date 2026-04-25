import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';
import type { ClinicalCase } from '@/types/case';
import type { CreatePatientData } from '@/types/patient';

interface CaseStoreState {
  cases: ClinicalCase[];
  selectedCase: ClinicalCase | null;
  isLoading: boolean;
  error: string | null;

  loadCases: () => Promise<void>;
  loadCase: (id: number) => Promise<void>;
  createCase: (data: Partial<ClinicalCase>) => Promise<ClinicalCase | null>;
  updateCase: (id: number, data: Partial<ClinicalCase>) => Promise<ClinicalCase | null>;
  deleteCase: (id: number) => Promise<boolean>;
  clearError: () => void;
}

export const useCaseStore = create<CaseStoreState>()(
  devtools((set) => ({
    cases: [],
    selectedCase: null,
    isLoading: false,
    error: null,

    loadCases: async () => {
      set({ isLoading: true, error: null });
      try {
        const cases = await apiClient.get<ClinicalCase[]>('/api/v1/cases');
        set({ cases, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    loadCase: async (id: number) => {
      set({ isLoading: true, error: null });
      try {
        const clinicalCase = await apiClient.get<ClinicalCase>(`/api/v1/cases/${id}`);
        set({ selectedCase: clinicalCase, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    createCase: async (data: Partial<ClinicalCase>) => {
      set({ isLoading: true, error: null });
      try {
        const newCase = await apiClient.post<ClinicalCase>('/api/v1/cases', data);
        set((state) => ({
          cases: [newCase, ...state.cases],
          isLoading: false,
        }));
        return newCase;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    updateCase: async (id: number, data: Partial<ClinicalCase>) => {
      set({ isLoading: true, error: null });
      try {
        const updated = await apiClient.put<ClinicalCase>(`/api/v1/cases/${id}`, data);
        set((state) => ({
          cases: state.cases.map((c) => (c.id === id ? updated : c)),
          selectedCase: state.selectedCase?.id === id ? updated : state.selectedCase,
          isLoading: false,
        }));
        return updated;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    deleteCase: async (id: number) => {
      set({ isLoading: true });
      try {
        await apiClient.delete(`/api/v1/cases/${id}`);
        set((state) => ({
          cases: state.cases.filter((c) => c.id !== id),
          isLoading: false,
        }));
        return true;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return false;
      }
    },

    clearError: () => set({ error: null }),
  }))
);
