import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';
import type { ClinicalSample, SequencingRun, FastqFile } from '@/types/sample';

interface SampleStoreState {
  samples: ClinicalSample[];
  sequencingRuns: SequencingRun[];
  uploadedFiles: FastqFile[];
  isLoading: boolean;
  error: string | null;

  loadSamples: (caseId: number) => Promise<void>;
  createSample: (data: ClinicalSample) => Promise<ClinicalSample | null>;
  updateSample: (id: number, data: Partial<ClinicalSample>) => Promise<ClinicalSample | null>;
  deleteSample: (id: number) => Promise<boolean>;
  createSequencingRun: (data: SequencingRun) => Promise<SequencingRun | null>;
  addUploadedFile: (data: FastqFile) => Promise<FastqFile | null>;
  updateUploadProgress: (fileId: number, progress: number) => void;
  clearError: () => void;
}

export const useSampleStore = create<SampleStoreState>()(
  devtools((set) => ({
    samples: [],
    sequencingRuns: [],
    uploadedFiles: [],
    isLoading: false,
    error: null,

    loadSamples: async (caseId: number) => {
      set({ isLoading: true, error: null });
      try {
        const samples = await apiClient.get<ClinicalSample[]>(`/api/v1/cases/${caseId}/samples`);
        set({ samples, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    createSample: async (data: ClinicalSample) => {
      set({ isLoading: true, error: null });
      try {
        const sample = await apiClient.post<ClinicalSample>(`/api/v1/cases/${data.case_id}/samples`, data);
        set((state) => ({ samples: [...state.samples, sample], isLoading: false }));
        return sample;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    updateSample: async (id: number, data: Partial<ClinicalSample>) => {
      set({ isLoading: true, error: null });
      try {
        const updated = await apiClient.put<ClinicalSample>(`/api/v1/samples/${id}`, data);
        set((state) => ({
          samples: state.samples.map((s) => (s.id === id ? updated : s)),
          isLoading: false,
        }));
        return updated;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    deleteSample: async (id: number) => {
      set({ isLoading: true });
      try {
        await apiClient.delete(`/api/v1/samples/${id}`);
        set((state) => ({
          samples: state.samples.filter((s) => s.id !== id),
          isLoading: false,
        }));
        return true;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return false;
      }
    },

    createSequencingRun: async (data: SequencingRun) => {
      set({ isLoading: true, error: null });
      try {
        const run = await apiClient.post<SequencingRun>('/api/v1/sequencing-runs', data);
        set((state) => ({ sequencingRuns: [...state.sequencingRuns, run], isLoading: false }));
        return run;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    addUploadedFile: async (data: FastqFile) => {
      set({ isLoading: true, error: null });
      try {
        const file = await apiClient.post<FastqFile>('/api/v1/uploaded-files', data);
        set((state) => ({ uploadedFiles: [...state.uploadedFiles, file], isLoading: false }));
        return file;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    updateUploadProgress: (fileId: number, progress: number) =>
      set((state) => ({
        uploadedFiles: state.uploadedFiles.map((f) =>
          f.id === fileId ? { ...f, upload_progress: progress } : f
        ),
      })),

    clearError: () => set({ error: null }),
  }))
);
