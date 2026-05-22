'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { LiveSignalsPanel } from '@/components/LiveSignalsPanel';
import { StatusBar } from '@/components/StatusBar';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { useSessionSocket } from '@/hooks/useSessionSocket';

interface PageProps {
  params: { id: string };
}

export default function SessionPage({ params }: PageProps) {
  const sessionId = params.id;
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const startedAtRef = useRef(Date.now() / 1000);

  const {
    chunks,
    questions,
    confusionSignals,
    analysis,
    sessionStatus,
    connectionStatus,
  } = useSessionSocket(sessionId);

  const handleStartDemo = useCallback(async () => {
    setIsRunning(true);
    startedAtRef.current = Date.now() / 1000;
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error(`Simulate failed: ${res.status}`);
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
    setIsRunning(false);
  }, [sessionId]);

  const handleStopDemo = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
      await fetch(`${backendUrl}/ingest/end/${sessionId}`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    router.push('/');
  }, [sessionId, router]);

  const handleNewSession = useCallback(() => {
    router.push('/');
  }, [router]);

  // Stop the "running" spinner once analysis completes or session ends
  const effectiveRunning = isRunning && sessionStatus !== 'analyzed' && sessionStatus !== 'ended';

  return (
    <div className="h-screen flex flex-col bg-bg-base overflow-hidden">
      <StatusBar
        sessionId={sessionId}
        sessionStatus={sessionStatus}
        connectionStatus={connectionStatus}
        startedAt={startedAtRef.current}
        onNewSession={handleNewSession}
        onStopDemo={sessionStatus === 'active' ? handleStopDemo : undefined}
      />

      <div className="flex-1 grid grid-cols-[2fr_1.5fr_1.5fr] min-h-0">
        <TranscriptPanel
          chunks={chunks}
          onStartDemo={handleStartDemo}
          isRunning={effectiveRunning}
        />
        <LiveSignalsPanel
          questions={questions}
          confusionSignals={confusionSignals}
        />
        <AnalysisPanel
          analysis={analysis}
          isLoading={sessionStatus === 'ended' && !analysis}
        />
      </div>
    </div>
  );
}
