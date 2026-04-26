'use client';

import React from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';

const MOCK_VARIANTS: Array<{ gene: string; variant: string; pathogenicity: string; frequency: number }> = [
  { gene: 'BRCA1', variant: 'c.5266dupC', pathogenicity: 'pathogenic', frequency: 0.45 },
  { gene: 'TP53', variant: 'c.818G>A', pathogenicity: 'pathogenic', frequency: 0.32 },
  { gene: 'EGFR', variant: 'c.2573T>G', pathogenicity: 'likely_pathogenic', frequency: 0.12 },
];

export const Step9ResultsPreview: React.FC = () => {
  const { report } = useCaseWizardStore();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Results Preview</h3>
        <p className="text-sm text-gray-500 mt-1">
          Review identified variants, biomarkers, and genomic findings before report generation.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-700">Gene</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Variant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Pathogenicity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Frequency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(report?.variants || MOCK_VARIANTS).map((v: any, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{v.gene}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{v.variant}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    v.pathogenicity === 'pathogenic' ? 'bg-red-100 text-red-700' :
                    v.pathogenicity === 'likely_pathogenic' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {v.pathogenicity.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{v.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
