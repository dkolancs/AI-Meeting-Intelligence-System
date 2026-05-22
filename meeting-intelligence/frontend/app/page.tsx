'use client';

import { useRouter } from 'next/navigation';

const FEATURES = [
  {
    icon: '📝',
    title: 'Live Transcript',
    description:
      'Streams real-time transcript chunks from Zoom RTMS — each speaker utterance appears instantly as the meeting progresses.',
  },
  {
    icon: '🔍',
    title: 'Signals Detection',
    description:
      'Pattern-matches confusion phrases and question marks in real time, surfacing moments where students need help before they disengage.',
  },
  {
    icon: '🧠',
    title: 'AI Analysis',
    description:
      'Claude synthesizes the full session into a structured report: summary, action items, unresolved questions, and a confusion heat-map.',
  },
];

export default function LandingPage() {
  const router = useRouter();

  const startDemo = () => {
    const sessionId = `demo-${crypto.randomUUID().slice(0, 8)}`;
    router.push(`/session/${sessionId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border-dim">
        <span className="font-bold text-text-primary text-lg tracking-tight">
          ⚡ Meeting Intelligence
        </span>
        <span className="text-xs px-3 py-1 rounded-full border border-border-bright text-text-secondary font-medium">
          ASU × Zoom
        </span>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-16">
        <p className="text-xs font-semibold tracking-widest text-accent-blue uppercase mb-4">
          Zoom SDK + Claude AI
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight mb-4 max-w-2xl">
          AI-Powered Meeting Intelligence
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mb-10 leading-relaxed">
          Real-time question detection, confusion signals, and post-session analysis for
          educational meetings.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <button
            onClick={startDemo}
            className="px-6 py-3 rounded-lg bg-accent-blue text-white font-semibold text-sm
              hover:bg-accent-blue/90 transition-all shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/30"
          >
            Start Live Demo →
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg border border-border-bright text-text-secondary text-sm font-medium
              hover:text-text-primary hover:border-text-muted transition-colors"
          >
            View on GitHub
          </a>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-bg-surface border border-border-dim rounded-xl p-6 text-left
                hover:border-border-bright hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-text-primary mb-2 text-sm">{f.title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-text-muted text-xs border-t border-border-dim">
        Built for ASU Next Lab Zoom Fellowship 2026
      </footer>
    </div>
  );
}
