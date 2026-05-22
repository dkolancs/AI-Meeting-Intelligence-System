'use client';

import type { AnalysisResult } from '@/lib/types';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  isLoading: boolean;
}

const OWNER_COLORS = ['text-speaker-1', 'text-speaker-2', 'text-speaker-3', 'text-speaker-4', 'text-speaker-5'];
const ownerColorMap = new Map<string, string>();
let ownerColorIdx = 0;

function ownerColor(owner: string): string {
  if (!ownerColorMap.has(owner)) {
    ownerColorMap.set(owner, OWNER_COLORS[ownerColorIdx % OWNER_COLORS.length]);
    ownerColorIdx++;
  }
  return ownerColorMap.get(owner)!;
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 bg-bg-elevated rounded w-1/3" />
          <div className="h-3 bg-bg-elevated rounded w-full" />
          <div className="h-3 bg-bg-elevated rounded w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function AnalysisPanel({ analysis, isLoading }: AnalysisPanelProps) {
  const resolved = analysis?.questions.filter((q) => q.resolved) ?? [];
  const unresolved = analysis?.questions.filter((q) => !q.resolved) ?? [];

  const signalsByType = analysis?.confusion_signals.reduce<Record<string, number>>((acc, c) => {
    acc[c.signal_type] = (acc[c.signal_type] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-dim shrink-0">
        <h2 className="text-sm font-semibold text-text-primary">Session Analysis</h2>
        {analysis && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 font-medium">
            Complete
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {isLoading && !analysis && <Skeleton />}

        {!isLoading && !analysis && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <div className="text-4xl opacity-30">🧠</div>
            <p className="text-text-muted text-sm max-w-[200px]">
              Analysis will appear when the meeting ends
            </p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Summary */}
            <section>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Summary
              </h3>
              <p className="text-sm text-text-primary leading-relaxed">{analysis.summary}</p>
            </section>

            {/* Action items */}
            {analysis.action_items.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Action Items ({analysis.action_items.length})
                </h3>
                <ul className="space-y-2">
                  {analysis.action_items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-accent-blue mt-0.5 shrink-0">•</span>
                      <div>
                        <span className="text-text-primary">{item.text}</span>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          {item.owner && (
                            <span className={`text-xs font-medium ${ownerColor(item.owner)}`}>
                              {item.owner}
                            </span>
                          )}
                          {item.due && (
                            <span className="text-xs text-text-muted">due: {item.due}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Questions */}
            {analysis.questions.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Questions
                </h3>
                <div className="space-y-1.5">
                  {resolved.map((q, i) => (
                    <div key={`r-${i}`} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-400 mt-0.5 shrink-0 text-xs">✓</span>
                      <span className="text-text-secondary line-through opacity-60">{q.text}</span>
                    </div>
                  ))}
                  {unresolved.map((q, i) => (
                    <div key={`u-${i}`} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-400 mt-0.5 shrink-0 text-xs">○</span>
                      <span className="text-text-primary">{q.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Confusion report */}
            {analysis.confusion_signals.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Confusion Report ({analysis.confusion_signals.length} signals)
                </h3>
                <div className="space-y-1">
                  {Object.entries(signalsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-accent-gold text-xs px-2 py-0.5 rounded bg-accent-gold/10">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  {analysis.confusion_signals.map((c, i) => (
                    <div key={i} className="text-xs text-text-muted border-l border-accent-gold/30 pl-2">
                      {c.speaker && <span className="text-accent-gold/80">{c.speaker}: </span>}
                      {c.text.length > 80 ? `${c.text.slice(0, 80)}…` : c.text}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
