'use client';

import React from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';

const STEPS = [
  { step: 1, label: 'New Case', icon: '📋' },
  { step: 2, label: 'Patient', icon: '👤' },
  { step: 3, label: 'Clinical Context', icon: '🏥' },
  { step: 4, label: 'Samples', icon: '🧬' },
  { step: 5, label: 'Sequencing', icon: '🔬' },
  { step: 6, label: 'FASTQ Upload', icon: '📤' },
  { step: 7, label: 'Run Pipeline', icon: '⚙️' },
  { step: 8, label: 'Live Monitoring', icon: '📊' },
  { step: 9, label: 'Results', icon: '📈' },
  { step: 10, label: 'Report', icon: '📄' },
];

export const WizardSidebar: React.FC = () => {
  const { currentStep, goToStep } = useCaseWizardStore();

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Case Creation Wizard
        </h2>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {STEPS.map(({ step, label, icon }) => {
          const isActive = currentStep === step;
          const isCompleted = currentStep > step;

          return (
            <button
              key={step}
              onClick={() => isCompleted && goToStep(step)}
              disabled={!isCompleted && !isActive}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : isCompleted
                  ? 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium border-2
                ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : ''}
                ${isActive ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-400'}
              ">
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </span>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
