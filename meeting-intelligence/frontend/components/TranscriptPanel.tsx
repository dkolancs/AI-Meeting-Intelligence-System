'use client';

import { useEffect, useRef } from 'react';
import type { TranscriptChunk } from '@/lib/types';

interface TranscriptPanelProps {
  chunks: TranscriptChunk[];
  onStartDemo: () => void;
  isRunning: boolean;
}

const SPEAKER_COLORS = [
  'bg-speaker-1/20 text-speaker-1 border-speaker-1/30',
  'bg-speaker-2/20 text-speaker-2 border-speaker-2/30',
  'bg-speaker-3/20 text-speaker-3 border-speaker-3/30',
  'bg-speaker-4/20 text-speaker-4 border-speaker-4/30',
  'bg-speaker-5/20 text-speaker-5 border-speaker-5/30',
];

function useSpeakerColors() {
  const map = useRef<Map<string, string>>(new Map());
  const nextIndex = useRef(0);

  return (speaker: string): string => {
    if (!map.current.has(speaker)) {
      map.current.set(
        speaker,
        SPEAKER_COLORS[nextIndex.current % SPEAKER_COLORS.length]
      );
      nextIndex.current += 1;
    }
    return map.current.get(speaker)!;
  };
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function TranscriptPanel({ chunks, onStartDemo, isRunning }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const getSpeakerColor = useSpeakerColors();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chunks]);

  return (
    <div className="flex flex-col h-full border-r border-border-dim">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-dim shrink-0">
        <h2 className="text-sm font-semibold text-text-primary">Live Transcript</h2>
        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-bg-elevated text-text-secondary">
          {chunks.length} chunks
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {chunks.length === 0 && (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">
            Transcript will stream here during the meeting
          </div>
        )}
        {chunks.map((chunk, i) => (
          <div
            key={`${chunk.session_id}-${i}`}
            className="animate-fade-in-up"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded border text-xs font-medium ${getSpeakerColor(chunk.speaker)}`}
              >
                {chunk.speaker}
              </span>
              <span className="text-text-muted text-xs font-mono">
                {formatTime(chunk.timestamp)}
              </span>
            </div>
            <p className="font-mono text-sm text-text-primary leading-relaxed pl-1">
              {chunk.text}
            </p>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border-dim shrink-0">
        <button
          onClick={onStartDemo}
          disabled={isRunning}
          className="w-full py-2 rounded text-sm font-semibold transition-all
            bg-accent-blue text-white hover:bg-accent-blue/90
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Streaming…' : 'Start Demo'}
        </button>
      </div>
    </div>
  );
}
