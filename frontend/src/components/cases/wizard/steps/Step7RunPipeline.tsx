'use client';

import React from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';

const AVAILABLE_MODULES = [
  { id: 'quality_control' as const, label: 'Quality Control', description: 'FastQC, MultiQC, read trimming' },
  { id: 'alignment' as const, label: 'Alignment', description: 'BWA-MEM2 / Minimap2 alignment to reference' },
  { id: 'variant_calling' as const, label: 'Variant Calling', description: 'DeepVariant / GATK HaplotypeCaller' },
  { id: 'annotation' as const, label: 'Annotation', description: 'VEP / SnpEff functional annotation' },
  { id: 'pharmacogenomics' as const, label: 'Pharmacogenomics', description: 'PGx variant analysis' },
  { id: 'tumor_only' as const, label: 'Tumor-Only Analysis', description: 'Somatic variant calling (no normal)' },
  { id: 'rnaseq' as const, label: 'RNA-Seq', description: 'Gene expression quantification' },
  { id: 'cnv' as const, label: 'CNV Analysis', description: 'Copy number variation detection' },
];

export const Step7RunPipeline: React.FC = () => {
  const { caseData, updateCaseData } = useCaseWizardStore();
  const selectedModules = caseData.requested_modules;

  const toggleModule = (moduleId: string) => {
    const updated = selectedModules.includes(moduleId)
      ? selectedModules.filter((m) => m !== moduleId)
      : [...selectedModules, moduleId];
    updateCaseData({ requested_modules: updated });
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Pipeline Module Selection</h3>
        <p className="text-sm text-gray-500 mt-1">
          Select the bioinformatics pipeline modules to execute.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {AVAILABLE_MODULES.map((module) => {
          const isSelected = selectedModules.includes(module.id);
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => toggleModule(module.id)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{module.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{module.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
