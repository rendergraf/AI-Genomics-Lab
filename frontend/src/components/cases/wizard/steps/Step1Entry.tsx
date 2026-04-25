'use client';

import React from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';

export const Step1Entry: React.FC = () => {
  const { caseData, updateCaseData } = useCaseWizardStore();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">New Case Entry</h3>
        <p className="text-sm text-gray-500 mt-1">
          Enter the basic case information to start the workflow.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Case Code <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={caseData.case_code}
              onChange={(e) => updateCaseData({ case_code: e.target.value })}
              placeholder="e.g., CASE-2024-001, BRCA-001"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                const year = new Date().getFullYear();
                const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
                updateCaseData({ case_code: `CASE-${year}-${seq}` });
              }}
              className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors flex items-center gap-1.5 shrink-0"
              title="Generate random Case Code"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Generate</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Unique identifier for this clinical case
          </p>
        </div>
      </div>
    </div>
  );
};
