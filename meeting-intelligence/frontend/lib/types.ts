export interface TranscriptChunk {
  session_id: string;
  speaker: string;
  text: string;
  timestamp: number;
  is_final: boolean;
}

export interface ActionItem {
  text: string;
  owner: string | null;
  due: string | null;
}

export interface Question {
  text: string;
  asked_by: string | null;
  resolved: boolean;
}

export interface ConfusionSignal {
  text: string;
  speaker: string | null;
  signal_type: 'clarification_request' | 'repeated_question' | 'uncertainty';
}

export interface AnalysisResult {
  session_id: string;
  summary: string;
  action_items: ActionItem[];
  questions: Question[];
  confusion_signals: ConfusionSignal[];
  generated_at: number;
}

export type WSEventType = 'chunk' | 'question' | 'confusion' | 'analysis' | 'status';

export interface WSEvent {
  event: WSEventType;
  data: any;
}

export type SessionStatus = 'waiting' | 'active' | 'ended' | 'analyzed';
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
