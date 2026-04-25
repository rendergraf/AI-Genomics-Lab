'use client';

import React from 'react';
import type { ClinicalSample } from '@/types/sample';

interface SampleTableProps {
  samples: ClinicalSample[];
  onRemove?: (index: number) => void;
}

const SAMPLE_LABELS: Record<string, string> = {
  tissue: 'Tissue',
  blood: 'Blood',
  saliva: 'Saliva',
  other: 'Other',
};

export const SampleTable: React.FC<SampleTableProps> = ({ samples, onRemove }) => {
  if (samples.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No samples registered yet
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-700">Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">Tissue</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">Collection Date</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">Preservation</th>
            {onRemove && <th className="w-16" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {samples.map((sample, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {SAMPLE_LABELS[sample.sample_type] || sample.sample_type}
              </td>
              <td className="px-4 py-3 text-gray-600">{sample.tissue_type || '-'}</td>
              <td className="px-4 py-3 text-gray-600">{sample.collection_date || '-'}</td>
              <td className="px-4 py-3 text-gray-600">{sample.preservation_method || '-'}</td>
              {onRemove && (
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
