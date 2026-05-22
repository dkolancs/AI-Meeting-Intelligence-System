import json
import logging
import os
import re

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.models.schemas import ActionItem, AnalysisResult, ConfusionSignal, Question

logger = logging.getLogger(__name__)

_CONFUSION_PATTERNS = [
    "i don't understand",
    "can you clarify",
    "what do you mean",
    "i'm confused",
    "could you explain",
    "not sure i follow",
    "say that again",
    "what does that mean",
    "i'm lost",
    "can you repeat",
    "could you repeat",
    "i'm not following",
]


def detect_live_signals(speaker: str, text: str) -> dict:
    result: dict = {}
    lower = text.lower()

    for pattern in _CONFUSION_PATTERNS:
        if pattern in lower:
            result["confusion"] = {
                "text": text,
                "speaker": speaker,
                "signal_type": "clarification_request",
            }
            break

    if text.strip().endswith("?"):
        result["question"] = {
            "text": text,
            "asked_by": speaker,
            "resolved": False,
        }

    return result


_ANALYSIS_PROMPT = """\
Analyze this educational meeting transcript and return a JSON object with exactly this structure:
{{
  "summary": "2-3 sentence summary of the meeting",
  "action_items": [{{"text": "...", "owner": "speaker name or null", "due": "timeframe or null"}}],
  "questions": [{{"text": "...", "asked_by": "speaker name or null", "resolved": true or false}}],
  "confusion_signals": [{{"text": "exact phrase", "speaker": "name or null", "signal_type": "clarification_request|repeated_question|uncertainty"}}]
}}

Rules:
- action_items: concrete tasks someone committed to
- questions: genuine questions, mark resolved:true if answered in the transcript
- confusion_signals: moments of explicit confusion, uncertainty, or repeated questions
- Focus on educational outcomes and learning gaps

Transcript:
{transcript}"""


@retry(
    retry=retry_if_exception_type(httpx.HTTPError),
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=1, max=10),
)
async def _call_claude(transcript: str) -> str:
    api_key = os.environ["ANTHROPIC_API_KEY"]
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5",
                "max_tokens": 2000,
                "system": "You are an AI meeting intelligence system. Return only valid JSON, no markdown, no explanation.",
                "messages": [
                    {
                        "role": "user",
                        "content": _ANALYSIS_PROMPT.format(transcript=transcript),
                    }
                ],
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["content"][0]["text"]


async def analyze_transcript(session_id: str, transcript: str) -> AnalysisResult:
    try:
        raw = await _call_claude(transcript)
        # Strip ```json fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw)
        payload = json.loads(raw)

        return AnalysisResult(
            session_id=session_id,
            summary=payload.get("summary", ""),
            action_items=[ActionItem(**a) for a in payload.get("action_items", [])],
            questions=[Question(**q) for q in payload.get("questions", [])],
            confusion_signals=[ConfusionSignal(**c) for c in payload.get("confusion_signals", [])],
        )
    except Exception as exc:
        logger.error(f"Claude API call failed: {type(exc).__name__}: {exc}")
        return AnalysisResult(
            session_id=session_id,
            summary=f"Analysis failed: {type(exc).__name__} — check Railway logs",
            action_items=[],
            questions=[],
            confusion_signals=[],
        )
