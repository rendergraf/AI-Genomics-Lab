'use client';

import React, { useState } from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import type { SequencingRun } from '@/types/sample';

const PLATFORMS = [
  { value: 'illumina', label: 'Illumina' },
  { value: 'ont', label: 'Oxford Nanopore (ONT)' },
  { value: 'pacbio', label: 'PacBio' },
  { value: 'other', label: 'Other' },
];

const SEQ_TYPES = [
  { value: 'wgs', label: 'Whole Genome (WGS)' },
  { value: 'wes', label: 'Whole Exome (WES)' },
  { value: 'rna_seq', label: 'RNA-Seq' },
  { value: 'targeted', label: 'Targeted Panel' },
];

export const Step5SequencingSetup: React.FC = () => {
  const { sequencingRuns, addSequencingRun } = useCaseWizardStore();
  const [newRun, setNewRun] = useState<Partial<SequencingRun>>({
    platform: 'illumina',
    sequencing_type: 'wgs',
    read_type: 'paired_end',
    status: 'pending',
  });

  const handleAdd = () => {
    if (!newRun.platform || !newRun.sequencing_type) return;
    addSequencingRun(newRun as SequencingRun);
    setNewRun({ platform: 'illumina', sequencing_type: 'wgs', read_type: 'paired_end', status: 'pending' });
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Sequencing Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">
          Define sequencing run parameters for the registered samples.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              value={newRun.platform}
              onChange={(e) => setNewRun({ ...newRun, platform: e.target.value as SequencingRun['platform'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sequencing Type</label>
            <select
              value={newRun.sequencing_type}
              onChange={(e) => setNewRun({ ...newRun, sequencing_type: e.target.value as SequencingRun['sequencing_type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SEQ_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Read Type</label>
            <select
              value={newRun.read_type}
              onChange={(e) => setNewRun({ ...newRun, read_type: e.target.value as SequencingRun['read_type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="paired_end">Paired-End</option>
              <option value="single_end">Single-End</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Coverage (X)</label>
            <input
              type="number"
              value={newRun.coverage_target || ''}
              onChange={(e) => setNewRun({ ...newRun, coverage_target: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 30"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <button
              type="button"
              onClick={handleAdd}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              + Add Sequencing Run
            </button>
          </div>
        </div>

        {sequencingRuns.length > 0 && (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {sequencingRuns.map((run, index) => (
              <div key={index} className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  {PLATFORMS.find((p) => p.value === run.platform)?.label} &mdash; {SEQ_TYPES.find((t) => t.value === run.sequencing_type)?.label}
                </p>
                <p className="text-xs text-gray-500">
                  {run.read_type === 'paired_end' ? 'Paired-End' : 'Single-End'} &bull; {run.coverage_target ? `${run.coverage_target}X` : 'Coverage not set'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
