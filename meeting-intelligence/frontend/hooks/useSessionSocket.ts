'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AnalysisResult,
  ConfusionSignal,
  ConnectionStatus,
  Question,
  SessionStatus,
  TranscriptChunk,
  WSEvent,
} from '@/lib/types';

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;

export function useSessionSocket(sessionId: string) {
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [confusionSignals, setConfusionSignals] = useState<ConfusionSignal[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('waiting');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const wsBase =
      process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:8000';
    const url = `${wsBase}/ws/${sessionId}`;

    setConnectionStatus(
      reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting'
    );

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      reconnectAttemptsRef.current = 0;
      setConnectionStatus('connected');
      setSessionStatus((s) => (s === 'waiting' ? 'active' : s));
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const msg: WSEvent = JSON.parse(event.data as string);
        switch (msg.event) {
          case 'chunk':
            setChunks((prev) => [...prev, msg.data as TranscriptChunk]);
            setSessionStatus('active');
            break;
          case 'question':
            setQuestions((prev) => [...prev, msg.data as Question]);
            break;
          case 'confusion':
            setConfusionSignals((prev) => [...prev, msg.data as ConfusionSignal]);
            break;
          case 'analysis':
            setAnalysis(msg.data as AnalysisResult);
            setSessionStatus('analyzed');
            break;
          case 'status':
            if (msg.data?.status === 'ended') {
              setSessionStatus('ended');
            }
            break;
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnectionStatus('disconnected');
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const clearSession = useCallback(() => {
    setChunks([]);
    setQuestions([]);
    setConfusionSignals([]);
    setAnalysis(null);
    setSessionStatus('waiting');
  }, []);

  return {
    chunks,
    questions,
    confusionSignals,
    analysis,
    sessionStatus,
    connectionStatus,
    clearSession,
  };
}
