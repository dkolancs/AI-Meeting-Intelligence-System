import logging

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import TranscriptChunk, WSEvent, WSEventType
from app.services.connection_manager import manager
from app.services.nlp_pipeline import detect_live_signals

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ingest")


@router.post("/chunk")
async def ingest_chunk(chunk: TranscriptChunk, request: Request):
    store = request.app.state.store
    store.append_chunk(chunk)

    await manager.broadcast(
        chunk.session_id,
        WSEvent(event=WSEventType.chunk, data=chunk.model_dump()).model_dump(),
    )

    signals = detect_live_signals(chunk.speaker, chunk.text)

    if "question" in signals:
        await manager.broadcast(
            chunk.session_id,
            WSEvent(event=WSEventType.question, data=signals["question"]).model_dump(),
        )

    if "confusion" in signals:
        await manager.broadcast(
            chunk.session_id,
            WSEvent(event=WSEventType.confusion, data=signals["confusion"]).model_dump(),
        )

    return {"status": "ok", "session_id": chunk.session_id}


@router.post("/end/{session_id}")
async def end_session(session_id: str, request: Request):
    store = request.app.state.store
    session = store.end_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    await manager.broadcast(
        session_id,
        WSEvent(
            event=WSEventType.status,
            data={"session_id": session_id, "status": "ended"},
        ).model_dump(),
    )

    return {
        "status": "ended",
        "session_id": session_id,
        "chunks": len(session.chunks),
    }


@router.get("/session/{session_id}")
async def get_session(session_id: str, request: Request):
    store = request.app.state.store
    session = store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return session


@router.post("/webhook")
async def webhook(request: Request):
    payload = await request.json()
    event_type = payload.get("event")
    logger.info(f"Webhook received: event={event_type}")

    # PRODUCTION: replace this stub with rtms.Client().join(...) using payload fields
    if event_type == "meeting.rtms_started":
        logger.info("RTMS started — swap in real client.join() here")
    elif event_type == "meeting.rtms_stopped":
        logger.info("RTMS stopped")

    return {"status": "received"}
