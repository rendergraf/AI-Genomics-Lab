'use client';

import React from 'react';
import type { PipelineRun, PipelineModuleStatus } from '@/types/pipeline';

interface PipelineSummaryProps {
  run: PipelineRun | null;
  moduleStatuses: PipelineModuleStatus[];
}

export const PipelineSummary: React.FC<PipelineSummaryProps> = ({ run, moduleStatuses }) => {
  if (!run) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No pipeline has been started yet
      </div>
    );
  }

  const completedModules = moduleStatuses.filter((m) => m.status === 'completed').length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Pipeline Progress</h4>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          run.status === 'completed' ? 'bg-green-100 text-green-700' :
          run.status === 'running' ? 'bg-blue-100 text-blue-700' :
          run.status === 'failed' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {run.status}
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${
          run.status === 'completed' ? 'bg-green-500' :
          run.status === 'failed' ? 'bg-red-500' :
          'bg-blue-500'
        }`} style={{ width: `${run.progress}%` }} />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{completedModules}/{moduleStatuses.length} modules completed</span>
        <span>{run.progress}%</span>
      </div>
    </div>
  );
};
