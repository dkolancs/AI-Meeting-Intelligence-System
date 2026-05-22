import time
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class SessionStatus(str, Enum):
    active = "active"
    ended = "ended"
    analyzed = "analyzed"


class TranscriptChunk(BaseModel):
    session_id: str
    speaker: str
    text: str
    timestamp: float = Field(default_factory=time.time)
    is_final: bool = True


class ActionItem(BaseModel):
    text: str
    owner: Optional[str] = None
    due: Optional[str] = None


class Question(BaseModel):
    text: str
    asked_by: Optional[str] = None
    resolved: bool = False


class ConfusionSignal(BaseModel):
    text: str
    speaker: Optional[str] = None
    signal_type: str  # "clarification_request" | "repeated_question" | "uncertainty"


class Session(BaseModel):
    session_id: str
    status: SessionStatus = SessionStatus.active
    chunks: list[TranscriptChunk] = []
    started_at: float = Field(default_factory=time.time)
    ended_at: Optional[float] = None


class AnalysisResult(BaseModel):
    session_id: str
    summary: str
    action_items: list[ActionItem] = []
    questions: list[Question] = []
    confusion_signals: list[ConfusionSignal] = []
    generated_at: float = Field(default_factory=time.time)


class WSEventType(str, Enum):
    chunk = "chunk"
    question = "question"
    confusion = "confusion"
    analysis = "analysis"
    status = "status"


class WSEvent(BaseModel):
    event: WSEventType
    data: dict
