import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';
import type { PipelineRun, PipelineModuleStatus, PipelineLog } from '@/types/pipeline';

interface PipelineStoreState {
  currentRun: PipelineRun | null;
  moduleStatuses: PipelineModuleStatus[];
  logs: PipelineLog[];
  isLoading: boolean;
  error: string | null;

  startPipeline: (caseId: number, modules: string[]) => Promise<PipelineRun | null>;
  pollStatus: (runId: number) => Promise<void>;
  stopPipeline: (runId: number) => Promise<boolean>;
  addLog: (log: PipelineLog) => void;
  updateModuleStatus: (module: string, status: PipelineModuleStatus['status']) => void;
  clearError: () => void;
  reset: () => void;
}

export const usePipelineStore = create<PipelineStoreState>()(
  devtools((set, get) => ({
    currentRun: null,
    moduleStatuses: [],
    logs: [],
    isLoading: false,
    error: null,

    startPipeline: async (caseId: number, modules: string[]) => {
      set({ isLoading: true, error: null });
      try {
        const run = await apiClient.post<PipelineRun>(`/api/v1/cases/${caseId}/run`, {
          case_id: caseId,
          modules,
        });
        set({
          currentRun: run,
          moduleStatuses: modules.map((m) => ({
            module: m as PipelineModuleStatus['module'],
            label: m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            status: 'pending' as const,
            progress: 0,
          })),
          isLoading: false,
        });
        return run;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    pollStatus: async (runId: number) => {
      try {
        const caseId = get().currentRun?.case_id;
        if (!caseId) return;
        const run = await apiClient.get<PipelineRun>(`/api/v1/cases/${caseId}/runs/${runId}`);
        set({ currentRun: run });
      } catch {
        // silent fail for polling
      }
    },

    stopPipeline: async (runId: number) => {
      try {
        const caseId = get().currentRun?.case_id;
        if (!caseId) return false;
        await apiClient.post(`/api/v1/cases/${caseId}/runs/${runId}/cancel`);
        return true;
      } catch (error) {
        set({ error: (error as Error).message });
        return false;
      }
    },

    addLog: (log) =>
      set((state) => ({ logs: [...state.logs, log] })),

    updateModuleStatus: (module, status) =>
      set((state) => ({
        moduleStatuses: state.moduleStatuses.map((m) =>
          m.module === module ? { ...m, status } : m
        ),
      })),

    clearError: () => set({ error: null }),
    reset: () => set({ currentRun: null, moduleStatuses: [], logs: [], error: null }),
  }))
);
