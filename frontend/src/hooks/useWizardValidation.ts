'use client';

import { useCallback } from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function useWizardValidation() {
  const { patient, caseData, samples, uploadedFiles } = useCaseWizardStore();

  const validateStep = useCallback((step: number): ValidationResult => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1: {
        if (!caseData.case_code?.trim()) {
          errors.case_code = 'Case code is required';
        }
        break;
      }
      case 2: {
        if (!patient) {
          errors.patient = 'A patient must be selected or created';
        }
        break;
      }
      case 3: {
        if (!caseData.cancer_type?.trim()) {
          errors.cancer_type = 'Cancer type is required';
        }
        if (!caseData.primary_site?.trim()) {
          errors.primary_site = 'Primary site is required';
        }
        break;
      }
      case 4: {
        if (samples.length === 0) {
          errors.samples = 'At least one sample is required';
        } else {
          const missingPurpose = samples.some((s) => !s.sample_purpose);
          const missingSite = samples.some((s) => !s.anatomical_site);
          if (missingPurpose) {
            errors.sample_purpose = 'All samples must have a purpose';
          }
          if (missingSite) {
            errors.anatomical_site = 'All samples must have an anatomical site';
          }
        }
        break;
      }
      case 6: {
        if (uploadedFiles.length === 0) {
          errors.uploadedFiles = 'At least one FASTQ file must be uploaded';
        }
        break;
      }
      case 7: {
        if (caseData.requested_modules.length === 0) {
          errors.modules = 'At least one pipeline module must be selected';
        }
        break;
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }, [patient, caseData, samples, uploadedFiles]);

  return { validateStep };
}
