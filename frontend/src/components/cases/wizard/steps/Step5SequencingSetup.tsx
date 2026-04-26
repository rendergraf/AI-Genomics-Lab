'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import { Tooltip } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import type { SequencingRun, LibraryType, ClinicalSample } from '@/types/sample';
import type { ReferenceGenome } from '@/types';
import {
  SAMPLE_PURPOSE_LABELS,
  ANATOMICAL_SITE_LABELS,
  LIBRARY_TYPE_LABELS,
} from '@/types/sample';

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

const LIBRARY_TYPES: { value: LibraryType; label: string }[] = [
  { value: 'dna', label: 'DNA' },
  { value: 'rna', label: 'RNA' },
  { value: 'cfdna', label: 'cfDNA' },
  { value: 'ffpe_dna', label: 'FFPE DNA' },
  { value: 'fresh_frozen_dna', label: 'Fresh Frozen DNA' },
];

const ASSAY_KITS = [
  { label: 'Illumina TruSeq DNA PCR-Free', value: 'truSeq_dna_pcr_free' },
  { label: 'Illumina TruSeq Nano DNA', value: 'truSeq_nano_dna' },
  { label: 'Illumina Stranded mRNA', value: 'truseq_stranded_mrna' },
  { label: 'Agilent SureSelect XT', value: 'sureselect_xt' },
  { label: 'Agilent SureSelect XT HS2', value: 'sureselect_xt_hs2' },
  { label: 'Twist Exome', value: 'twist_exome' },
  { label: 'Twist Comprehensive Exome', value: 'twist_comprehensive_exome' },
  { label: 'AmpliSeq for Illumina', value: 'ampliseq' },
  { label: 'IDT xGen Exome Research Panel', value: 'xgen_exome' },
  { label: 'NEBNext Ultra II DNA', value: 'nebnext_ultra_ii' },
  { label: 'Custom Panel', value: 'custom_panel' },
  { label: 'Other', value: 'other_kit' },
];

const COVERAGE_DEFAULTS: Record<string, number> = {
  wgs: 30,
  wes: 150,
  rna_seq: 50,
  targeted: 500,
};

function coverageUnit(seqType: string): string {
  if (seqType === 'rna_seq') return 'M reads';
  return 'X';
}

function coveragePlaceholder(seqType: string): string {
  const def = COVERAGE_DEFAULTS[seqType];
  const unit = coverageUnit(seqType);
  return def ? `e.g., ${def}${unit}` : 'e.g., 30X';
}

const emptyRun = (sampleCode?: string): Partial<SequencingRun> => ({
  sample_code: sampleCode || '',
  platform: 'illumina',
  sequencing_type: 'wes',
  read_type: 'paired_end',
  coverage_target: undefined,
  library_type: undefined,
  assay_kit: '',
  paired_normal_sample_code: '',
  insert_size: undefined,
  sequencing_notes: '',
  status: 'pending',
});

function sampleLabel(sample: ClinicalSample): string {
  const purpose = sample.sample_purpose ? SAMPLE_PURPOSE_LABELS[sample.sample_purpose] || sample.sample_purpose : 'Unknown';
  const site = sample.anatomical_site
    ? (ANATOMICAL_SITE_LABELS[sample.anatomical_site as keyof typeof ANATOMICAL_SITE_LABELS] || sample.anatomical_site)
    : '';
  return `${sample.sample_code || '—'} — ${purpose}${site ? ` — ${site}` : ''}`;
}

export const Step5SequencingSetup: React.FC = () => {
  const { caseData, samples, sequencingRuns, addSequencingRun, updateCaseData } = useCaseWizardStore();
  const [form, setForm] = useState<Partial<SequencingRun>>(emptyRun());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customKit, setCustomKit] = useState('');

  const [indexedGenomes, setIndexedGenomes] = useState<ReferenceGenome[]>([]);
  const [genomesLoading, setGenomesLoading] = useState(true);
  const [genomesError, setGenomesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGenomesLoading(true);
    setGenomesError(null);
    apiClient.get<ReferenceGenome[]>('/api/v1/indexed-genomes')
      .then((data) => {
        if (cancelled) return;
        setIndexedGenomes(data);
        if (data.length === 1 && !caseData.genome_build) {
          updateCaseData({ genome_build: `${data[0].species} (${data[0].build})` });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setGenomesError(err instanceof Error ? err.message : 'Failed to load genomes');
      })
      .finally(() => {
        if (!cancelled) setGenomesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleGenomeSelect = useCallback((value: string) => {
    updateCaseData({ genome_build: value });
  }, [updateCaseData]);

  const selectedGenome = useMemo(() => {
    if (indexedGenomes.length === 1) return indexedGenomes[0];
    return indexedGenomes.find((g) => `${g.species} (${g.build})` === caseData.genome_build) || null;
  }, [indexedGenomes, caseData.genome_build]);

  const configuredSampleCodes = useMemo(() => {
    return new Set(sequencingRuns.map((r) => r.sample_code).filter(Boolean));
  }, [sequencingRuns]);

  const runsBySample = useMemo(() => {
    const map = new Map<string, SequencingRun[]>();
    for (const run of sequencingRuns) {
      const code = run.sample_code || 'unknown';
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(run);
    }
    return map;
  }, [sequencingRuns]);

  const unconfiguredSamples = useMemo(() => {
    return samples.filter((s) => !s.sample_code || !configuredSampleCodes.has(s.sample_code));
  }, [samples, configuredSampleCodes]);

  const normalSamples = useMemo(() => {
    return samples.filter((s) => s.sample_purpose === 'normal' || s.sample_purpose === 'germline');
  }, [samples]);

  const selectedSample = useMemo(() => {
    return samples.find((s) => s.sample_code === form.sample_code);
  }, [samples, form.sample_code]);

  const isTumorSample = selectedSample?.sample_purpose === 'tumor' || selectedSample?.sample_purpose === 'relapse';
  const showInsertSize = form.platform === 'illumina' && (form.sequencing_type === 'wgs' || form.sequencing_type === 'wes');

  const handleSampleSelect = useCallback((sampleCode: string) => {
    setForm(emptyRun(sampleCode));
    setCustomKit('');
    setFormErrors({});
  }, []);

  const handleSeqTypeChange = useCallback((value: string) => {
    const coverageDefault = COVERAGE_DEFAULTS[value] || undefined;
    setForm({ ...form, sequencing_type: value as SequencingRun['sequencing_type'], coverage_target: coverageDefault });
  }, [form]);

  const handleKitChange = useCallback((value: string) => {
    if (value === 'custom_panel') {
      setForm({ ...form, assay_kit: '' });
      setCustomKit('');
    } else if (value === 'other_kit') {
      setForm({ ...form, assay_kit: 'Other' });
      setCustomKit('');
    } else {
      const kit = ASSAY_KITS.find((k) => k.value === value);
      setForm({ ...form, assay_kit: kit?.label || value });
      setCustomKit(value);
    }
  }, [form]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!form.sample_code) {
      errors.sample_code = 'Select a sample';
    }
    if (!form.platform) {
      errors.platform = 'Platform is required';
    }
    if (!form.sequencing_type) {
      errors.sequencing_type = 'Sequencing type is required';
    }
    if (!form.library_type) {
      errors.library_type = 'Library type is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const run: SequencingRun = {
      sample_code: form.sample_code || '',
      platform: form.platform as SequencingRun['platform'],
      sequencing_type: form.sequencing_type as SequencingRun['sequencing_type'],
      read_type: form.read_type as SequencingRun['read_type'],
      coverage_target: form.coverage_target,
      library_type: form.library_type as LibraryType,
      assay_kit: form.assay_kit || '',
      paired_normal_sample_code: isTumorSample ? (form.paired_normal_sample_code || '') : '',
      insert_size: showInsertSize ? form.insert_size : undefined,
      sequencing_notes: form.sequencing_notes || '',
      status: 'pending',
    };

    addSequencingRun(run);

    const nextSample = unconfiguredSamples.find((s) => s.sample_code !== form.sample_code);
    setForm(emptyRun(nextSample?.sample_code || ''));
    setCustomKit('');
    setFormErrors({});
  }, [form, validateForm, addSequencingRun, unconfiguredSamples, isTumorSample, showInsertSize]);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-200">Sequencing Configuration</h3>
        <p className="text-sm text-gray-200 mt-1">
          Define how each registered sample was sequenced. Each sample may have a different sequencing strategy.
          <span className="ml-1.5"><Tooltip text="Each biological sample (tumor, normal, RNA, ctDNA) may have a different sequencing strategy. Specify platform, sequencing type, read structure, and target coverage for each sample. This determines which genomic analysis modules can be executed and how FASTQ files will be processed." /></span>
        </p>
      </div>

      {samples.length === 0 && (
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-400">Register samples first before configuring sequencing.</p>
        </div>
      )}

      {samples.length > 0 && (
        <>
          {/* Reference Genome — dynamic from indexed_genomes */}
          <div className="mb-4 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg">
            <div className="flex items-center gap-2 text-sm mb-2">
              <svg className="w-4 h-4 text-lime-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-gray-300 font-medium">Reference Genome</span>
              <span className="text-gray-500 text-xs ml-auto">applies to all samples in this case</span>
            </div>

            {genomesLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading aligned genomes...
              </div>
            )}

            {genomesError && (
              <p className="text-sm text-red-400">Error loading genomes: {genomesError}</p>
            )}

            {!genomesLoading && !genomesError && indexedGenomes.length === 0 && (
              <div className="border-2 border-dashed border-yellow-600 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-400 font-medium">No aligned genomes available</p>
                <p className="text-xs text-gray-400 mt-1">
                  At least one genome must be aligned before configuring sequencing.{' '}
                  <a href="/dashboard?tab=genomes" className="text-lime-400 hover:text-lime-300 underline">Align Genome</a>
                </p>
              </div>
            )}

            {!genomesLoading && !genomesError && indexedGenomes.length === 1 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-100 font-mono font-medium">
                  {indexedGenomes[0].species} ({indexedGenomes[0].build})
                </span>
                <span className="text-gray-500 text-xs">— ready</span>
                <svg className="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {!genomesLoading && !genomesError && indexedGenomes.length > 1 && (
              <select
                value={caseData.genome_build || ''}
                onChange={(e) => handleGenomeSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
              >
                <option value="">Select reference genome...</option>
                {indexedGenomes.map((g) => {
                  const label = `${g.species} (${g.build})`;
                  return (
                    <option key={g.id} value={label}>{label}</option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Registered Samples Overview */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">
              Registered Samples
            </h4>
            <div className="space-y-2">
              {samples.map((sample, index) => {
                const sampleCode = sample.sample_code || '';
                const configured = configuredSampleCodes.has(sampleCode);
                const sampleRuns = runsBySample.get(sampleCode) || [];
                return (
                  <div key={index} className="border border-gray-600 rounded-lg bg-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${configured ? 'bg-lime-400' : 'bg-yellow-500'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-100 truncate">
                            {sampleLabel(sample)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {sample.tissue_type || 'No tissue type'} &bull; {sample.preservation_method || 'No preservation'}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {configured ? (
                          <span className="text-xs text-lime-400 font-medium">{sampleRuns.length} run(s)</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSampleSelect(sampleCode)}
                            className="px-3 py-1 text-xs bg-lime-500 text-gray-900 rounded-lg hover:bg-lime-400 transition-colors font-medium"
                          >
                            + Configure Sequencing
                          </button>
                        )}
                      </div>
                    </div>
                    {sampleRuns.length > 0 && (
                      <div className="border-t border-gray-700 divide-y divide-gray-700">
                        {sampleRuns.map((run, ri) => (
                          <div key={ri} className="px-4 py-2 pl-9 text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                            <span className="text-gray-300 font-medium">{run.platform}</span>
                            <span>&middot;</span>
                            <span>{run.sequencing_type}</span>
                            <span>&middot;</span>
                            <span>{run.read_type === 'paired_end' ? 'PE' : 'SE'}</span>
                            {run.coverage_target && <><span>&middot;</span><span>{run.coverage_target}{coverageUnit(run.sequencing_type)}</span></>}
                            {run.library_type && <><span>&middot;</span><span>{LIBRARY_TYPE_LABELS[run.library_type]}</span></>}
                            {run.assay_kit && <><span>&middot;</span><span className="text-gray-500">{run.assay_kit}</span></>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Sequencing Run Form */}
          <div className="border border-gray-600 rounded-lg bg-gray-800 p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-4">
              {form.sample_code ? 'Configure Sequencing Run' : 'Select a sample to configure'}
            </h4>

            <div className="space-y-4">
              {/* Sample Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sample <span className="text-red-500">*</span>
                  <span className="ml-1.5"><Tooltip text="Select which registered sample this sequencing run belongs to. Each sample can have multiple runs (e.g., WES + RNA-seq)." /></span>
                </label>
                {formErrors.sample_code && (
                  <p className="text-sm text-red-400 mb-1">{formErrors.sample_code}</p>
                )}
                <select
                  value={form.sample_code || ''}
                  onChange={(e) => handleSampleSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                >
                  <option value="">Select sample...</option>
                  {samples.map((sample, idx) => {
                    const code = sample.sample_code || '';
                    const hasRuns = configuredSampleCodes.has(code);
                    return (
                      <option key={idx} value={code} disabled={hasRuns}>
                        {sampleLabel(sample)}{hasRuns ? ' (configured)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {form.sample_code && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Platform <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.platform || 'illumina'}
                        onChange={(e) => setForm({ ...form, platform: e.target.value as SequencingRun['platform'] })}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Sequencing Type <span className="text-red-500">*</span>
                        <span className="ml-1.5"><Tooltip text="WGS for comprehensive genome, WES for exome, RNA-Seq for transcriptome, Targeted Panel for specific genes. Coverage auto-defaults based on selection." /></span>
                      </label>
                      {formErrors.sequencing_type && (
                        <p className="text-sm text-red-400 mb-1">{formErrors.sequencing_type}</p>
                      )}
                      <select
                        value={form.sequencing_type || 'wes'}
                        onChange={(e) => handleSeqTypeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      >
                        {SEQ_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Library Type <span className="text-red-500">*</span>
                        <span className="ml-1.5"><Tooltip text="DNA for genomic, RNA for transcriptomic, cfDNA for liquid biopsy, FFPE DNA for degraded samples. Library type affects pipeline QC and analysis modules." /></span>
                      </label>
                      {formErrors.library_type && (
                        <p className="text-sm text-red-400 mb-1">{formErrors.library_type}</p>
                      )}
                      <select
                        value={form.library_type || ''}
                        onChange={(e) => setForm({ ...form, library_type: e.target.value as LibraryType })}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      >
                        <option value="">Select library type...</option>
                        {LIBRARY_TYPES.map((lt) => (
                          <option key={lt.value} value={lt.value}>{lt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Read Type
                      </label>
                      <select
                        value={form.read_type || 'paired_end'}
                        onChange={(e) => setForm({ ...form, read_type: e.target.value as SequencingRun['read_type'] })}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      >
                        <option value="paired_end">Paired-End</option>
                        <option value="single_end">Single-End</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Assay / Kit
                        <span className="ml-1.5"><Tooltip text="Library preparation kit used. Affects coverage bias, CNV reliability, GC bias, and duplicate rate. Critical for clinical interpretation." /></span>
                      </label>
                      <select
                        value={customKit}
                        onChange={(e) => handleKitChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      >
                        <option value="">Select assay / kit...</option>
                        {ASSAY_KITS.map((kit) => (
                          <option key={kit.value} value={kit.value}>{kit.label}</option>
                        ))}
                      </select>
                      {form.assay_kit && !ASSAY_KITS.find((k) => k.label === form.assay_kit) && (
                        <input
                          type="text"
                          value={form.assay_kit}
                          onChange={(e) => setForm({ ...form, assay_kit: e.target.value })}
                          placeholder="Enter custom kit name"
                          className="mt-2 w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Target Coverage
                        <span className="ml-1.5"><Tooltip text="Desired sequencing depth or read count. Auto-set based on sequencing type: WGS 30X, WES 150X, RNA-Seq 50M, Targeted 500X." /></span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          value={form.coverage_target ?? ''}
                          onChange={(e) => setForm({ ...form, coverage_target: parseInt(e.target.value) || undefined })}
                          placeholder={coveragePlaceholder(form.sequencing_type || 'wes')}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm pr-14"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                          {coverageUnit(form.sequencing_type || 'wes')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Paired Normal Sample — only for Tumor / Relapse */}
                  {isTumorSample && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Paired Normal Sample
                        <span className="ml-1.5"><Tooltip text="Link this tumor sample to a matched normal (blood or germline) for somatic variant calling. The normal sample is used to filter germline variants and reduce false positives." /></span>
                      </label>
                      <select
                        value={form.paired_normal_sample_code || ''}
                        onChange={(e) => setForm({ ...form, paired_normal_sample_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      >
                        <option value="">No paired normal</option>
                        {normalSamples.map((ns, idx) => (
                          <option key={idx} value={ns.sample_code || ''}>
                            {sampleLabel(ns)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Insert Size — conditional: Illumina + WGS/WES */}
                    {showInsertSize && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Insert Size (bp)
                          <span className="text-gray-400 font-normal ml-1">(optional)</span>
                          <span className="ml-1.5"><Tooltip text="Relevant for Illumina WGS/WES libraries. Affects fragment size selection and sequencing performance." /></span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={form.insert_size ?? ''}
                          onChange={(e) => setForm({ ...form, insert_size: parseInt(e.target.value) || undefined })}
                          placeholder="e.g., 350"
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                        />
                      </div>
                    )}

                    <div className={showInsertSize ? '' : 'col-span-2'}>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Sequencing Notes
                        <span className="text-gray-400 font-normal ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.sequencing_notes || ''}
                        onChange={(e) => setForm({ ...form, sequencing_notes: e.target.value })}
                        placeholder="e.g., Dual-index, NovaSeq 6000 S4 flow cell"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full px-4 py-2 text-sm bg-lime-500 text-gray-900 rounded-lg hover:bg-lime-400 transition-colors font-medium"
                  >
                    Save Sequencing Run
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          {sequencingRuns.length > 0 && (
            <div className="mt-6 border border-gray-600 rounded-lg divide-y divide-gray-600">
              <div className="px-4 py-2 bg-gray-800 rounded-t-lg">
                <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Configured Sequencing Runs ({sequencingRuns.length})
                </span>
              </div>
              {sequencingRuns.map((run, index) => {
                const sample = samples.find((s) => s.sample_code === run.sample_code);
                return (
                  <div key={index} className="px-4 py-3 flex items-center justify-between bg-gray-800">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-100">
                        {sample ? sampleLabel(sample) : run.sample_code || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {run.platform} &middot; {run.sequencing_type} &middot; {run.read_type === 'paired_end' ? 'PE' : 'SE'}
                        {run.coverage_target ? ` &middot; ${run.coverage_target}${coverageUnit(run.sequencing_type)}` : ''}
                        {run.library_type ? ` &middot; ${LIBRARY_TYPE_LABELS[run.library_type]}` : ''}
                        {run.assay_kit ? ` &middot; ${run.assay_kit}` : ''}
                        {run.paired_normal_sample_code ? ` &middot; paired: ${run.paired_normal_sample_code}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
