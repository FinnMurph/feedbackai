# ✦ FeedbackAI

**An AI-powered assignment feedback assistant that guides student thinking through Socratic questioning — without writing content for them.**

FeedbackAI provides rubric-aligned, formative feedback for university writing courses while maintaining academic integrity through built-in guardrails and instructor oversight.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)
![Claude API](https://img.shields.io/badge/Claude_API-Sonnet_4.5-6366F1?logo=anthropic&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## The Problem

Instructors in writing-intensive courses lack time to provide formative feedback on student drafts — average time-to-first-feedback exceeds 72 hours. Students want guidance during the writing process, but existing AI tools risk academic integrity violations by generating content rather than guiding thinking.

## The Solution

FeedbackAI is a web application where an AI assistant helps students improve their writing by asking Socratic questions tied to rubric criteria. It **never writes content** for students. Every suggestion is tagged with the specific grading criterion it addresses (Organization, Clarity, Evidence, or Critical Thinking), creating transparency and preventing generic feedback.

---

## Features

### Student View
- **Three-column layout** — Assignments, document editor, and AI chat side by side
- **Inline highlights** — Clickable passages trigger rubric-specific feedback
- **Socratic chat** — AI asks guiding questions, never generates answers
- **Rubric modal** — On-demand view of all criteria with descriptions and weights
- **Context-aware suggestion chips** — Adapt based on last conversation topic

### Instructor Dashboard
- **Real-time analytics** — Active students, conversation volume, rubric engagement
- **Conversation log** — Searchable log with rubric tags and flag status
- **Resolve workflow** — One-click resolution for integrity flags

### Integrity Guardrails
- **Automatic detection** of content-generation requests
- **Polite refusal + Socratic redirect** — Never just says "no"
- **Instructor flagging** — Violations logged for review
- **System prompt enforcement** — Architectural-level constraints

### Settings Panel
- **Toggle feedback types** per rubric area
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
                                           │ /api/chat
                                           ▼
┌─────────────────────────────────────────────────────┐
│                   Server (Flask)                      │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Chat Engine │  │ Feedback     │  │ Settings &   │ │
│  │ + System   │  │ Engine       │  │ Logs (in-    │ │
│  │   Prompt   │  │ (highlights) │  │  memory)     │ │
│  └──────┬─────┘  └──────────────┘  └──────────────┘ │
│         │                                            │
└─────────┼────────────────────────────────────────────┘
          │
          ▼
┌──────────────────┐
│  Claude API      │
│  (Sonnet 4.5)    │
│  or Demo Mode    │
└──────────────────┘
```

**Demo mode**: Runs without an API key using curated Socratic responses that match the live behavior. Set `ANTHROPIC_API_KEY` for real Claude integration.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 19 + Vite | Fast dev server, modern hooks, HMR |
| **Styling** | Custom CSS with design tokens | Consistent spacing, typography, colors via CSS variables |
| **Icons** | Lucide React | Clean, tree-shakeable icon set |
| **Backend** | Flask + Flask-CORS | Lightweight Python API, matches AI/ML ecosystem |
| **AI** | Anthropic Claude API | Sonnet 4.5 with system prompt engineering |
| **Guardrails** | System prompt + keyword detection | Two-layer integrity enforcement |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1. Clone and set up

```bash
git clone https://github.com/YOUR_USERNAME/feedbackai.git
cd feedbackai
```

### 2. Start the backend

```bash
cd server
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: add API key for live Claude responses
cp ../.env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

python app.py
```

The API runs on `http://localhost:5000`. Without an API key, it runs in **demo mode** with simulated Socratic responses.

### 3. Start the frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` — Vite proxies `/api/*` calls to the Flask backend.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/mode` | Check demo vs. live mode |
| `POST` | `/api/chat` | Send message, get Socratic response |
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
- **Context-aware chips**: Suggestion chips adapt based on the last rubric area discussed, guiding students toward productive follow-ups.
- **Instructor sandbox**: Settings panel gives instructors full control over AI behavior before deploying to students.
- **Demo mode**: Ensures the project is always runnable and reviewable without API credentials.

---

## Iteration History

This project was developed through two agile sprints with three usability testers:

| Sprint | Change | Impact |
|--------|--------|--------|
| 1 | 3x chat response variety | Eliminated repetitive phrasing |
| 1 | Rubric criteria modal | +407% conversion lift in A/B test (p = 0.014) |
| 1 | Context-aware suggestion chips | Higher follow-up engagement |
| 2 | Resolve-flag button | Completed instructor oversight workflow |

---

## License

MIT

---

## Acknowledgments

Built as part of the Developing AI Solutions course, Spring 2026. Prototype development assisted by Anthropic's Claude. All design decisions, testing, and analysis by Finn Murphy.
