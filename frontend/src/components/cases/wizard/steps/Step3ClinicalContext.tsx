'use client';

import React, { useEffect, useCallback } from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import { useClinicalCatalogStore } from '@/stores/clinicalCatalogStore';

export const Step3ClinicalContext: React.FC = () => {
  const { caseData, updateCaseData } = useCaseWizardStore();
  const {
    cancerTypes,
    filteredPrimarySites,
    allPrimarySites,
    histologySubtypes,
    stages,
    isLoading,
    error,
    loadAll,
    loadDependentData,
    clearDependentData,
  } = useClinicalCatalogStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedCancerType = cancerTypes.find(
    (ct) => ct.name === caseData.cancer_type
  );

  const shouldAutoSelectPrimary =
    filteredPrimarySites.length === 1 && !!caseData.cancer_type;

  useEffect(() => {
    if (shouldAutoSelectPrimary) {
      const autoSite = filteredPrimarySites[0].name;
      if (caseData.primary_site !== autoSite) {
        updateCaseData({ primary_site: autoSite });
      }
    }
  }, [shouldAutoSelectPrimary, filteredPrimarySites, caseData.primary_site, updateCaseData]);

  const handleCancerTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const name = e.target.value;
      const cancerType = cancerTypes.find((ct) => ct.name === name);
      updateCaseData({
        cancer_type: name,
        primary_site: '',
        histology_subtype: '',
        metastatic_sites: [],
      });
      if (cancerType) {
        loadDependentData(cancerType.id);
      } else {
        clearDependentData();
      }
    },
    [cancerTypes, updateCaseData, loadDependentData, clearDependentData]
  );

  const handlePrimarySiteChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateCaseData({ primary_site: e.target.value });
    },
    [updateCaseData]
  );

  const handleHistologyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateCaseData({ histology_subtype: e.target.value });
    },
    [updateCaseData]
  );

  const handleStageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateCaseData({ stage: e.target.value });
    },
    [updateCaseData]
  );

  const handleMetastaticToggle = useCallback(
    (site: string) => {
      const current = caseData.metastatic_sites || [];
      const updated = current.includes(site)
        ? current.filter((s) => s !== site)
        : [...current, site];
      updateCaseData({ metastatic_sites: updated });
    },
    [caseData.metastatic_sites, updateCaseData]
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">Clinical Context</h3>
          <p className="text-sm text-gray-500 mt-1">Loading catalog data...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const metastaticOptions = allPrimarySites.filter(
    (s) => s.name !== caseData.primary_site
  );

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Clinical Context</h3>
        <p className="text-sm text-gray-500 mt-1">
          Enter the oncological context for this case. Selecting a Cancer Type
          will automatically filter available Primary Sites and Histology Subtypes.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancer Type <span className="text-red-500">*</span>
            </label>
            <select
              value={caseData.cancer_type}
              onChange={handleCancerTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select cancer type...</option>
              {cancerTypes.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Site <span className="text-red-500">*</span>
            </label>
            {shouldAutoSelectPrimary ? (
              <div className="w-full px-3 py-2 border border-green-300 bg-green-50 rounded-lg text-sm text-green-800 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{filteredPrimarySites[0].name}</span>
                <span className="text-green-500 text-xs ml-auto">auto-detected</span>
              </div>
            ) : (
              <select
                value={caseData.primary_site}
                onChange={handlePrimarySiteChange}
                disabled={!selectedCancerType}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {selectedCancerType ? 'Select primary site...' : 'Select cancer type first'}
                </option>
                {filteredPrimarySites.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Histology Subtype
            </label>
            <select
              value={caseData.histology_subtype}
              onChange={handleHistologyChange}
              disabled={!selectedCancerType}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {selectedCancerType ? 'Select subtype...' : 'Select cancer type first'}
              </option>
              {histologySubtypes.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              value={caseData.stage}
              onChange={handleStageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select stage...</option>
              {stages.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metastatic Sites
            <span className="text-gray-400 font-normal ml-1">(optional — select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {metastaticOptions.map((site) => {
              const isSelected = (caseData.metastatic_sites || []).includes(site.name);
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => handleMetastaticToggle(site.name)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {site.name}
                </button>
              );
            })}
          </div>
          {(caseData.metastatic_sites || []).length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {caseData.metastatic_sites.length} metastatic site(s) selected
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clinical Question
          </label>
          <textarea
            value={caseData.clinical_question}
            onChange={(e) => updateCaseData({ clinical_question: e.target.value })}
            rows={3}
            placeholder="e.g., Identify actionable mutations for targeted therapy, assess immunotherapy biomarkers..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
