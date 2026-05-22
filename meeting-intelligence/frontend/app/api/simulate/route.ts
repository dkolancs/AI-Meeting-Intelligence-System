import { NextRequest, NextResponse } from 'next/server';

// Allow this serverless function up to 60 seconds on Vercel
export const maxDuration = 60;

const TRANSCRIPT: [string, number, string][] = [
  ['Prof. Martinez', 0,  'Alright everyone, let\'s get started. Today we\'re covering transformer attention mechanisms and how they relate to the project.'],
  ['Prof. Martinez', 3,  'The key insight is that attention lets the model weigh the importance of different input tokens when producing each output token.'],
  ['Jordan',         6,  "Wait, can you clarify what you mean by weighting? I'm not sure I follow how that works mathematically."],
  ['Prof. Martinez', 8,  'Good question. For each token, we compute a query vector and compare it against key vectors from all other tokens. The dot products give us the weights.'],
  ['Sam',            11, 'So the attention scores are just dot products? That seems too simple.'],
  ['Prof. Martinez', 13, 'Almost — we scale them by the square root of the dimension and then apply softmax to get a probability distribution.'],
  ['Jordan',         16, "I'm still confused about the difference between self-attention and cross-attention. Can you explain that again?"],
  ['Prof. Martinez', 18, 'Self-attention is when the queries, keys, and values all come from the same sequence. Cross-attention is when queries come from one sequence but keys and values come from another.'],
  ['Alex',           21, "That makes sense for the encoder. But in the decoder, aren't there two attention layers?"],
  ['Prof. Martinez', 23, 'Exactly right Alex — the decoder has masked self-attention first, then cross-attention to the encoder output.'],
  ['Sam',            26, "What does masked mean in this context? I don't understand why you'd need masking."],
  ['Prof. Martinez', 28, "During training we mask future tokens so the model can't cheat by looking ahead. It forces the model to predict each token using only previous context."],
  ['Jordan',         31, 'Okay I think I get it now. So masking is a training constraint, not an architectural one?'],
  ['Prof. Martinez', 33, 'Exactly. Now for the project — Sam, can you take ownership of implementing the multi-head attention module by Friday?'],
  ['Sam',            35, 'Sure, I can have a basic version done by Friday.'],
  ['Prof. Martinez', 37, 'Jordan, can you write the positional encoding component and have it ready for review by next Wednesday?'],
  ['Jordan',         39, 'Will do. Should I use sinusoidal encoding or learned embeddings?'],
  ['Prof. Martinez', 41, 'Use sinusoidal for now — we can experiment with learned embeddings later if time allows.'],
  ['Alex',           44, "What about the feed-forward layers? Who's handling those?"],
  ['Prof. Martinez', 46, "Good catch Alex. Can you take the feed-forward sublayer? It's two linear transformations with a ReLU in between."],
  ['Alex',           48, "Yeah I can do that. What's the target hidden dimension — 512 or 2048?"],
  ['Prof. Martinez', 50, 'Use 2048 for the inner layer, 512 for the output. Standard base transformer config.'],
  ['Sam',            53, 'Quick question — do we need layer normalization before or after the sublayers?'],
  ['Prof. Martinez', 55, "Post-norm is the original paper but pre-norm is more stable in practice. Let's go with pre-norm."],
  ['Jordan',         58, "I'm not sure I follow the difference between pre and post norm. Can you explain?"],
  ['Prof. Martinez', 60, 'Pre-norm applies layer norm to the input before the sublayer. Post-norm applies it after adding the residual. Pre-norm trains more stably.'],
  ['Alex',           63, 'Got it. So our overall deadline is the demo next Thursday?'],
  ['Prof. Martinez', 65, "Yes — working demo next Thursday. Let's plan a check-in Tuesday to merge everyone's components."],
  ['Sam',            67, 'Should we set up a shared repo? I can create that today.'],
  ['Prof. Martinez', 69, 'Please do — make sure everyone has access before end of day.'],
  ['Jordan',         71, 'One last thing — what framework are we using? PyTorch or JAX?'],
  ['Prof. Martinez', 73, 'PyTorch. Everyone should be familiar with it from the coursework.'],
  ['Alex',           75, "Sounds good. I'll start on the feed-forward module this afternoon."],
  ['Prof. Martinez', 77, "Perfect. Sam creates the repo today, components due by their deadlines, demo Thursday, check-in Tuesday. Any final questions?"],
  ['Jordan',         79, "What's the expected accuracy target for the demo?"],
  ['Prof. Martinez', 81, "We're not aiming for SOTA — a clean training curve and working attention visualization will be enough to demonstrate understanding."],
  ['Sam',            83, "Works for me. I'll send the repo link in the group chat."],
  ['Prof. Martinez', 85, 'Great work everyone. See you Tuesday.'],
];

const SPEED = 3.0;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const { sessionId } = (await req.json()) as { sessionId: string };
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000';

  let prevOffset = 0;
  for (const [speaker, offset, text] of TRANSCRIPT) {
    const delay = ((offset - prevOffset) / SPEED) * 1000;
    if (delay > 0) await sleep(delay);
    prevOffset = offset;

    await fetch(`${backendUrl}/ingest/chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        speaker,
        text,
        timestamp: Date.now() / 1000,
        is_final: true,
      }),
    });
  }

  await fetch(`${backendUrl}/ingest/end/${sessionId}`, { method: 'POST' });

  await fetch(`${backendUrl}/analyze/${sessionId}`, {
    method: 'POST',
    signal: AbortSignal.timeout(55_000),
  });

  return NextResponse.json({ status: 'done', sessionId });
}
