'use client';

import React from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';

const STEP_LABELS = [
  'New Case',
  'Patient',
  'Clinical Context',
  'Samples',
  'Sequencing',
  'FASTQ Upload',
  'Pipeline Modules',
  'Execution',
  'Results Preview',
  'Report',
];

export const WizardHeader: React.FC = () => {
  const { currentStep } = useCaseWizardStore();

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {STEP_LABELS[currentStep - 1]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Step {currentStep} of 10
          </p>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${(currentStep / 10) * 100}%` }}
        />
      </div>
    </div>
  );
};
