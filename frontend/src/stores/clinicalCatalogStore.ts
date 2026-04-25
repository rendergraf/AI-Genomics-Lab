import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';

export interface CancerTypeOption {
  id: number;
  code: string;
  name: string;
  category?: string;
}

export interface PrimarySiteOption {
  id: number;
  name: string;
  category?: string;
  is_primary: boolean;
}

export interface HistologySubtypeOption {
  id: number;
  name: string;
}

export interface StageOption {
  code: string;
  name: string;
}

interface ClinicalCatalogState {
  cancerTypes: CancerTypeOption[];
  filteredPrimarySites: PrimarySiteOption[];
  allPrimarySites: PrimarySiteOption[];
  histologySubtypes: HistologySubtypeOption[];
  stages: StageOption[];
  isLoading: boolean;
  error: string | null;

  loadCancerTypes: () => Promise<void>;
  loadAllPrimarySites: () => Promise<void>;
  loadPrimarySitesByCancerType: (cancerTypeId: number) => Promise<void>;
  loadHistologySubtypesByCancerType: (cancerTypeId: number) => Promise<void>;
  loadStages: () => Promise<void>;
  loadAll: () => Promise<void>;
  loadDependentData: (cancerTypeId: number) => Promise<void>;
  clearDependentData: () => void;
  clearError: () => void;
}

export const useClinicalCatalogStore = create<ClinicalCatalogState>()(
  devtools((set) => ({
    cancerTypes: [],
    filteredPrimarySites: [],
    allPrimarySites: [],
    histologySubtypes: [],
    stages: [],
    isLoading: false,
    error: null,

    loadCancerTypes: async () => {
      try {
        const cancerTypes = await apiClient.get<CancerTypeOption[]>('/api/v1/clinical-catalogs/cancer-types');
        set({ cancerTypes, error: null });
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },

    loadAllPrimarySites: async () => {
      try {
        const allPrimarySites = await apiClient.get<PrimarySiteOption[]>('/api/v1/clinical-catalogs/primary-sites');
        set({ allPrimarySites, error: null });
      } catch (error) {
        set({ allPrimarySites: [], error: (error as Error).message });
      }
    },

    loadPrimarySitesByCancerType: async (cancerTypeId: number) => {
      try {
        const filteredPrimarySites = await apiClient.get<PrimarySiteOption[]>(
          `/api/v1/clinical-catalogs/primary-sites/${cancerTypeId}`
        );
        set({ filteredPrimarySites, error: null });
      } catch (error) {
        set({ filteredPrimarySites: [], error: (error as Error).message });
      }
    },

    loadHistologySubtypesByCancerType: async (cancerTypeId: number) => {
      try {
        const histologySubtypes = await apiClient.get<HistologySubtypeOption[]>(
          `/api/v1/clinical-catalogs/histology-subtypes/${cancerTypeId}`
        );
        set({ histologySubtypes, error: null });
      } catch (error) {
        set({ histologySubtypes: [], error: (error as Error).message });
      }
    },

    loadStages: async () => {
      try {
        const stages = await apiClient.get<StageOption[]>('/api/v1/clinical-catalogs/stages');
        set({ stages, error: null });
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },

    loadAll: async () => {
      set({ isLoading: true, error: null });
      try {
        const [cancerTypes, allPrimarySites, stages] = await Promise.all([
          apiClient.get<CancerTypeOption[]>('/api/v1/clinical-catalogs/cancer-types'),
          apiClient.get<PrimarySiteOption[]>('/api/v1/clinical-catalogs/primary-sites'),
          apiClient.get<StageOption[]>('/api/v1/clinical-catalogs/stages'),
        ]);
        set({ cancerTypes, allPrimarySites, stages, isLoading: false, error: null });
      } catch (error) {
        set({ isLoading: false, error: (error as Error).message });
      }
    },

    loadDependentData: async (cancerTypeId: number) => {
      set({ error: null });
      try {
        const [filteredPrimarySites, histologySubtypes] = await Promise.all([
          apiClient.get<PrimarySiteOption[]>(
            `/api/v1/clinical-catalogs/primary-sites/${cancerTypeId}`
          ),
          apiClient.get<HistologySubtypeOption[]>(
            `/api/v1/clinical-catalogs/histology-subtypes/${cancerTypeId}`
          ),
        ]);
        set({ filteredPrimarySites, histologySubtypes, error: null });
      } catch (error) {
        set({
          filteredPrimarySites: [],
          histologySubtypes: [],
          error: (error as Error).message,
        });
      }
    },

    clearDependentData: () => {
      set({ filteredPrimarySites: [], histologySubtypes: [] });
    },

    clearError: () => set({ error: null }),
  }))
);
