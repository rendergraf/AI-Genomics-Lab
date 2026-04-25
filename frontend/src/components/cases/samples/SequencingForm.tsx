'use client';

import React, { useState } from 'react';
import type { SequencingRun } from '@/types/sample';

interface SequencingFormProps {
  onSubmit: (run: SequencingRun) => void;
}

export const SequencingForm: React.FC<SequencingFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<SequencingRun>>({
    platform: 'illumina',
    sequencing_type: 'wgs',
    read_type: 'paired_end',
    coverage_target: 30,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as SequencingRun);
    setFormData({ platform: 'illumina', sequencing_type: 'wgs', read_type: 'paired_end' });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
        <select
          value={formData.platform}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value as SequencingRun['platform'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="illumina">Illumina</option>
          <option value="ont">Oxford Nanopore</option>
          <option value="pacbio">PacBio</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sequencing Type</label>
        <select
          value={formData.sequencing_type}
          onChange={(e) => setFormData({ ...formData, sequencing_type: e.target.value as SequencingRun['sequencing_type'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="wgs">Whole Genome</option>
          <option value="wes">Whole Exome</option>
          <option value="rna_seq">RNA-Seq</option>
          <option value="targeted">Targeted Panel</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Read Type</label>
        <select
          value={formData.read_type}
          onChange={(e) => setFormData({ ...formData, read_type: e.target.value as SequencingRun['read_type'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="paired_end">Paired-End</option>
          <option value="single_end">Single-End</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Coverage (X)</label>
        <input
          type="number"
          value={formData.coverage_target || ''}
          onChange={(e) => setFormData({ ...formData, coverage_target: parseInt(e.target.value) || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="col-span-2">
        <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Sequencing Run
        </button>
      </div>
    </form>
  );
};
