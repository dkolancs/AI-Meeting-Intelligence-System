'use client';

import { useEffect, useState } from 'react';
import type { ConnectionStatus, SessionStatus } from '@/lib/types';

interface StatusBarProps {
  sessionId: string;
  sessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  startedAt: number;
  onNewSession: () => void;
  onStopDemo?: () => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const STATUS_STYLES: Record<SessionStatus, string> = {
  waiting: 'bg-text-muted/20 text-text-secondary',
  active: 'bg-accent-blue/20 text-accent-blue',
  ended: 'bg-text-secondary/20 text-text-secondary',
  analyzed: 'bg-emerald-500/20 text-emerald-400',
};

const CONN_DOT: Record<ConnectionStatus, string> = {
  connecting: 'bg-yellow-400 animate-pulse-soft',
  connected: 'bg-emerald-400',
  reconnecting: 'bg-orange-400 animate-pulse-soft',
  disconnected: 'bg-red-500',
};

export function StatusBar({
  sessionId,
  sessionStatus,
  connectionStatus,
  startedAt,
  onNewSession,
  onStopDemo,
}: StatusBarProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (sessionStatus !== 'active') return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt * 1000) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [sessionStatus, startedAt]);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border-dim bg-bg-surface shrink-0">
      <span className="font-bold text-text-primary tracking-tight">
        ⚡ Meeting Intelligence
      </span>

      <div className="flex items-center gap-3 text-sm">
        <span className="font-mono text-text-muted truncate max-w-[180px]" title={sessionId}>
          {sessionId}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[sessionStatus]}`}>
          {sessionStatus}
        </span>
        {sessionStatus === 'active' && (
          <span className="font-mono text-text-secondary text-xs">
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary mr-2">
          <span className={`w-2 h-2 rounded-full ${CONN_DOT[connectionStatus]}`} />
          {connectionStatus}
        </div>
        {onStopDemo && (
          <button
            onClick={onStopDemo}
            className="px-3 py-1 text-xs rounded border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Stop Demo
          </button>
        )}
        <button
          onClick={onNewSession}
          className="px-3 py-1 text-xs rounded border border-border-bright text-text-secondary hover:text-text-primary hover:border-border-bright/80 transition-colors"
        >
          New Session
        </button>
        <button
          onClick={() => window.print()}
          className="px-3 py-1 text-xs rounded border border-border-bright text-text-secondary hover:text-text-primary hover:border-border-bright/80 transition-colors"
        >
          Export PDF
        </button>
      </div>
    </header>
  );
}
