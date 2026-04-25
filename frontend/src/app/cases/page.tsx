'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCaseStore } from '@/stores/caseStore';
import { usePatientStore } from '@/stores/patientStore';
import { useCaseFilters } from '@/hooks/useCaseFilters';
import { CreatePatientDialog } from '@/components/patients/CreatePatientDialog';
import type { ClinicalCase } from '@/types/case';
import type { CaseStatusFilter } from '@/hooks/useCaseFilters';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:         { label: 'Draft',        color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  pending:       { label: 'Pending',      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  waiting_fastq: { label: 'Waiting FASTQ', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  active:        { label: 'Active',       color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  running:       { label: 'Running',      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  report:        { label: 'Report Ready', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  critical:      { label: 'Critical',     color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  blocked:       { label: 'Blocked',      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  failed:        { label: 'Failed',       color: 'bg-red-600/20 text-red-400 border-red-600/30' },
  completed:     { label: 'Completed',    color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  archived:      { label: 'Archived',     color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
};

const STATUS_OPTIONS: { value: CaseStatusFilter; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    value: value as CaseStatusFilter,
    label: config.label,
  })),
];

export default function CasesPage() {
  const router = useRouter();
  const { cases, isLoading, error, loadCases } = useCaseStore();
  const { loadPatients } = usePatientStore();
  const {
    searchQuery,
    statusFilter,
    cancerTypeFilter,
    filteredCases,
    setSearchQuery,
    setStatusFilter,
    setCancerTypeFilter,
    clearFilters,
    cancerTypes,
  } = useCaseFilters(cases);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);

  useEffect(() => {
    loadCases();
    loadPatients();
  }, [loadCases, loadPatients]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || cancerTypeFilter;

  const handlePatientCreated = useCallback(() => {
    setShowNewPatientDialog(false);
  }, []);

  const statusBadge = (status: ClinicalCase['status']) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Clinical Cases</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage and review all clinical cases</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewPatientDialog(true)}
            className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Nuevo Paciente
          </button>
          <Link
            href="/cases/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Case
          </Link>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case code, patient ID, cancer type, or clinical question..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaseStatusFilter)}
            className="px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {cancerTypes.length > 0 && (
            <select
              value={cancerTypeFilter}
              onChange={(e) => setCancerTypeFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            >
              <option value="">All Cancer Types</option>
              {cancerTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-900/30 border border-red-800/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-sm text-zinc-500">Loading cases...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-16 text-center">
          <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-zinc-300 mb-2">
            {hasActiveFilters ? 'No matching cases' : 'No cases yet'}
          </h3>
          <p className="text-sm text-zinc-500 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first clinical case to start the genomics analysis workflow.'}
          </p>
          {!hasActiveFilters && (
            <Link
              href="/cases/new"
              className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Create New Case
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700/50 bg-zinc-800/50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Case Code</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Cancer Type</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Stage</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/cases/${c.id}`)}
                    className="hover:bg-zinc-700/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-100">{c.case_code}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      {c.patient?.external_patient_id || `Patient #${c.patient_id}`}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{c.cancer_type || '—'}</td>
                    <td className="px-4 py-3 text-zinc-300">{c.stage || '—'}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/cases/${c.id}`}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-zinc-700/50 bg-zinc-800/50 text-xs text-zinc-500">
            Showing {filteredCases.length} of {cases.length} cases
          </div>
        </div>
      )}

      <CreatePatientDialog
        isOpen={showNewPatientDialog}
        onClose={() => setShowNewPatientDialog(false)}
        onSuccess={handlePatientCreated}
      />
    </div>
  );
}
