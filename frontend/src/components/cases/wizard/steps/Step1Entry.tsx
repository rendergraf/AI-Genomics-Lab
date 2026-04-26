'use client';

import React from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import { Button, Input, Tooltip } from '@/components/ui';

export const Step1Entry: React.FC = () => {
  const { caseData, updateCaseData } = useCaseWizardStore();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-200">New Case</h3>
        <p className="text-sm text-gray-400 mt-1">
          Create the clinical case identifier that will group patient data, samples, sequencing runs, and genomic results.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Case Code <span className="text-red-500">*</span>
            <span className="ml-1.5"><Tooltip text="Unique identifier for this oncology case. One patient may have multiple cases over time (diagnosis, relapse, progression, recurrence)." /></span>
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={caseData.case_code}
              onChange={(e) => updateCaseData({ case_code: e.target.value })}
              placeholder="e.g., CASE-2024-001, BRCA-001"
              autoFocus
            />
            <Button
              type="button"
              size={"md"}
              onClick={() => {
                const year = new Date().getFullYear();
                const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
                updateCaseData({ case_code: `CASE-${year}-${seq}` });
              }}
              title="Generate random Case Code"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Generate</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
