'use client';

import type { ConfusionSignal, Question } from '@/lib/types';

interface LiveSignalsPanelProps {
  questions: Question[];
  confusionSignals: ConfusionSignal[];
}

const SIGNAL_TYPE_LABEL: Record<string, string> = {
  clarification_request: 'Clarification',
  repeated_question: 'Repeated',
  uncertainty: 'Uncertainty',
};

export function LiveSignalsPanel({ questions, confusionSignals }: LiveSignalsPanelProps) {
  return (
    <div className="flex flex-col h-full border-r border-border-dim">
      {/* Questions section */}
      <div className="flex-1 flex flex-col min-h-0 border-b border-border-dim">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-dim shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">Questions Detected</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-accent-blue/10 text-accent-blue">
            {questions.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {questions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-muted text-xs text-center">
              Questions will appear here during the meeting
            </div>
          ) : (
            questions.map((q, i) => (
              <div
                key={i}
                className="animate-fade-in-up border-l-2 border-accent-blue pl-3 py-1"
              >
                {q.asked_by && (
                  <span className="text-xs text-accent-blue font-medium">{q.asked_by}</span>
                )}
                <p className="text-sm text-text-primary mt-0.5 leading-snug">{q.text}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confusion signals section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-dim shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">Confusion Signals</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-accent-gold/10 text-accent-gold">
            {confusionSignals.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {confusionSignals.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-muted text-xs text-center">
              Confusion signals will appear here
            </div>
          ) : (
            confusionSignals.map((c, i) => (
              <div
                key={i}
                className="animate-fade-in-up border-l-2 border-accent-gold pl-3 py-1"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-accent-gold text-xs">⚠</span>
                  {c.speaker && (
                    <span className="text-xs text-accent-gold font-medium">{c.speaker}</span>
                  )}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-accent-gold/10 text-accent-gold">
                    {SIGNAL_TYPE_LABEL[c.signal_type] ?? c.signal_type}
                  </span>
                </div>
                <p className="text-sm text-text-primary leading-snug">{c.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
