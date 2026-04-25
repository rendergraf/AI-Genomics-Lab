'use client';

import { useState, useMemo, useCallback } from 'react';
import type { ClinicalCase } from '@/types/case';

export type CaseStatusFilter = 'all' | 'draft' | 'pending' | 'waiting_fastq' | 'active' | 'running' | 'report' | 'critical' | 'blocked' | 'failed' | 'completed' | 'archived';

export interface UseCaseFiltersReturn {
  searchQuery: string;
  statusFilter: CaseStatusFilter;
  cancerTypeFilter: string;
  filteredCases: ClinicalCase[];
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: CaseStatusFilter) => void;
  setCancerTypeFilter: (cancerType: string) => void;
  clearFilters: () => void;
  cancerTypes: string[];
}

export function useCaseFilters(cases: ClinicalCase[]): UseCaseFiltersReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatusFilter>('all');
  const [cancerTypeFilter, setCancerTypeFilter] = useState('');

  const cancerTypes = useMemo(() => {
    const types = new Set(cases.map((c) => c.cancer_type).filter(Boolean));
    return Array.from(types).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          c.case_code.toLowerCase().includes(q) ||
          c.cancer_type?.toLowerCase().includes(q) ||
          c.primary_site?.toLowerCase().includes(q) ||
          c.clinical_question?.toLowerCase().includes(q) ||
          c.patient?.external_patient_id?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      if (cancerTypeFilter && c.cancer_type !== cancerTypeFilter) {
        return false;
      }

      return true;
    });
  }, [cases, searchQuery, statusFilter, cancerTypeFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCancerTypeFilter('');
  }, []);

  return {
    searchQuery,
    statusFilter,
    cancerTypeFilter,
    filteredCases,
    setSearchQuery,
    setStatusFilter,
    setCancerTypeFilter,
    clearFilters,
    cancerTypes,
  };
}
