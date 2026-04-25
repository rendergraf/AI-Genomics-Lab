'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCaseStore } from '@/stores/caseStore';
import { useSampleStore } from '@/stores/sampleStore';
import { usePipelineStore } from '@/stores/pipelineStore';
import type { ClinicalCase } from '@/types/case';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft:         { label: 'Draft',        color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: '○' },
  pending:       { label: 'Pending',      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: '◷' },
  waiting_fastq: { label: 'Waiting FASTQ', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: '◎' },
  active:        { label: 'Active',       color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '▶' },
  running:       { label: 'Running',      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: '⟳' },
  report:        { label: 'Report Ready', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '📋' },
  critical:      { label: 'Critical',     color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '⚠' },
  blocked:       { label: 'Blocked',      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: '⊘' },
  failed:        { label: 'Failed',       color: 'bg-red-600/20 text-red-400 border-red-600/30', icon: '✕' },
  completed:     { label: 'Completed',    color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: '✓' },
  archived:      { label: 'Archived',     color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', icon: '📦' },
};

const MODULE_LABELS: Record<string, string> = {
  quality_control: 'Quality Control',
  alignment: 'Alignment',
  variant_calling: 'Variant Calling',
  annotation: 'Annotation',
  pharmacogenomics: 'Pharmacogenomics',
  tumor_only: 'Tumor-Only Analysis',
  rnaseq: 'RNA-Seq',
  cnv: 'CNV Analysis',
};

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const { selectedCase, loadCase, isLoading, error } = useCaseStore();
  const { samples, loadSamples } = useSampleStore();
  const { currentRun, moduleStatuses, startPipeline, pollStatus } = usePipelineStore();
  const [isStartingPipeline, setIsStartingPipeline] = useState(false);

  const caseId = parseInt(params.id, 10);

  useEffect(() => {
    if (!isNaN(caseId)) {
      loadCase(caseId);
      loadSamples(caseId);
    }
  }, [caseId, loadCase, loadSamples]);

  useEffect(() => {
    if (currentRun?.id && currentRun.status === 'running') {
      const interval = setInterval(() => {
        pollStatus(currentRun.id!);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentRun?.id, currentRun?.status, pollStatus]);

  const handleStartPipeline = async () => {
    if (!selectedCase) return;
    setIsStartingPipeline(true);
    const modules = selectedCase.requested_modules?.length
      ? selectedCase.requested_modules
      : ['quality_control', 'alignment', 'variant_calling', 'annotation'];
    await startPipeline(caseId, modules);
    setIsStartingPipeline(false);
  };

  if (isLoading && !selectedCase) {
    return (
      <div className="p-6">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-sm text-zinc-500">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-900/30 border border-red-800/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
        <Link
          href="/cases"
          className="mt-4 inline-flex px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
        >
          Back to cases
        </Link>
      </div>
    );
  }

  if (!selectedCase) return null;

  const c = selectedCase;
  const statusInfo = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/cases"
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-zinc-100">{c.case_code}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
              <span>{statusInfo.icon}</span>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">Case #{c.id} &bull; Created {new Date(c.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-5">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Clinical Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Cancer Type</p>
                <p className="text-sm text-zinc-200 mt-0.5">{c.cancer_type || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Primary Site</p>
                <p className="text-sm text-zinc-200 mt-0.5">{c.primary_site || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Stage</p>
                <p className="text-sm text-zinc-200 mt-0.5">{c.stage || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Requested Modules</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {c.requested_modules?.length ? c.requested_modules.map((m) => (
                    <span key={m} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-xs border border-blue-500/20">
                      {MODULE_LABELS[m] || m}
                    </span>
                  )) : (
                    <span className="text-sm text-zinc-500">None selected</span>
                  )}
                </div>
              </div>
            </div>
            {c.clinical_question && (
              <div className="mt-4 pt-4 border-t border-zinc-700/30">
                <p className="text-xs text-zinc-500 mb-1">Clinical Question</p>
                <p className="text-sm text-zinc-200">{c.clinical_question}</p>
              </div>
            )}
          </div>

          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-5">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Samples</h2>
            {samples.length === 0 ? (
              <p className="text-sm text-zinc-500">No samples registered yet.</p>
            ) : (
              <div className="space-y-2">
                {samples.map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                    <div>
                      <p className="text-sm text-zinc-200">{s.sample_type}</p>
                      {s.tissue_type && <p className="text-xs text-zinc-500">{s.tissue_type}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Pipeline</h2>
              {(!currentRun || currentRun.status === 'completed' || currentRun.status === 'failed') && (
                <button
                  onClick={handleStartPipeline}
                  disabled={isStartingPipeline}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                >
                  {isStartingPipeline ? 'Starting...' : 'Run Pipeline'}
                </button>
              )}
            </div>
            {moduleStatuses.length === 0 ? (
              <p className="text-sm text-zinc-500">Pipeline has not been started. Click &ldquo;Run Pipeline&rdquo; to begin.</p>
            ) : (
              <div className="space-y-2">
                {moduleStatuses.map((m) => (
                  <div key={m.module} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        m.status === 'completed' ? 'bg-green-500' :
                        m.status === 'running' ? 'bg-indigo-500 animate-pulse' :
                        m.status === 'failed' ? 'bg-red-500' :
                        'bg-zinc-600'
                      }`} />
                      <span className="text-sm text-zinc-200">{m.label}</span>
                    </div>
                    <span className={`text-xs ${
                      m.status === 'completed' ? 'text-green-400' :
                      m.status === 'running' ? 'text-indigo-400' :
                      m.status === 'failed' ? 'text-red-400' :
                      'text-zinc-500'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {currentRun && (
              <div className="mt-4 pt-4 border-t border-zinc-700/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-500">Overall Progress</span>
                  <span className="text-xs text-zinc-400">{currentRun.progress}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-1.5">
                  <div
                    className="bg-indigo-500 rounded-full h-1.5 transition-all duration-500"
                    style={{ width: `${currentRun.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-5">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Patient</h2>
            {c.patient ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500">Patient ID</p>
                  <p className="text-sm text-zinc-200 mt-0.5">{c.patient.external_patient_id}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Sex</p>
                  <p className="text-sm text-zinc-200 mt-0.5">{c.patient.sex || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Date of Birth</p>
                  <p className="text-sm text-zinc-200 mt-0.5">{c.patient.date_of_birth || 'Not specified'}</p>
                </div>
                {c.patient.hospital_id && (
                  <div>
                    <p className="text-xs text-zinc-500">Hospital ID</p>
                    <p className="text-sm text-zinc-200 mt-0.5">{c.patient.hospital_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-zinc-500">Consent</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${
                    c.patient.consent_status === 'granted' ? 'bg-green-500/20 text-green-300' :
                    c.patient.consent_status === 'denied' ? 'bg-red-500/20 text-red-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {c.patient.consent_status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Patient #{c.patient_id}</p>
            )}
          </div>

          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-5">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Actions</h2>
            <div className="space-y-2">
              <button
                onClick={handleStartPipeline}
                disabled={isStartingPipeline || (currentRun?.status === 'running')}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isStartingPipeline ? 'Starting...' : 'Run Pipeline'}
              </button>
              <Link
                href={`/cases/${c.id}/edit`}
                className="block w-full px-4 py-2 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors text-sm text-center"
              >
                Edit Case
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
