#!/usr/bin/env python3
"""
Replay a realistic ASU CS study group transcript to the Meeting Intelligence backend.
"""
import argparse
import asyncio
import json
import time

import httpx

TRANSCRIPT = [
    ("Prof. Martinez", 0,   "Alright everyone, let's get started. Today we're covering transformer attention mechanisms and how they relate to the project."),
    ("Prof. Martinez", 3,   "The key insight is that attention lets the model weigh the importance of different input tokens when producing each output token."),
    ("Jordan",         6,   "Wait, can you clarify what you mean by weighting? I'm not sure I follow how that works mathematically."),
    ("Prof. Martinez", 8,   "Good question. For each token, we compute a query vector and compare it against key vectors from all other tokens. The dot products give us the weights."),
    ("Sam",            11,  "So the attention scores are just dot products? That seems too simple."),
    ("Prof. Martinez", 13,  "Almost — we scale them by the square root of the dimension and then apply softmax to get a probability distribution."),
    ("Jordan",         16,  "I'm still confused about the difference between self-attention and cross-attention. Can you explain that again?"),
    ("Prof. Martinez", 18,  "Self-attention is when the queries, keys, and values all come from the same sequence. Cross-attention is when queries come from one sequence but keys and values come from another."),
    ("Alex",           21,  "That makes sense for the encoder. But in the decoder, aren't there two attention layers?"),
    ("Prof. Martinez", 23,  "Exactly right Alex — the decoder has masked self-attention first, then cross-attention to the encoder output."),
    ("Sam",            26,  "What does masked mean in this context? I don't understand why you'd need masking."),
    ("Prof. Martinez", 28,  "During training we mask future tokens so the model can't cheat by looking ahead. It forces the model to predict each token using only previous context."),
    ("Jordan",         31,  "Okay I think I get it now. So masking is a training constraint, not an architectural one?"),
    ("Prof. Martinez", 33,  "Exactly. Now for the project — Sam, can you take ownership of implementing the multi-head attention module by Friday?"),
    ("Sam",            35,  "Sure, I can have a basic version done by Friday."),
    ("Prof. Martinez", 37,  "Jordan, can you write the positional encoding component and have it ready for review by next Wednesday?"),
    ("Jordan",         39,  "Will do. Should I use sinusoidal encoding or learned embeddings?"),
    ("Prof. Martinez", 41,  "Use sinusoidal for now — we can experiment with learned embeddings later if time allows."),
    ("Alex",           44,  "What about the feed-forward layers? Who's handling those?"),
    ("Prof. Martinez", 46,  "Good catch Alex. Can you take the feed-forward sublayer? It's two linear transformations with a ReLU in between."),
    ("Alex",           48,  "Yeah I can do that. What's the target hidden dimension — 512 or 2048?"),
    ("Prof. Martinez", 50,  "Use 2048 for the inner layer, 512 for the output. Standard base transformer config."),
    ("Sam",            53,  "Quick question — do we need layer normalization before or after the sublayers?"),
    ("Prof. Martinez", 55,  "Post-norm is the original paper but pre-norm is more stable in practice. Let's go with pre-norm."),
    ("Jordan",         58,  "I'm not sure I follow the difference between pre and post norm. Can you explain?"),
    ("Prof. Martinez", 60,  "Pre-norm applies layer norm to the input before the sublayer. Post-norm applies it after adding the residual. Pre-norm trains more stably."),
    ("Alex",           63,  "Got it. So our overall deadline is the demo next Thursday?"),
    ("Prof. Martinez", 65,  "Yes — working demo next Thursday. Let's plan a check-in Tuesday to merge everyone's components."),
    ("Sam",            67,  "Should we set up a shared repo? I can create that today."),
    ("Prof. Martinez", 69,  "Please do — make sure everyone has access before end of day."),
    ("Jordan",         71,  "One last thing — what framework are we using? PyTorch or JAX?"),
    ("Prof. Martinez", 73,  "PyTorch. Everyone should be familiar with it from the coursework."),
    ("Alex",           75,  "Sounds good. I'll start on the feed-forward module this afternoon."),
    ("Prof. Martinez", 77,  "Perfect. Sam creates the repo today, components due by their deadlines, demo Thursday, check-in Tuesday. Any final questions?"),
    ("Jordan",         79,  "What's the expected accuracy target for the demo?"),
    ("Prof. Martinez", 81,  "We're not aiming for SOTA — a clean training curve and working attention visualization will be enough to demonstrate understanding."),
    ("Sam",            83,  "Works for me. I'll send the repo link in the group chat."),
    ("Prof. Martinez", 85,  "Great work everyone. See you Tuesday."),
]


async def run(session_id: str, base_url: str, speed: float):
    async with httpx.AsyncClient(timeout=90.0) as client:
        print(f"\n{'='*60}")
        print(f"Session ID : {session_id}")
        print(f"Backend    : {base_url}")
        print(f"Speed      : {speed}x")
        print(f"Chunks     : {len(TRANSCRIPT)}")
        print(f"{'='*60}\n")

        start = time.time()
        prev_offset = 0.0

        for i, (speaker, offset, text) in enumerate(TRANSCRIPT):
            delay = (offset - prev_offset) / speed
            if delay > 0:
                await asyncio.sleep(delay)
            prev_offset = offset

            chunk = {
                "session_id": session_id,
                "speaker": speaker,
                "text": text,
                "timestamp": time.time(),
                "is_final": True,
            }

            resp = await client.post(f"{base_url}/ingest/chunk", json=chunk)
            resp.raise_for_status()
            elapsed = time.time() - start
            print(f"[{elapsed:6.1f}s] chunk {i+1:02d}/{len(TRANSCRIPT)} | {speaker:<16} | {text[:60]}{'...' if len(text)>60 else ''}")

        print(f"\n{'='*60}")
        print("Ending session...")
        resp = await client.post(f"{base_url}/ingest/end/{session_id}")
        resp.raise_for_status()
        end_data = resp.json()
        print(f"Session ended — {end_data['chunks']} chunks recorded")

        print("\nRequesting Claude analysis (this may take up to 60s)...")
        resp = await client.post(f"{base_url}/analyze/{session_id}", timeout=90.0)
        resp.raise_for_status()
        result = resp.json()

        print(f"\n{'='*60}")
        print("ANALYSIS RESULT")
        print(f"{'='*60}")
        print(f"\nSUMMARY:\n{result['summary']}\n")

        print(f"ACTION ITEMS ({len(result['action_items'])}):")
        for item in result["action_items"]:
            owner = f" [{item['owner']}]" if item.get("owner") else ""
            due = f" — due: {item['due']}" if item.get("due") else ""
            print(f"  • {item['text']}{owner}{due}")

        print(f"\nQUESTIONS ({len(result['questions'])}):")
        for q in result["questions"]:
            status = "✓" if q.get("resolved") else "?"
            asker = f" ({q['asked_by']})" if q.get("asked_by") else ""
            print(f"  [{status}] {q['text']}{asker}")

        print(f"\nCONFUSION SIGNALS ({len(result['confusion_signals'])}):")
        for c in result["confusion_signals"]:
            speaker_tag = f" — {c['speaker']}" if c.get("speaker") else ""
            print(f"  ⚠ [{c['signal_type']}]{speaker_tag}: {c['text'][:80]}")

        print(f"\n{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="Meeting Intelligence Transcript Simulator")
    parser.add_argument("--session", default=f"demo-session-{int(time.time())}", help="Session ID")
    parser.add_argument("--url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--speed", type=float, default=3.0, help="Playback speed multiplier")
    args = parser.parse_args()

    asyncio.run(run(args.session, args.url, args.speed))


if __name__ == "__main__":
    main()
