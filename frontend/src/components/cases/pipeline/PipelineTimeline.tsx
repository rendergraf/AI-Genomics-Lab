'use client';

import React from 'react';
import type { PipelineModuleStatus } from '@/types/pipeline';

interface PipelineTimelineProps {
  moduleStatuses: PipelineModuleStatus[];
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: (
    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  running: (
    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  ),
  failed: (
    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  pending: (
    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
  ),
  skipped: (
    <div className="w-4 h-4 border-2 border-gray-300 rounded-full">
      <div className="w-2 h-0.5 bg-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
    </div>
  ),
};

export const PipelineTimeline: React.FC<PipelineTimelineProps> = ({ moduleStatuses }) => {
  return (
    <div className="space-y-0">
      {moduleStatuses.map((mod, index) => (
        <div key={mod.module} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white relative z-10
              ${mod.status === 'completed' ? 'border-green-500 bg-green-50' :
                mod.status === 'running' ? 'border-blue-500 bg-blue-50' :
                mod.status === 'failed' ? 'border-red-500 bg-red-50' :
                'border-gray-300 bg-white'
              }"
            >
              {STATUS_ICONS[mod.status] || STATUS_ICONS.pending}
            </div>
            {index < moduleStatuses.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 min-h-[2rem]" />
            )}
          </div>
          <div className="pb-6">
            <p className={`text-sm font-medium ${
              mod.status === 'completed' ? 'text-green-700' :
              mod.status === 'running' ? 'text-blue-700' :
              mod.status === 'failed' ? 'text-red-700' :
              'text-gray-500'
            }`}>
              {mod.label}
            </p>
            <p className="text-xs text-gray-400 capitalize">{mod.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
