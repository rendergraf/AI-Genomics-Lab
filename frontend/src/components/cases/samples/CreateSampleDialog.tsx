'use client';

import React, { useState } from 'react';
import type { ClinicalSample } from '@/types/sample';

interface CreateSampleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sample: ClinicalSample) => void;
}

export const CreateSampleDialog: React.FC<CreateSampleDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<ClinicalSample>>({
    sample_type: 'tissue',
    collection_date: '',
    preservation_method: '',
    tissue_type: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(formData as ClinicalSample);
    setFormData({ sample_type: 'tissue' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Register Sample</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
              <select
                value={formData.sample_type}
                onChange={(e) => setFormData({ ...formData, sample_type: e.target.value as ClinicalSample['sample_type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tissue">Tissue</option>
                <option value="blood">Blood</option>
                <option value="saliva">Saliva</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
              <input
                type="date"
                value={formData.collection_date || ''}
                onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tissue Type</label>
              <input
                type="text"
                value={formData.tissue_type || ''}
                onChange={(e) => setFormData({ ...formData, tissue_type: e.target.value })}
                placeholder="e.g., Breast ductal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preservation</label>
              <input
                type="text"
                value={formData.preservation_method || ''}
                onChange={(e) => setFormData({ ...formData, preservation_method: e.target.value })}
                placeholder="e.g., FFPE"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add Sample
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
