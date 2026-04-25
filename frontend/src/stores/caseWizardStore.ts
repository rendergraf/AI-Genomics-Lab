import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Patient } from '@/types/patient';
import type { CaseData } from '@/types/case';
import type { ClinicalSample, SequencingRun, FastqFile } from '@/types/sample';
import type { PipelineRun } from '@/types/pipeline';
import type { ClinicalReport } from '@/types/variant';

interface CaseWizardState {
  currentStep: number;
  patient: Patient | null;
  caseData: CaseData;
  samples: ClinicalSample[];
  sequencingRuns: SequencingRun[];
  uploadedFiles: FastqFile[];
  pipelineRun: PipelineRun | null;
  report: ClinicalReport | null;
  isSubmitting: boolean;

  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setPatient: (patient: Patient) => void;
  updateCaseData: (data: Partial<CaseData>) => void;
  addSample: (sample: ClinicalSample) => void;
  updateSample: (index: number, sample: ClinicalSample) => void;
  removeSample: (index: number) => void;
  addSequencingRun: (run: SequencingRun) => void;
  addUploadedFile: (file: FastqFile) => void;
  updateUploadedFile: (index: number, file: Partial<FastqFile>) => void;
  setPipelineRun: (run: PipelineRun | null) => void;
  updatePipelineProgress: (progress: number) => void;
  setReport: (report: ClinicalReport | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetWizard: () => void;
}

const initialCaseData: CaseData = {
  case_code: '',
  cancer_type: '',
  primary_site: '',
  stage: '',
  histology_subtype: '',
  metastatic_sites: [],
  clinical_question: '',
  requested_modules: [],
};

const initialState = {
  currentStep: 1,
  patient: null,
  caseData: { ...initialCaseData },
  samples: [],
  sequencingRuns: [],
  uploadedFiles: [],
  pipelineRun: null,
  report: null,
  isSubmitting: false,
};

export const useCaseWizardStore = create<CaseWizardState>()(
  devtools((set) => ({
    ...initialState,

    nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 10) })),
    prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
    goToStep: (step) => set({ currentStep: Math.max(1, Math.min(step, 10)) }),

    setPatient: (patient) => set({ patient }),
    updateCaseData: (data) =>
      set((state) => ({ caseData: { ...state.caseData, ...data } })),

    addSample: (sample) =>
      set((state) => ({ samples: [...state.samples, sample] })),
    updateSample: (index, sample) =>
      set((state) => {
        const updated = [...state.samples];
        updated[index] = sample;
        return { samples: updated };
      }),
    removeSample: (index) =>
      set((state) => ({
        samples: state.samples.filter((_, i) => i !== index),
      })),

    addSequencingRun: (run) =>
      set((state) => ({ sequencingRuns: [...state.sequencingRuns, run] })),

    addUploadedFile: (file) =>
      set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),
    updateUploadedFile: (index, file) =>
      set((state) => {
        const updated = [...state.uploadedFiles];
        updated[index] = { ...updated[index], ...file };
        return { uploadedFiles: updated };
      }),

    setPipelineRun: (run) => set({ pipelineRun: run }),
    updatePipelineProgress: (progress) =>
      set((state) => {
        if (!state.pipelineRun) return {};
        return { pipelineRun: { ...state.pipelineRun, progress } };
      }),
    setReport: (report) => set({ report }),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

    resetWizard: () => set(initialState),
  }))
);
