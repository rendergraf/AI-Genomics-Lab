'use client';

import React from 'react';
import type { PipelineModuleStatus } from '@/types/pipeline';

interface ModuleStatusCardProps {
  module: PipelineModuleStatus;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; bar: string }> = {
  completed: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', bar: 'bg-green-500' },
  running: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500' },
  failed: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', bar: 'bg-red-500' },
  pending: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-500', bar: 'bg-gray-300' },
  skipped: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-400', bar: 'bg-gray-200' },
};

export const ModuleStatusCard: React.FC<ModuleStatusCardProps> = ({ module }) => {
  const style = STATUS_STYLES[module.status] || STATUS_STYLES.pending;

  return (
    <div className={`border rounded-lg p-4 ${style.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${style.text}`}>{module.label}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
          {module.status}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${module.progress}%` }} />
      </div>
    </div>
  );
};
