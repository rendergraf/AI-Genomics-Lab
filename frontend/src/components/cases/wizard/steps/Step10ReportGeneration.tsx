'use client';

import React from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';

export const Step10ReportGeneration: React.FC = () => {
  const { caseData, patient } = useCaseWizardStore();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Clinical Report</h3>
        <p className="text-sm text-gray-500 mt-1">
          Review and finalize the clinical report.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Case Summary</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Case Code:</span>
              <p className="font-medium text-gray-900">{caseData.case_code || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Patient:</span>
              <p className="font-medium text-gray-900">{patient?.external_patient_id || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Cancer Type:</span>
              <p className="font-medium text-gray-900">{caseData.cancer_type || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Stage:</span>
              <p className="font-medium text-gray-900">{caseData.stage || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Clinical Question</h4>
          <p className="text-sm text-gray-700">{caseData.clinical_question || 'No clinical question specified'}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Report Generation</p>
              <p className="text-xs text-blue-700 mt-1">
                Click &quot;Generate Report&quot; to produce the final clinical report with all findings,
                biomarkers, and actionable insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
