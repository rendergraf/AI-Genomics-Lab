'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import type { ClinicalSample, SamplePurpose, AnatomicalSite, PreservationMethod, QualityStatus } from '@/types/sample';
import {
  SAMPLE_PURPOSE_LABELS,
  ANATOMICAL_SITE_LABELS,
  QUALITY_LABELS,
  QUALITY_ICONS,
} from '@/types/sample';

const PURPOSE_CARDS: { purpose: SamplePurpose; icon: string; description: string }[] = [
  { purpose: 'tumor', icon: '🧬', description: 'Somatic calling, CNV, SV' },
  { purpose: 'normal', icon: '🩸', description: 'Matched normal for somatic' },
  { purpose: 'germline', icon: '🧬', description: 'Hereditary variants' },
  { purpose: 'rna', icon: '📜', description: 'Gene fusions, expression' },
  { purpose: 'ctdna', icon: '💊', description: 'Liquid biopsy, monitoring' },
  { purpose: 'relapse', icon: '📊', description: 'Post-treatment resistance' },
];

const ANATOMICAL_OPTIONS: { value: AnatomicalSite | string; label: string }[] = [
  { value: 'primary_tumor', label: 'Primary Tumor' },
  { value: 'liver_metastasis', label: 'Liver Metastasis' },
  { value: 'lung_metastasis', label: 'Lung Metastasis' },
  { value: 'bone_metastasis', label: 'Bone Metastasis' },
  { value: 'brain_metastasis', label: 'Brain Metastasis' },
  { value: 'lymph_node_metastasis', label: 'Lymph Node Metastasis' },
  { value: 'peritoneal_metastasis', label: 'Peritoneal Metastasis' },
  { value: 'pleural_effusion', label: 'Pleural Effusion' },
  { value: 'bone_marrow', label: 'Bone Marrow' },
  { value: 'blood', label: 'Blood' },
  { value: 'csf', label: 'CSF' },
  { value: 'other', label: 'Other' },
];

const PRESERVATION_OPTIONS: { value: PreservationMethod | string; label: string }[] = [
  { value: 'ffpe', label: 'FFPE' },
  { value: 'fresh_frozen', label: 'Fresh Frozen' },
  { value: 'blood', label: 'Blood (EDTA)' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'bone_marrow_aspirate', label: 'Bone Marrow Aspirate' },
  { value: 'saliva', label: 'Saliva' },
  { value: 'other', label: 'Other' },
];

const QUALITY_OPTIONS: { value: QualityStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'low_quality', label: 'Low Quality' },
  { value: 'contaminated', label: 'Contaminated' },
  { value: 'insufficient_material', label: 'Insufficient Material' },
];

const TISSUE_TYPE_OPTIONS = [
  'Breast ductal',
  'Lung lobe',
  'Colon',
  'Liver',
  'Blood (peripheral)',
  'Bone marrow aspirate',
  'Lymph node',
  'Skin',
  'Brain',
  'Kidney',
  'Prostate',
  'Ovary',
  'Pancreas',
  'Stomach',
  'Esophagus',
  'Thyroid',
  'Soft tissue',
  'Bone',
  'Other',
];

interface ModuleRequirement {
  key: string;
  label: string;
  neededPurposes: SamplePurpose[];
  description: string;
}

const MODULE_REQUIREMENTS: ModuleRequirement[] = [
  { key: 'A', label: 'SNV / Indel', neededPurposes: ['tumor'], description: 'Single nucleotide variants and small indels' },
  { key: 'B', label: 'CNV', neededPurposes: ['tumor'], description: 'Copy number variations' },
  { key: 'C', label: 'SV', neededPurposes: ['tumor'], description: 'Structural variants' },
  { key: 'D', label: 'RNA Fusion', neededPurposes: ['rna'], description: 'Gene fusions from RNA-seq' },
  { key: 'E', label: 'MSI / TMB', neededPurposes: ['tumor'], description: 'Microsatellite instability / TMB' },
  { key: 'F', label: 'HRD', neededPurposes: ['tumor'], description: 'Homologous recombination deficiency' },
  { key: 'G', label: 'Germline', neededPurposes: ['germline', 'normal'], description: 'Hereditary variants' },
];

const emptyForm = (): Partial<ClinicalSample> => ({
  sample_type: 'tissue',
  sample_purpose: undefined,
  tissue_type: '',
  anatomical_site: '',
  tumor_content: undefined,
  matched_normal: false,
  matched_normal_sample_id: null,
  collection_date: '',
  preservation_method: '',
  quality_status: 'pending' as QualityStatus,
  pathology_notes: '',
  notes: '',
});

function generateSampleCode(caseCode: string, index: number): string {
  const year = new Date().getFullYear();
  const seq = String(index + 1).padStart(3, '0');
  if (caseCode) {
    return `${caseCode}-${seq}`;
  }
  return `S-${year}-${seq}`;
}

export const Step4SampleRegistration: React.FC = () => {
  const { caseData, samples, addSample, updateSample, removeSample } = useCaseWizardStore();
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<ClinicalSample>>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const nextSampleCode = useMemo(() => {
    return generateSampleCode(caseData.case_code, samples.length);
  }, [caseData.case_code, samples.length]);

  const samplePurposes = useMemo(() => {
    return samples.map((s) => s.sample_purpose).filter(Boolean) as SamplePurpose[];
  }, [samples]);

  const moduleStatus = useMemo(() => {
    return MODULE_REQUIREMENTS.map((mod) => {
      const hasAllNeeded = mod.neededPurposes.every((p) => samplePurposes.includes(p));
      return { ...mod, satisfied: hasAllNeeded };
    });
  }, [samplePurposes]);

  const handleOpenAdd = useCallback(() => {
    setEditingIndex(null);
    setForm(emptyForm());
    setFormErrors({});
    setShowModal(true);
  }, []);

  const handleOpenEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setForm({ ...samples[index] });
    setFormErrors({});
    setShowModal(true);
  }, [samples]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setEditingIndex(null);
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!form.sample_purpose) {
      errors.sample_purpose = 'Sample purpose is required';
    }
    if (!form.anatomical_site) {
      errors.anatomical_site = 'Anatomical site is required';
    }
    if (form.sample_purpose === 'tumor' && (form.tumor_content === undefined || form.tumor_content === null)) {
      errors.tumor_content = 'Tumor content is required for tumor samples';
    }
    if (form.tumor_content !== undefined && form.tumor_content !== null) {
      if (form.tumor_content < 0 || form.tumor_content > 100) {
        errors.tumor_content = 'Must be between 0 and 100';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const sample: ClinicalSample = {
      sample_type: form.sample_purpose === 'normal' ? 'blood'
        : form.sample_purpose === 'germline' ? 'saliva'
        : 'tissue',
      sample_code: nextSampleCode,
      sample_purpose: form.sample_purpose,
      tissue_type: form.tissue_type || '',
      anatomical_site: form.anatomical_site,
      tumor_content: form.tumor_content,
      matched_normal: form.matched_normal || false,
      matched_normal_sample_id: form.matched_normal_sample_id || null,
      collection_date: form.collection_date || '',
      preservation_method: form.preservation_method || '',
      quality_status: (form.quality_status as QualityStatus) || 'pending',
      pathology_notes: form.pathology_notes || '',
      notes: form.notes || '',
    };

    if (editingIndex !== null) {
      updateSample(editingIndex, sample);
    } else {
      addSample(sample);
    }

    handleClose();
  }, [form, nextSampleCode, editingIndex, addSample, updateSample, handleClose, validateForm]);

  const handleRemove = useCallback((index: number) => {
    removeSample(index);
  }, [removeSample]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Samples</h3>
        <p className="text-sm text-gray-500 mt-1">
          Step 4 of 10 &mdash; Register biological samples for this case.
          {caseData.cancer_type && (
            <span className="ml-2 text-blue-600">
              Cancer type: <strong>{caseData.cancer_type}</strong>
              {caseData.primary_site && <> &middot; Primary: <strong>{caseData.primary_site}</strong></>}
            </span>
          )}
        </p>
      </div>

      {/* Registered Samples Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Registered Samples
            <span className="ml-2 text-gray-400 font-normal normal-case">({samples.length})</span>
          </h4>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Sample
          </button>
        </div>

        {samples.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-400 mb-2">No samples registered yet</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add your first sample
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wide">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wide">Purpose</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wide">Anatomical Site</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wide">Purity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 text-xs uppercase tracking-wide">QC</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {samples.map((sample, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {sample.sample_code || generateSampleCode(caseData.case_code, index)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        sample.sample_purpose === 'tumor' ? 'bg-red-50 text-red-700' :
                        sample.sample_purpose === 'normal' ? 'bg-green-50 text-green-700' :
                        sample.sample_purpose === 'germline' ? 'bg-purple-50 text-purple-700' :
                        sample.sample_purpose === 'rna' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {sample.sample_purpose ? SAMPLE_PURPOSE_LABELS[sample.sample_purpose] || sample.sample_purpose : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{sample.sample_type}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {sample.anatomical_site
                        ? (ANATOMICAL_SITE_LABELS[sample.anatomical_site as AnatomicalSite] || sample.anatomical_site)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {sample.tumor_content !== undefined && sample.tumor_content !== null ? (
                        <span className={`text-xs font-medium ${sample.tumor_content >= 30 ? 'text-green-600' : sample.tumor_content >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {sample.tumor_content}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sample.quality_status ? (
                        <span className="text-xs">{QUALITY_ICONS[sample.quality_status]} {QUALITY_LABELS[sample.quality_status]}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(index)}
                        className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sample Requirements Summary */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
          Pipeline Module Requirements
        </h4>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          {moduleStatus.map((mod) => {
            const missingPurposes = mod.neededPurposes.filter((p) => !samplePurposes.includes(p));
            return (
              <div key={mod.key} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    mod.satisfied ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {mod.key}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{mod.label}</p>
                    <p className="text-xs text-gray-500">{mod.description}</p>
                  </div>
                </div>
                <div className="text-xs">
                  {mod.satisfied ? (
                    <span className="text-green-600 font-medium">Ready ✓</span>
                  ) : (
                    <span className="text-yellow-600">
                      Needs: {missingPurposes.map((p) => SAMPLE_PURPOSE_LABELS[p]).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Sample Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10">
          <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingIndex !== null ? 'Edit Sample' : 'Add Sample'}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* SAMPLE PURPOSE - Card Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Purpose <span className="text-red-500">*</span>
                </label>
                {formErrors.sample_purpose && (
                  <p className="text-sm text-red-500 mb-2">{formErrors.sample_purpose}</p>
                )}
                <div className="grid grid-cols-3 gap-3">
                  {PURPOSE_CARDS.map((card) => {
                    const isSelected = form.sample_purpose === card.purpose;
                    return (
                      <button
                        key={card.purpose}
                        type="button"
                        onClick={() => setForm({ ...form, sample_purpose: card.purpose })}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="text-xl mb-1">{card.icon}</div>
                        <p className="text-sm font-medium text-gray-900">{SAMPLE_PURPOSE_LABELS[card.purpose]}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{card.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Sample Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample ID (auto-generated)
                  </label>
                  <input
                    type="text"
                    value={nextSampleCode}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matched Normal?
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="matched_normal"
                        checked={form.matched_normal === true}
                        onChange={() => setForm({ ...form, matched_normal: true })}
                        className="text-blue-600"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="matched_normal"
                        checked={form.matched_normal !== true}
                        onChange={() => setForm({ ...form, matched_normal: false })}
                        className="text-blue-600"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>

              {/* Anatomical Site + Tumor Content */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anatomical Site <span className="text-red-500">*</span>
                  </label>
                  {formErrors.anatomical_site && (
                    <p className="text-sm text-red-500 mb-1">{formErrors.anatomical_site}</p>
                  )}
                  <select
                    value={form.anatomical_site || ''}
                    onChange={(e) => setForm({ ...form, anatomical_site: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select anatomical site...</option>
                    {ANATOMICAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tumor Content %
                    {form.sample_purpose === 'tumor' && <span className="text-red-500"> *</span>}
                    <span className="text-gray-400 font-normal ml-1">(0-100)</span>
                  </label>
                  {formErrors.tumor_content && (
                    <p className="text-sm text-red-500 mb-1">{formErrors.tumor_content}</p>
                  )}
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.tumor_content ?? ''}
                      onChange={(e) => setForm({ ...form, tumor_content: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="e.g., 65"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Tissue Type + Preservation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tissue Type
                  </label>
                  <select
                    value={form.tissue_type || ''}
                    onChange={(e) => setForm({ ...form, tissue_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select tissue type...</option>
                    {TISSUE_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preservation Method
                  </label>
                  <select
                    value={form.preservation_method || ''}
                    onChange={(e) => setForm({ ...form, preservation_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select preservation...</option>
                    {PRESERVATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Collection Date + Quality Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Date
                  </label>
                  <input
                    type="date"
                    value={form.collection_date || ''}
                    onChange={(e) => setForm({ ...form, collection_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality Status
                  </label>
                  <select
                    value={form.quality_status || 'pending'}
                    onChange={(e) => setForm({ ...form, quality_status: e.target.value as QualityStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {QUALITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{QUALITY_ICONS[opt.value]} {opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pathology Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pathology Notes
                  <span className="text-gray-400 font-normal ml-1">(artifacts, necrosis, fixation issues)</span>
                </label>
                <textarea
                  value={form.pathology_notes || ''}
                  onChange={(e) => setForm({ ...form, pathology_notes: e.target.value })}
                  rows={3}
                  placeholder="e.g., Necrosis: 20%, Stroma: 50%, Adequate for sequencing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-white flex justify-end gap-3 px-6 py-4 border-t border-gray-200 rounded-b-xl">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingIndex !== null ? 'Update Sample' : 'Add Sample'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
