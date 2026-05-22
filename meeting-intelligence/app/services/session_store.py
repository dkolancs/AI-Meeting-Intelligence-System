import time
from typing import Optional
from app.models.schemas import Session, SessionStatus, TranscriptChunk


class SessionStore:
    def __init__(self):
        self._sessions: dict[str, Session] = {}

    def create(self, session_id: str) -> Session:
        session = Session(session_id=session_id)
        self._sessions[session_id] = session
        return session

    def get(self, session_id: str) -> Optional[Session]:
        return self._sessions.get(session_id)

    def get_or_create(self, session_id: str) -> Session:
        session = self.get(session_id)
        if session is None:
            session = self.create(session_id)
        return session

    def append_chunk(self, chunk: TranscriptChunk) -> Session:
        session = self.get_or_create(chunk.session_id)
        session.chunks.append(chunk)
        return session

    def end_session(self, session_id: str) -> Optional[Session]:
        session = self.get(session_id)
        if session is None:
            return None
        session.status = SessionStatus.ended
        session.ended_at = time.time()
        return session

    def mark_analyzed(self, session_id: str) -> Optional[Session]:
        session = self.get(session_id)
        if session is None:
            return None
        session.status = SessionStatus.analyzed
        return session

    def get_transcript_text(self, session_id: str) -> str:
        session = self.get(session_id)
        if session is None:
            return ""
        return "\n".join(f"{c.speaker}: {c.text}" for c in session.chunks)

    def all_sessions(self) -> list[Session]:
        return list(self._sessions.values())
