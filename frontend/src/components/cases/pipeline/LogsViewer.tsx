'use client';

import React, { useRef, useEffect } from 'react';
import type { PipelineLog } from '@/types/pipeline';

interface LogsViewerProps {
  logs: PipelineLog[];
}

const LEVEL_COLORS: Record<string, string> = {
  error: 'text-red-600',
  warn: 'text-yellow-600',
  info: 'text-gray-700',
  debug: 'text-gray-400',
};

export const LogsViewer: React.FC<LogsViewerProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Logs</span>
      </div>
      <div ref={containerRef} className="p-4 max-h-80 overflow-y-auto font-mono text-xs space-y-1 bg-gray-950">
        {logs.length === 0 ? (
          <p className="text-gray-500">Waiting for logs...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={LEVEL_COLORS[log.level] || 'text-gray-400'}>
              <span className="text-gray-500">[{log.timestamp}]</span>{' '}
              <span className="font-semibold uppercase">[{log.module}]</span>{' '}
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
