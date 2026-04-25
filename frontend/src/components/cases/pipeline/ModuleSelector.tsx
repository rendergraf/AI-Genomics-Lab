'use client';

import React from 'react';
import type { PipelineModule } from '@/types/pipeline';

interface ModuleSelectorProps {
  selected: string[];
  onChange: (modules: string[]) => void;
}

const MODULES: { id: PipelineModule; label: string; description: string }[] = [
  { id: 'quality_control', label: 'Quality Control', description: 'FastQC, MultiQC' },
  { id: 'alignment', label: 'Alignment', description: 'BWA-MEM2 / Minimap2' },
  { id: 'variant_calling', label: 'Variant Calling', description: 'DeepVariant / GATK' },
  { id: 'annotation', label: 'Annotation', description: 'VEP / SnpEff' },
  { id: 'pharmacogenomics', label: 'Pharmacogenomics', description: 'PGx analysis' },
  { id: 'tumor_only', label: 'Tumor-Only', description: 'Somatic calling' },
  { id: 'rnaseq', label: 'RNA-Seq', description: 'Expression quantification' },
  { id: 'cnv', label: 'CNV Analysis', description: 'Copy number variation' },
];

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({ selected, onChange }) => {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id]);
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {MODULES.map((mod) => {
        const isSelected = selected.includes(mod.id);
        return (
          <button
            key={mod.id}
            type="button"
            onClick={() => toggle(mod.id)}
            className={`text-left p-3 rounded-lg border-2 transition-all ${
              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{mod.label}</p>
                <p className="text-xs text-gray-500">{mod.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
