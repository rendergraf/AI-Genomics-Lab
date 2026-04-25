'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePipelineStore } from '@/stores/pipelineStore';
import type { PipelineLog } from '@/types/pipeline';

const SSE_RECONNECT_DELAY = 3000;

export function usePipelineLogs(runId?: number) {
  const { addLog, updateModuleStatus } = usePipelineStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!runId) return;

    const es = new EventSource(`/api/pipeline/${runId}/logs/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const log: PipelineLog = JSON.parse(event.data);
        addLog(log);
        if (log.module) {
          const statusMap: Record<string, 'running' | 'completed' | 'failed'> = {
            info: 'running',
            completed: 'completed',
            error: 'failed',
          };
          const status = statusMap[log.level];
          if (status) {
            updateModuleStatus(log.module, status);
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      reconnectTimeoutRef.current = setTimeout(connect, SSE_RECONNECT_DELAY);
    };

    return es;
  }, [runId, addLog, updateModuleStatus]);

  useEffect(() => {
    const es = connect();
    return () => {
      es?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  return { disconnect, reconnect: connect };
}
