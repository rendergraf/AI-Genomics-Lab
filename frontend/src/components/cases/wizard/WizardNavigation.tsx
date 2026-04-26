'use client';

import React from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import { useWizardValidation } from '@/hooks/useWizardValidation';
import { Button } from '@/components/ui';

export const WizardNavigation: React.FC = () => {
  const { currentStep, nextStep, prevStep, isSubmitting } = useCaseWizardStore();
  const { validateStep } = useWizardValidation();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 10;

  const handleNext = () => {
    const { valid } = validateStep(currentStep);
    if (valid) {
      nextStep();
    }
  };

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-900">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant={"outline"}
          onClick={prevStep}
          disabled={isFirstStep}
        >
          Previous
        </Button>

        <div className="flex items-center gap-3">
          {!isLastStep ? (
            <Button
              type="button"
              onClick={handleNext}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
