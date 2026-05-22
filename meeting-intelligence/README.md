# Meeting Intelligence — Zoom Fellowship Demo

AI-powered real-time meeting intelligence that streams live transcripts, detects confusion and questions on the fly, and generates a structured Claude AI analysis at session end.

---

## Architecture

```
Mock RTMS Simulator (simulator.py)
          │  POST /ingest/chunk × N
          ▼
┌─────────────────────┐
│   FastAPI Backend   │  ──── httpx ────▶  Claude AI (Anthropic)
│   (meeting-         │                         │
│    intelligence/)   │◀──── AnalysisResult ────┘
└─────────┬───────────┘
          │  WebSocket /ws/{session_id}
          ▼
┌─────────────────────┐
│  Next.js Frontend   │
│  Three-panel dash   │
│  (frontend/)        │
└─────────────────────┘
```

---

## Quick Start (Local)

### 1. Backend

```bash
cd meeting-intelligence

# Python 3.11+ required
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Create .env from example
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...

uvicorn app.main:app --reload
# → http://localhost:8000/health should return {"status":"ok"}
```

### 2. Frontend

```bash
cd meeting-intelligence/frontend

cp .env.example .env.local
# No changes needed for local dev (defaults point to localhost:8000)

npm install
npm run dev
# → http://localhost:3000
```

### 3. Run the Simulator

In a third terminal (with the backend running and `.env` set):

```bash
cd meeting-intelligence
python simulator.py --speed 3.0
```

This replays the 38-chunk ASU CS study group transcript and triggers analysis automatically.

---

## Environment Variables

### Backend (`meeting-intelligence/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | — | Anthropic API key for Claude |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated CORS origins |
| `PERSIST_SESSIONS` | No | `false` | Reserved for future DB persistence |
| `PORT` | No | `8000` | Server port (set by Railway automatically) |

### Frontend (`meeting-intelligence/frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | No | `http://localhost:8000` | Backend URL (browser-side fetches) |
| `NEXT_PUBLIC_BACKEND_WS_URL` | No | `ws://localhost:8000` | Backend WebSocket URL |
| `BACKEND_URL` | No | `http://localhost:8000` | Backend URL (server-side API routes) |

---

## Deployment

### Backend → Railway

1. Push `meeting-intelligence/` to a GitHub repo (or deploy the folder directly).
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub.
3. Railway auto-detects `railway.toml` — no configuration needed.
4. Add environment variable: `ANTHROPIC_API_KEY = sk-ant-...`
5. Add `ALLOWED_ORIGINS = https://your-app.vercel.app`
6. Copy the generated Railway URL (e.g. `https://meeting-intelligence.up.railway.app`).

### Frontend → Vercel

> Deploy backend first — you need the Railway URL before setting frontend env vars.

1. Push `meeting-intelligence/frontend/` to GitHub (or use the monorepo root with the `frontend/` subfolder set as root directory).
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo.
3. Set **Root Directory** to `meeting-intelligence/frontend` if using the monorepo.
4. Add environment variables:
   - `NEXT_PUBLIC_BACKEND_URL` = `https://your-app.up.railway.app`
   - `NEXT_PUBLIC_BACKEND_WS_URL` = `wss://your-app.up.railway.app`
   - `BACKEND_URL` = `https://your-app.up.railway.app`
5. Deploy — Vercel picks up `vercel.json` automatically.

---

## How to Demo

1. Open the frontend URL (local: `http://localhost:3000` or your Vercel URL).
2. Click **Start Live Demo →** — a unique session ID is generated and you land on the session page.
3. Watch the **top bar** show connection status (`connected` in green).
4. Click **Start Demo** in the bottom of the left panel.
5. **Left panel (Transcript)** — watch 38 utterances stream in over ~28 seconds, each speaker color-coded.
6. **Center panel (Live Signals)** — questions and confusion phrases appear in real time as Claude pattern-matches the stream. Watch for Jordan's "I'm not sure I follow" and Sam's "I don't understand" moments.
7. **Right panel (Analysis)** — after the transcript ends, a skeleton loader appears while Claude processes the full session (~10–20 seconds). The panel then populates with:
   - A 2–3 sentence meeting summary
   - Action items with owners and due dates
   - Questions split into resolved vs. unresolved
   - Confusion signal counts by type
8. Click **Export PDF** in the top bar to print the analysis.

---

## Production Path (Real Zoom RTMS)

The Zoom Real-Time Media Streams (RTMS) API requires a 4–6 week approval process through Zoom's developer program. The `/ingest/webhook` endpoint is already stubbed and ready: when Zoom sends `meeting.rtms_started`, the backend logs the payload and notes where to swap in the real client. When your RTMS approval comes through, replace the stub body in `app/routers/ingest.py`'s `webhook()` handler with `rtms.Client().join(meeting_id=payload["meeting_id"], ...)` — no other changes to the architecture are needed. The WebSocket broadcast pipeline, Claude analysis, and frontend are all RTMS-agnostic.

---

## Built With

- **FastAPI** — async Python API framework
- **Next.js 14** (App Router) — React frontend with server components
- **Claude AI** (Anthropic) — meeting analysis via `claude-sonnet-4-20250514`
- **Zoom SDK** (RTMS) — real-time media streams (stubbed, pending approval)
- **Tailwind CSS** — utility-first styling
- **Railway** — backend hosting
- **Vercel** — frontend hosting
