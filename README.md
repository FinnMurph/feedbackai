# ✦ FeedbackAI

**An AI-powered assignment feedback assistant that guides student thinking through Socratic questioning — without writing content for them.**

FeedbackAI provides rubric-aligned, formative feedback for university writing courses while maintaining academic integrity through built-in guardrails and instructor oversight.

NOTE: Allow 30-60s for cold start

**[feedbackai-virid.vercel.app](https://feedbackai-virid.vercel.app/)**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)
![Claude API](https://img.shields.io/badge/Claude_API-Sonnet_4.6-6366F1?logo=anthropic&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## The Problem

Instructors in writing-intensive courses lack time to provide formative feedback on student drafts — average time-to-first-feedback exceeds 72 hours. Students want guidance during the writing process, but existing AI tools risk academic integrity violations by generating content rather than guiding thinking.

## The Solution

FeedbackAI is a web application where an AI assistant helps students improve their writing by asking Socratic questions tied to rubric criteria. It **never writes content** for students. Every suggestion is tagged with the specific grading criterion it addresses (Organization, Clarity, Evidence, or Critical Thinking), creating transparency and preventing generic feedback. Responses stream in real time using the Claude API's streaming endpoint.

---

## Features

### Student View
- **Three-column layout** — Assignments, document editor, and AI chat side by side
- **Streaming responses** — AI text appears progressively, not all at once
- **Inline highlights** — Clickable passages trigger rubric-specific feedback
- **Socratic chat** — AI asks guiding questions, never generates answers
- **Rubric modal** — On-demand view of all criteria with descriptions and weights
- **Context-aware suggestion chips** — Adapt based on last conversation topic

### Instructor Dashboard
- **Real-time analytics** — Active students, conversation volume, rubric engagement
- **Conversation log** — Log with rubric tags and flag status
- **Resolve workflow** — One-click resolution for integrity flags

### Integrity Guardrails
- **Automatic detection** of content-generation requests
- **Polite refusal + Socratic redirect** — Never just says "no"
- **Instructor flagging** — Violations logged for review
- **System prompt enforcement** — Architectural-level constraints

### Settings Panel
- **Toggle feedback types** per rubric area — actually affects AI responses
- **Configure guardrails** — Block answers, log conversations, flag excessive usage
- **System prompt preview** — Full transparency into AI instructions

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Sidebar   │  │ Document     │  │ Chat Panel    │  │
│  │           │  │ Editor       │  │ (Socratic AI) │  │
│  └──────────┘  └──────────────┘  └───────┬───────┘  │
│                                          │           │
└──────────────────────────────────────────┼───────────┘
                                           │ /api/chat/stream (SSE)
                                           ▼
┌─────────────────────────────────────────────────────┐
│                   Server (Flask)                      │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Chat Engine │  │ Feedback     │  │ Settings &   │ │
│  │ + Streaming│  │ Engine       │  │ Logs (in-    │ │
│  │   + Prompt │  │ (highlights) │  │  memory)     │ │
│  └──────┬─────┘  └──────────────┘  └──────────────┘ │
│         │                                            │
└─────────┼────────────────────────────────────────────┘
          │
          ▼
┌──────────────────┐
│  Claude API      │
│  (Sonnet 4.6)    │
│  or Demo Mode    │
└──────────────────┘
```

**Demo mode**: Runs without an API key using curated Socratic responses that simulate the live streaming behavior (words appear progressively). Set `ANTHROPIC_API_KEY` for real Claude integration.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 19 + Vite | Fast dev server, modern hooks, HMR |
| **Styling** | Custom CSS with design tokens | Consistent spacing, typography, colors via CSS variables |
| **Icons** | Lucide React | Clean, tree-shakeable icon set |
| **Backend** | Flask + Flask-CORS | Lightweight Python API, matches AI/ML ecosystem |
| **AI** | Anthropic Claude API | Sonnet 4.6 with system prompt engineering + streaming |
| **Guardrails** | System prompt + keyword detection | Two-layer integrity enforcement |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/feedbackai.git
cd feedbackai

# Install the one-command startup tool
npm install
```

### 2. Set up the Python environment

```bash
cd server
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3. (Optional) Add your API key for live Claude responses

```bash
cp .env.example server/.env
# Edit server/.env and add: ANTHROPIC_API_KEY=sk-ant-...
```

Without an API key the app runs in **Demo mode** — curated Socratic responses stream in progressively, identical to the live experience.

### 4. Start both servers with one command

```bash
npm run dev
```

This starts:
- Flask API on `http://localhost:5001`
- Vite dev server on `http://localhost:5173`

Open `http://localhost:5173` — the `◐ Demo` or `● Live` badge in the header confirms which mode is active.

> **Manual startup** (if you prefer separate terminals):
> ```bash
> # Terminal 1
> cd server && source venv/bin/activate && python app.py
> # Terminal 2
> cd client && npm install && npm run dev
> ```

---

## Live Demo

> **Note:** The backend runs on Render's free tier, which spins down after 15 minutes of inactivity. The first request after a period of inactivity may take ~30 seconds — subsequent requests are instant.

---

## Deploying Your Own Instance

The app deploys free on **Render** (backend) + **Vercel** (frontend). A `render.yaml` is included at the repo root.

### 1. Deploy the backend on Render
1. Go to [render.com](https://render.com) → New → Web Service → connect this repo
2. Render auto-detects `render.yaml` — confirm the settings
3. Add environment variables in the Render dashboard:
   - `ANTHROPIC_API_KEY` — optional; omit for demo mode
   - `FRONTEND_URL` — set after step 2 (e.g. `https://feedbackai.vercel.app`)
4. Note your Render URL (e.g. `https://feedbackai-api.onrender.com`)

### 2. Deploy the frontend on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → import this repo
2. Set **Root Directory** to `client`
3. Add environment variable: `VITE_API_URL=https://feedbackai-api.onrender.com`
4. Deploy — note your Vercel URL

### 3. Wire them together
Back in Render, set `FRONTEND_URL` to your Vercel URL and redeploy. This enables CORS for your production frontend.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/mode` | Check demo vs. live mode |
| `POST` | `/api/chat/stream` | Send message, receive SSE token stream |
| `GET` | `/api/highlights` | Essay paragraphs with highlight data |
| `GET` | `/api/rubric` | Rubric criteria definitions |
| `GET` | `/api/settings` | Current settings |
| `PUT` | `/api/settings` | Update feedback types / guardrails |
| `GET` | `/api/logs` | Conversation logs + stats |
| `POST` | `/api/logs/:id/resolve` | Mark flag as resolved |

---

## Design Decisions

- **Socratic method over direct answers**: Every interaction guides rather than gives. This is enforced at the system prompt level and validated through red-team testing.
- **Rubric-first feedback**: Tags create transparency and prevent the "generic AI advice" problem.
- **Settings affect behavior**: Disabling a feedback type removes it from the active response pool — the toggle does something demonstrable.
- **Context-aware chips**: Suggestion chips adapt based on the last rubric area discussed, guiding students toward productive follow-ups.
- **Instructor sandbox**: Settings panel gives instructors full control over AI behavior before deploying to students.
- **Demo mode with simulated streaming**: Ensures the project is always runnable and reviewable without API credentials, while still demonstrating the streaming UX.

---

## Iteration History

This project was developed through two agile sprints with three usability testers:

| Sprint | Change | Impact |
|--------|--------|--------|
| 1 | 3x chat response variety | Eliminated repetitive phrasing |
| 1 | Rubric criteria modal | +407% conversion lift in A/B test (p = 0.014) |
| 1 | Context-aware suggestion chips | Higher follow-up engagement |
| 2 | Resolve-flag button | Completed instructor oversight workflow |
| Polish | Streaming responses | Real-time token-by-token output via SSE |
| Polish | Settings wired to backend | Toggling feedback types actually changes AI behavior |

---

## License

MIT

---

## Acknowledgments

Built as part of the Developing AI Solutions course, Spring 2026. Prototype development assisted by Anthropic's Claude. All design decisions, testing, and analysis by Finn Murphy.
