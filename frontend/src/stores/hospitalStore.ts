import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';
import type { Hospital } from '@/types/patient';

interface HospitalState {
  hospitals: Hospital[];
  isLoading: boolean;
  loadHospitals: () => Promise<void>;
}

export const useHospitalStore = create<HospitalState>()(
  devtools((set) => ({
    hospitals: [],
    isLoading: false,
    loadHospitals: async () => {
      set({ isLoading: true });
      try {
        const hospitals = await apiClient.get<Hospital[]>('/api/v1/hospitals');
        set({ hospitals, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    },
  }))
);
