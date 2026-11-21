# PaperLens — Multi-Agent AI Scientific Paper Review System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-orange.svg)](https://crewai.com)
[![Google ADK](https://img.shields.io/badge/Google%20ADK-Gemini%202.0-blue.svg)](https://cloud.google.com)
[![Model Context Protocol](https://img.shields.io/badge/MCP-JSON--RPC%202.0-purple.svg)](https://modelcontextprotocol.io)
[![A2A Protocol](https://img.shields.io/badge/A2A%20Protocol-Interoperable-green.svg)](https://github.com/AnanyaPandey0805/PaperLens)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2-red.svg)](https://docs.pydantic.dev/)

> **PaperLens** is an Agentic AI Scientific Paper Review System that goes far beyond superficial summarization to stress-test experimental methodology, evaluate prior art differentiation across arXiv, OpenAlex, and CrossRef, enforce multi-layer guardrails, and foster multi-round debate with challenge questions.

---

## 🌟 Key Capabilities & Architectural Highlights

1. **Multi-Agent Specialist Review & Debate**:
   - **CrewAI Specialist Agents**: Novelty & Gap Analyst, Methodology & Reproducibility Auditor, Dataset & Evidence Reviewer.
   - **Google ADK Adversarial Critic**: Independent adversarial reviewer powered by Google ADK (`gemini-2.0-flash`) challenging findings and demanding empirical ablations.
   - **Multi-Round Debate with Challenge Questions**: 4 debate rounds and targeted, urgent challenge questions exposed live in the UI.

2. **Model Context Protocol (MCP) Integration**:
   - Built on standard FastMCP with 5 external academic tools (`text_statistics`, `search_academic_literature`, `search_arxiv`, `search_openalex`, `search_crossref`).
   - Full JSON-RPC 2.0 telemetry with an interactive live tool testing console directly inside the dashboard.

3. **Agent-to-Agent (A2A) Protocol Boundary**:
   - Official agent discovery card at `/.well-known/agent-card.json`.
   - Interoperable JSON-RPC 2.0 message handoff between CrewAI specialists and the Google ADK Adversarial Critic.

4. **Multi-Layer Defense-in-Depth Guardrails**:
   - **Layer 1 (Input)**: Prompt injection scanner (8 signatures) + toxic language filter.
   - **Layer 2 (Tools)**: MCP query sanitization + tool return type-checking callbacks.
   - **Layer 3 (A2A)**: Context sandboxing via `<UNTRUSTED_PAPER_CONTENT>` tags + citation grounding verification.
   - **Layer 4 (Output)**: Score bounds clamping (0–100) + Pydantic schema validation.

5. **Context Sharing & State Management**:
   - Centralized `state` dictionary feeding intermediate outputs from one agent to the next across 6 distinct pipeline transitions.

6. **Task Monitoring, Callbacks & Observability**:
   - `AgentCallbackHandler` and `task_callback` for intermediate task tracking.
   - `RunMonitor` with native Langfuse tracing and execution span timing.

7. **End-to-End Evaluation & Cost Estimation**:
   - Benchmark evaluation across scientific papers with latency (ms), running time (s), token consumption, and cost estimates ($0.59 / 1M in, $0.79 / 1M out).

---

## 📋 Evaluation Requirements Mapping (10/10)

| Requirement | Implementation & Code Location | Where in UI |
|---|---|---|
| **1. Context Sharing & State Updates** | `backend/app/pipeline.py` (`state` dictionary & `StateTransition`) | Tab: **Context & State Updates** |
| **2. Tool Integration using MCP** | `backend/mcp_server.py`, `backend/app/mcp_client.py` | Tab: **MCP Tools & Protocol** |
| **3. Structured Output (Pydantic)** | `backend/app/schemas.py:ReviewReport` | **Table View**, **Export Markdown**, **Export JSON** |
| **4. Agentic Design Patterns** | Hierarchical Orchestration, Specialist Crew, Evaluator-Optimizer Critique | Tab: **Agentic Activity** |
| **5. Task Monitoring & Callbacks** | `backend/app/observability.py:AgentCallbackHandler`, `backend/app/crew.py` | Tab: **Critique & logs**, Left Event Stream |
| **6. A2A Protocol Communication** | `backend/app/a2a.py` (`/.well-known/agent-card.json`, `/a2a`) | Tab: **A2A Inter-Agent Protocol** |
| **7. CrewAI + Google ADK Only** | `backend/app/crew.py` (CrewAI) & `backend/app/adk_agent.py` (Google ADK) | Agent badges on every debate turn |
| **8. Secure Agentic System (Guardrails)** | `backend/app/guardrails.py` (4 Defense Layers) | Tab: **Guardrails & Security** |
| **9. Observability & Tracing** | `backend/app/observability.py:RunMonitor` (Langfuse + Spans) | Traced in `ReviewReport.events` |
| **10. Performance, Cost & Latency Eval** | `backend/evaluation/run_eval.py` & `sample_cases.jsonl` | Tab: **Evaluation & Cost** |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 20+
- PowerShell (Windows) or Bash (macOS/Linux)

### 1. Backend Setup & Startup
```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
..\..\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Copy environment template
copy .env.example .env

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Health Check: [http://localhost:8000/health](http://localhost:8000/health)
- A2A Agent Card: [http://localhost:8000/.well-known/agent-card.json](http://localhost:8000/.well-known/agent-card.json)
- Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup & Startup
```powershell
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📊 Benchmark Evaluation Suite

Run the automated evaluation benchmark across diverse scientific papers:
```powershell
cd backend
python -u evaluation/run_eval.py
```

### Benchmark Results Overview
- **Cases Evaluated**: 4 scientific benchmarks (`sample_cases.jsonl`)
- **Average Running Time**: ~2.5s – 11.8s per paper review
- **Average Cost per Review**: ~$0.0018 USD
- **Guardrail Pass Rate**: 100% across all 4 layers

---

## 📂 Project Directory Structure

```
PaperLens/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI endpoints (/api/review, /api/chat, /a2a)
│   │   ├── pipeline.py          # Master orchestrator, state transitions, debate rounds
│   │   ├── schemas.py           # Pydantic models (ReviewReport, ChallengeQuestion, etc.)
│   │   ├── guardrails.py        # 4-layer defense-in-depth security guardrails
│   │   ├── mcp_client.py        # FastMCP JSON-RPC 2.0 client session & telemetry
│   │   ├── a2a.py               # A2A protocol endpoint and message handoff
│   │   ├── crew.py              # CrewAI specialist reviewers with task callbacks
│   │   ├── adk_agent.py         # Google ADK Adversarial Critic agent
│   │   ├── observability.py     # RunMonitor, Langfuse integration, callbacks
│   │   ├── chat.py              # Interactive academic copilot
│   │   └── config.py            # Environment settings and validator
│   ├── evaluation/
│   │   ├── run_eval.py          # Performance, running time, latency & cost benchmark
│   │   └── sample_cases.jsonl   # 4 diverse scientific paper test cases
│   ├── mcp_server.py            # FastMCP Server (paperlens-research-tools)
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment configuration template
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # React dashboard (11 distinct tabs/views)
│   │   ├── style.css            # Custom CSS for debate bubbles, cards, guardrails
│   │   └── main.jsx             # React mount
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite build configuration
├── docs/
│   ├── requirements-matrix.md   # Detailed syllabus mapping
│   └── presentation_guide.md    # Complete walkthrough guide for presentations
└── README.md                    # Project overview & documentation
```

---

## 🛡️ Security & Privacy Notice
All uploaded manuscripts and abstracts are sandboxed inside `<UNTRUSTED_PAPER_CONTENT>` tags and processed in-memory. Sensitive environment variables are kept in `.env` and are strictly excluded from version control via `.gitignore`.
