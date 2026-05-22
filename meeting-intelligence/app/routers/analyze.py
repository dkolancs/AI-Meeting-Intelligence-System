import logging
import traceback

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import SessionStatus, WSEvent, WSEventType
from app.services.connection_manager import manager
from app.services.nlp_pipeline import analyze_transcript

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze")


@router.post("/{session_id}")
async def run_analysis(session_id: str, request: Request):
    store = request.app.state.store
    session = store.get(session_id)

    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    if session.status == SessionStatus.active:
        raise HTTPException(
            status_code=400,
            detail=f"Call /ingest/end/{session_id} first",
        )

    transcript = store.get_transcript_text(session_id)
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty")

    logger.info(f"Starting Claude analysis for session {session_id}")
    try:
        result = await analyze_transcript(session_id, transcript)
    except Exception as exc:
        logger.error(f"analyze_transcript raised: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(exc))

    store.mark_analyzed(session_id)

    await manager.broadcast(
        session_id,
        WSEvent(event=WSEventType.analysis, data=result.model_dump()).model_dump(),
    )

    return result


@router.get("/{session_id}")
async def get_analysis_status(session_id: str, request: Request):
    store = request.app.state.store
    session = store.get(session_id)

    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    return {
        "session_id": session_id,
        "status": session.status,
        "chunk_count": len(session.chunks),
    }
