'use client';

import React, { useEffect } from 'react';
import { useCaseWizardStore } from '@/stores/caseWizardStore';
import { usePipelineStore } from '@/stores/pipelineStore';
import { usePipelineLogs } from '@/hooks/usePipelineLogs';

export const Step8ExecutionDashboard: React.FC = () => {
  const { pipelineRun } = useCaseWizardStore();
  const { moduleStatuses, logs, startPipeline } = usePipelineStore();

  usePipelineLogs(pipelineRun?.id);

  useEffect(() => {
    if (!pipelineRun) {
      startPipeline(0, []);
    }
  }, []);

  if (!pipelineRun && moduleStatuses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-gray-500">Initializing pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Pipeline Execution</h3>
        <p className="text-sm text-gray-500 mt-1">
          Real-time monitoring of pipeline execution.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {moduleStatuses.map((mod) => (
          <div key={mod.module} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">{mod.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                mod.status === 'completed' ? 'bg-green-100 text-green-700' :
                mod.status === 'running' ? 'bg-blue-100 text-blue-700' :
                mod.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {mod.status}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${
                mod.status === 'completed' ? 'bg-green-500' :
                mod.status === 'running' ? 'bg-blue-500' :
                mod.status === 'failed' ? 'bg-red-500' :
                'bg-gray-300'
              }`} style={{ width: `${mod.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Execution Logs</span>
        </div>
        <div className="p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
          {logs.length === 0 ? (
            <p className="text-gray-400">Waiting for logs...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`${
                log.level === 'error' ? 'text-red-600' :
                log.level === 'warn' ? 'text-yellow-600' :
                log.level === 'info' ? 'text-gray-700' :
                'text-gray-400'
              }`}>
                <span className="text-gray-400">[{log.timestamp}]</span>{' '}
                <span className="font-semibold uppercase">[{log.module}]</span>{' '}
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
