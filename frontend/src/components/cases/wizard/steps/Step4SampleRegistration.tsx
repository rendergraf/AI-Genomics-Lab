'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import { Button, Tooltip } from '@/components/ui';
import type { ClinicalSample, SamplePurpose, AnatomicalSite, PreservationMethod, QualityStatus, SequencingIntent } from '@/types/sample';
import {
  SAMPLE_PURPOSE_LABELS,
  ANATOMICAL_SITE_LABELS,
  SEQUENCING_INTENT_LABELS,
  QUALITY_LABELS,
  QUALITY_ICONS,
} from '@/types/sample';

const TUMOR_PURPOSES: SamplePurpose[] = ['tumor', 'relapse'];

const PURPOSE_CARDS: { purpose: SamplePurpose; icon: string; description: string }[] = [
  { purpose: 'tumor', icon: '🧬', description: 'Somatic calling, CNV, SV' },
  { purpose: 'normal', icon: '🩸', description: 'Matched normal for somatic' },
  { purpose: 'germline', icon: '🧬', description: 'Hereditary variants' },
  { purpose: 'rna', icon: '📜', description: 'Gene fusions, expression' },
  { purpose: 'ctdna', icon: '💊', description: 'Liquid biopsy, monitoring' },
  { purpose: 'relapse', icon: '📊', description: 'Post-treatment resistance' },
];

const SEQUENCING_INTENT_OPTIONS: { value: SequencingIntent; label: string; description: string }[] = [
  { value: 'somatic_profiling', label: 'Somatic Profiling', description: 'Identify somatic mutations, CNV, biomarkers' },
  { value: 'germline_testing', label: 'Germline Testing', description: 'Hereditary cancer risk assessment' },
  { value: 'fusion_detection', label: 'Fusion Detection', description: 'Gene fusions and structural variants' },
  { value: 'mrd_monitoring', label: 'MRD Monitoring', description: 'Minimal residual disease tracking' },
  { value: 'resistance_analysis', label: 'Resistance Analysis', description: 'Acquired resistance mechanisms' },
  { value: 'relapse_characterization', label: 'Relapse Characterization', description: 'Molecular profile at relapse' },
];

const ANATOMICAL_SITES_BY_PURPOSE: Record<string, { value: string; label: string }[]> = {
  tumor: [
    { value: 'primary_tumor', label: 'Primary Tumor' },
    { value: 'liver_metastasis', label: 'Liver Metastasis' },
    { value: 'lung_metastasis', label: 'Lung Metastasis' },
    { value: 'bone_metastasis', label: 'Bone Metastasis' },
    { value: 'brain_metastasis', label: 'Brain Metastasis' },
    { value: 'lymph_node_metastasis', label: 'Lymph Node Metastasis' },
    { value: 'peritoneal_metastasis', label: 'Peritoneal Metastasis' },
    { value: 'pleural_effusion', label: 'Pleural Effusion' },
    { value: 'other', label: 'Other' },
  ],
  normal: [
    { value: 'blood', label: 'Blood (Peripheral)' },
    { value: 'bone_marrow', label: 'Bone Marrow' },
    { value: 'other', label: 'Other' },
  ],
  germline: [
    { value: 'blood', label: 'Blood (Peripheral)' },
    { value: 'saliva', label: 'Saliva' },
    { value: 'bone_marrow', label: 'Bone Marrow' },
    { value: 'other', label: 'Other' },
  ],
  rna: [
    { value: 'primary_tumor', label: 'Primary Tumor' },
    { value: 'blood', label: 'Blood (Peripheral)' },
    { value: 'bone_marrow', label: 'Bone Marrow' },
    { value: 'other', label: 'Other' },
  ],
  ctdna: [
    { value: 'blood', label: 'Blood (Peripheral)' },
    { value: 'other', label: 'Other' },
  ],
  relapse: [
    { value: 'primary_tumor', label: 'Primary Tumor' },
    { value: 'liver_metastasis', label: 'Liver Metastasis' },
    { value: 'lung_metastasis', label: 'Lung Metastasis' },
    { value: 'bone_metastasis', label: 'Bone Metastasis' },
    { value: 'brain_metastasis', label: 'Brain Metastasis' },
    { value: 'lymph_node_metastasis', label: 'Lymph Node Metastasis' },
    { value: 'peritoneal_metastasis', label: 'Peritoneal Metastasis' },
    { value: 'pleural_effusion', label: 'Pleural Effusion' },
    { value: 'other', label: 'Other' },
  ],
};

const TISSUE_TYPE_OPTIONS = [
  'FFPE tissue',
  'Fresh frozen tissue',
  'Peripheral blood',
  'Bone marrow',
  'Plasma',
  'Saliva',
  'Cytology smear',
  'Biopsy core',
  'Surgical specimen',
  'Other',
];

const PRESERVATION_BY_TISSUE: Record<string, string> = {
  'FFPE tissue': 'ffpe',
  'Fresh frozen tissue': 'fresh_frozen',
  'Peripheral blood': 'blood',
  'Bone marrow': 'bone_marrow_aspirate',
  'Plasma': 'plasma',
  'Saliva': 'saliva',
  'Cytology smear': 'ffpe',
  'Biopsy core': 'ffpe',
  'Surgical specimen': 'ffpe',
};

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
  sequencing_intent: undefined,
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
  pathology_reviewed: false,
  pathology_reviewer: '',
  pathology_review_date: '',
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

  const anatomicalOptions = useMemo(() => {
    if (!form.sample_purpose) return [];
    return ANATOMICAL_SITES_BY_PURPOSE[form.sample_purpose] || ANATOMICAL_SITES_BY_PURPOSE['other'] || [];
  }, [form.sample_purpose]);

  const isTumorPurpose = form.sample_purpose ? TUMOR_PURPOSES.includes(form.sample_purpose) : false;
  const isNormalPurpose = form.sample_purpose === 'normal';

  const handlePurposeChange = useCallback((purpose: SamplePurpose) => {
    const updates: Partial<ClinicalSample> = {
      sample_purpose: purpose,
      anatomical_site: '',
      tumor_content: TUMOR_PURPOSES.includes(purpose) ? form.tumor_content : undefined,
      matched_normal: purpose === 'normal' ? form.matched_normal : false,
      sequencing_intent: purpose === 'normal' ? 'germline_testing'
        : purpose === 'rna' ? 'fusion_detection'
        : purpose === 'ctdna' ? 'mrd_monitoring'
        : purpose === 'germline' ? 'germline_testing'
        : purpose === 'relapse' ? 'relapse_characterization'
        : 'somatic_profiling',
    };
    setForm({ ...form, ...updates });
  }, [form]);

  const handleTissueTypeChange = useCallback((value: string) => {
    const suggestedPreservation = PRESERVATION_BY_TISSUE[value] || form.preservation_method;
    setForm({ ...form, tissue_type: value, preservation_method: suggestedPreservation });
  }, [form]);

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
    if (!form.sequencing_intent) {
      errors.sequencing_intent = 'Sequencing intent is required';
    }
    if (!form.anatomical_site) {
      errors.anatomical_site = 'Anatomical site is required';
    }
    if (isTumorPurpose && (form.tumor_content === undefined || form.tumor_content === null)) {
      errors.tumor_content = 'Tumor content is required for tumor samples';
    }
    if (form.tumor_content !== undefined && form.tumor_content !== null) {
      if (form.tumor_content < 0 || form.tumor_content > 100) {
        errors.tumor_content = 'Must be between 0 and 100';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, isTumorPurpose]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const sample: ClinicalSample = {
      sample_type: form.sample_purpose === 'normal' ? 'blood'
        : form.sample_purpose === 'germline' ? 'saliva'
        : 'tissue',
      sample_code: nextSampleCode,
      sample_purpose: form.sample_purpose,
      sequencing_intent: form.sequencing_intent,
      tissue_type: form.tissue_type || '',
      anatomical_site: form.anatomical_site,
      tumor_content: isTumorPurpose ? form.tumor_content : undefined,
      matched_normal: isNormalPurpose ? (form.matched_normal || false) : false,
      matched_normal_sample_id: isNormalPurpose ? (form.matched_normal_sample_id || null) : null,
      collection_date: form.collection_date || '',
      preservation_method: form.preservation_method || '',
      quality_status: (form.quality_status as QualityStatus) || 'pending',
      pathology_notes: form.pathology_notes || '',
      notes: form.notes || '',
      pathology_reviewed: form.pathology_reviewed || false,
      pathology_reviewer: form.pathology_reviewer || '',
      pathology_review_date: form.pathology_review_date || '',
    };

    if (editingIndex !== null) {
      updateSample(editingIndex, sample);
    } else {
      addSample(sample);
    }

    handleClose();
  }, [form, nextSampleCode, editingIndex, addSample, updateSample, handleClose, validateForm, isTumorPurpose, isNormalPurpose]);

  const handleRemove = useCallback((index: number) => {
    removeSample(index);
  }, [removeSample]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-200">Samples</h3>
        <p className="text-sm text-gray-200 mt-1">
          Register biological samples. FASTQ files belong to samples, not directly to the case.
          {caseData.cancer_type && (
            <span className="ml-2 text-lime-200">
              Cancer type: <strong>{caseData.cancer_type}</strong>
              {caseData.primary_site && <> &middot; Primary: <strong>{caseData.primary_site}</strong></>}
            </span>
          )}
        </p>
      </div>

      {/* Registered Samples Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
            Registered Samples
            <span className="ml-2 text-gray-200 font-normal normal-case">({samples.length})</span>
            <span className="ml-1.5"><Tooltip text="A sample is a biological specimen (tumor, blood, RNA, plasma). FASTQ files are sequencing outputs linked later to each sample." /></span>
          </h4>
          <Button
            type="button"
            onClick={handleOpenAdd}
          >
            + Add Sample
          </Button>
        </div>

        {samples.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-400 mb-2">No samples registered yet</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-sm text-lime-200 hover:text-lime-300 font-medium"
            >
              + Add your first sample
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-200 text-xs uppercase tracking-wide">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-200 text-xs uppercase tracking-wide">Purpose</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-200 text-xs uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-200 text-xs uppercase tracking-wide">Anatomical Site</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-200 text-xs uppercase tracking-wide">Purity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-200 text-xs uppercase tracking-wide">QC</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {samples.map((sample, index) => (
                  <tr key={index} className="hover:bg-gray-800">
                    <td className="px-4 py-3 font-mono text-xs text-gray-200">
                      {sample.sample_code || generateSampleCode(caseData.case_code, index)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        sample.sample_purpose === 'tumor' ? 'bg-red-50 text-red-700' :
                        sample.sample_purpose === 'normal' ? 'bg-green-50 text-green-700' :
                        sample.sample_purpose === 'germline' ? 'bg-purple-50 text-purple-700' :
                        sample.sample_purpose === 'rna' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-50 text-gray-200'
                      }`}>
                        {sample.sample_purpose ? SAMPLE_PURPOSE_LABELS[sample.sample_purpose] || sample.sample_purpose : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-200 capitalize">{sample.sample_type}</td>
                    <td className="px-4 py-3 text-gray-200 text-xs">
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
                        <span className="text-xs text-gray-200">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sample.quality_status ? (
                        <span className="text-xs">{QUALITY_ICONS[sample.quality_status]} {QUALITY_LABELS[sample.quality_status]}</span>
                      ) : (
                        <span className="text-xs text-gray-200">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(index)}
                        className="text-xs text-lime-200 hover:text-lime-300 mr-3"
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
        <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">
          Pipeline Module Requirements
          <span className="ml-1.5"><Tooltip text="Module readiness is automatically evaluated based on registered sample types. Example: RNA Fusion requires RNA sample | Germline analysis requires blood/germline sample" /></span>
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
                    <p className="text-sm font-medium text-gray-200">{mod.label}</p>
                    <p className="text-xs text-gray-400">{mod.description}</p>
                  </div>
                </div>
                <div className="text-xs">
                  {mod.satisfied ? (
                    <span className="text-green-600 font-medium">Ready ✓</span>
                  ) : (
                    <span className="text-yellow-400">
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
          <div className="relative bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-700 rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-100">
                {editingIndex !== null ? 'Edit Sample' : 'Add Sample'}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* SAMPLE PURPOSE - Card Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sample Purpose <span className="text-red-500">*</span>
                  <span className="ml-1.5"><Tooltip text="Defines how this sample will be used in analysis. Example: Tumor → somatic variants | Normal → matched normal filtering | RNA → fusion detection | Germline → hereditary risk" /></span>
                </label>
                {formErrors.sample_purpose && (
                  <p className="text-sm text-red-400 mb-2">{formErrors.sample_purpose}</p>
                )}
                <div className="grid grid-cols-3 gap-3">
                  {PURPOSE_CARDS.map((card) => {
                    const isSelected = form.sample_purpose === card.purpose;
                    return (
                      <button
                        key={card.purpose}
                        type="button"
                        onClick={() => handlePurposeChange(card.purpose)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-lime-400 bg-lime-900/20 shadow-sm'
                            : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'
                        }`}
                      >
                        <div className="text-xl mb-1">{card.icon}</div>
                        <p className="text-sm font-medium text-gray-100">{SAMPLE_PURPOSE_LABELS[card.purpose]}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{card.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.sample_purpose && (
                <>
                  <hr className="border-gray-700" />

                  {/* SEQUENCING INTENT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sequencing Intent <span className="text-red-500">*</span>
                      <span className="ml-1.5"><Tooltip text="Primary analysis objective that determines which bioinformatics modules are recommended and how results are interpreted." /></span>
                    </label>
                    {formErrors.sequencing_intent && (
                      <p className="text-sm text-red-400 mb-2">{formErrors.sequencing_intent}</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {SEQUENCING_INTENT_OPTIONS.map((intent) => {
                        const isSelected = form.sequencing_intent === intent.value;
                        return (
                          <button
                            key={intent.value}
                            type="button"
                            onClick={() => setForm({ ...form, sequencing_intent: intent.value })}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'border-lime-400 bg-lime-900/20'
                                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-100">{intent.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{intent.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <hr className="border-gray-700" />

                  {/* Sample Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Sample ID (auto-generated)
                      </label>
                      <input
                        type="text"
                        value={nextSampleCode}
                        disabled
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-400 text-sm font-mono"
                      />
                    </div>

                    {/* Matched Normal — only for Normal (Blood) purpose */}
                    {isNormalPurpose && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Matched Normal?
                          <span className="ml-1.5"><Tooltip text="Matched normal improves somatic variant calling by removing germline variants and false positives." /></span>
                        </label>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input
                              type="radio"
                              name="matched_normal"
                              checked={form.matched_normal === true}
                              onChange={() => setForm({ ...form, matched_normal: true })}
                              className="text-lime-400"
                            />
                            Yes
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input
                              type="radio"
                              name="matched_normal"
                              checked={form.matched_normal !== true}
                              onChange={() => setForm({ ...form, matched_normal: false })}
                              className="text-lime-400"
                            />
                            No
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Anatomical Site + Tumor Content (conditional) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Anatomical Site <span className="text-red-500">*</span>
                        <span className="ml-1.5"><Tooltip text="Physical location where the sample was collected, filtered by sample purpose." /></span>
                      </label>
                      {formErrors.anatomical_site && (
                        <p className="text-sm text-red-400 mb-1">{formErrors.anatomical_site}</p>
                      )}
                      <select
                        value={form.anatomical_site || ''}
                        onChange={(e) => setForm({ ...form, anatomical_site: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      >
                        <option value="">Select anatomical site...</option>
                        {anatomicalOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tumor Content — only for Tumor / Relapse */}
                    {isTumorPurpose && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Tumor Content %
                          <span className="text-red-500"> *</span>
                          <span className="text-gray-400 font-normal ml-1">(0-100)</span>
                          <span className="ml-1.5"><Tooltip text="Estimated percentage of tumor cells in the sample. Low tumor purity may reduce variant detection sensitivity." /></span>
                        </label>
                        {formErrors.tumor_content && (
                          <p className="text-sm text-red-400 mb-1">{formErrors.tumor_content}</p>
                        )}
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={form.tumor_content ?? ''}
                            onChange={(e) => setForm({ ...form, tumor_content: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="e.g., 65"
                            className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tissue Type + Preservation Method */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Tissue Type
                        <span className="ml-1.5"><Tooltip text="Specimen type classification. Selecting a tissue type auto-suggests the preservation method." /></span>
                      </label>
                      <select
                        value={form.tissue_type || ''}
                        onChange={(e) => handleTissueTypeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      >
                        <option value="">Select tissue type...</option>
                        {TISSUE_TYPE_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Preservation Method
                        <span className="ml-1.5"><Tooltip text="Sample preservation affects DNA/RNA quality and downstream sequencing performance." /></span>
                      </label>
                      <select
                        value={form.preservation_method || ''}
                        onChange={(e) => setForm({ ...form, preservation_method: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
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
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Collection Date
                      </label>
                      <input
                        type="date"
                        value={form.collection_date || ''}
                        onChange={(e) => setForm({ ...form, collection_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Quality Status
                        <span className="ml-1.5"><Tooltip text="Initial pathology quality assessment before sequencing." /></span>
                      </label>
                      <select
                        value={form.quality_status || 'pending'}
                        onChange={(e) => setForm({ ...form, quality_status: e.target.value as QualityStatus })}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      >
                        {QUALITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{QUALITY_ICONS[opt.value]} {opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pathology Notes + Pathology Review */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Pathology Notes
                        <span className="text-gray-400 font-normal ml-1">(artifacts, necrosis, fixation issues)</span>
                        <span className="ml-1.5"><Tooltip text="Record artifacts, necrosis, fixation issues, low cellularity, or contamination risks." /></span>
                      </label>
                      <textarea
                        value={form.pathology_notes || ''}
                        onChange={(e) => setForm({ ...form, pathology_notes: e.target.value })}
                        rows={3}
                        placeholder="e.g., Necrosis: 20%, Stroma: 50%, Adequate for sequencing"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Pathology Review
                        <span className="ml-1.5"><Tooltip text="Document pathology validation before sequencing. Recommended for clinical-grade processing." /></span>
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={form.pathology_reviewed === true}
                            onChange={(e) => setForm({ ...form, pathology_reviewed: e.target.checked })}
                            className="rounded text-lime-400 focus:ring-lime-400"
                          />
                          Reviewed by Pathology
                        </label>
                        {form.pathology_reviewed && (
                          <>
                            <input
                              type="text"
                              value={form.pathology_reviewer || ''}
                              onChange={(e) => setForm({ ...form, pathology_reviewer: e.target.value })}
                              placeholder="Pathologist name"
                              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                            />
                            <input
                              type="date"
                              value={form.pathology_review_date || ''}
                              onChange={(e) => setForm({ ...form, pathology_review_date: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-gray-900 flex justify-end gap-3 px-6 py-4 border-t border-gray-700 rounded-b-xl">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-lime-500 text-gray-900 rounded-lg hover:bg-lime-400 transition-colors font-medium"
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
