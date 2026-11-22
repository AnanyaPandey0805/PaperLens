# PaperLens — 10 Minimum Requirements Code & Architecture Map

This document maps all 10 evaluation criteria to exact files, functions, and architecture components for professors and reviewers.

| # | Evaluation Criterion | Exact Code Implementation | Presentation Explanation & Demonstration |
|---|---|---|---|
| **1** | **Context Sharing & State Updates** | `backend/app/pipeline.py` (`state` dictionary), `StateTransition` model in `app/schemas.py` | State flows through 6 discrete steps: `title + text` → `stats` → `sources` → `findings` → `critique` → `recommendation`. Demonstrated in the **"Context & State Updates"** UI tab. |
| **2** | **Tool Integration using MCP (2+ tools)** | `backend/mcp_server.py` (`FastMCP("paperlens-research-tools")`), `backend/app/mcp_client.py` | 5 tools registered over Model Context Protocol (JSON-RPC 2.0): `text_statistics`, `search_academic_literature`, `search_arxiv`, `search_openalex`, `search_crossref`. Demonstrated live in the **"MCP Tools & Protocol"** tab and interactive console. |
| **3** | **Structured Output using Pydantic** | `backend/app/schemas.py` (`ReviewReport`, `Finding`, `ChallengeQuestion`, `McpToolInvocation`) | Generates typed, validated JSON and Markdown Table formats with mathematical constraints. Demonstrated with the **"Export Markdown"**, **"Export JSON"**, and **"Table View"** toggles. |
| **4** | **Agentic Design Patterns** | `backend/app/pipeline.py` & `backend/app/crew.py` | Implements 4 patterns: (a) Hierarchical Orchestrator-Worker, (b) Role-based Specialist Crew, (c) Evaluator-Optimizer Adversarial Critique, (d) Multi-round Conference Debate. |
| **5** | **Task Monitoring & Logging using Callbacks** | `backend/app/observability.py` (`AgentCallbackHandler`, `RunMonitor`), `backend/app/crew.py` (`task_callback`) | `task_callback` captures intermediate outputs, execution flows, and errors for transparency. All logged into `report.events` and Langfuse. |
| **6** | **Agent-to-Agent (A2A) Protocol Communication** | `backend/app/a2a.py` (`execute_a2a_critique()`, `/.well-known/agent-card.json`, `/a2a`) | Passes structured findings from CrewAI specialist agents over JSON-RPC 2.0 message handoff to the Google ADK Adversarial Critic agent. Demonstrated in the **"A2A Inter-Agent Protocol"** tab. |
| **7** | **CrewAI + Google ADK Exclusivity** | `backend/app/crew.py` (CrewAI specialists) & `backend/app/adk_agent.py` (Google ADK critic) | Only CrewAI and Google ADK are used as the agentic frameworks across the entire system. Zero unauthorized frameworks. |
| **8** | **Securing the Agentic System (Guardrails & Callbacks)** | `backend/app/guardrails.py` (4 Defense-in-Depth Layers) | • Layer 1: Prompt injection scanner, toxic language screener, size limits.<br>• Layer 2: Tool return type-checking callbacks & query sanitizer.<br>• Layer 3: Context sandboxing (`<UNTRUSTED_PAPER_CONTENT>`) & citation grounding.<br>• Layer 4: Mathematical score clamping & verdict consistency. Demonstrated in the **"Guardrails & Security"** tab. |
| **9** | **Observability & Tracing (Langfuse Integration)** | `backend/app/observability.py` (`RunMonitor`, `optional_langfuse()`) | Full provenance, span durations, token estimations, and metadata exported to Langfuse and returned in `report.events`. |
| **10** | **End-to-End Evaluation, Running Time & Cost Estimates** | `backend/evaluation/run_eval.py` & `/api/evaluation` | Evaluates diverse benchmark cases (`sample_cases.jsonl`), calculating latency in ms, running time in seconds, token counts, and cost in USD ($0.59/1M in, $0.79/1M out). Demonstrated live in the **"Evaluation & Cost"** tab. |

---

## 💡 New Feature: Research Idea Novelty Checker ("Check Research Idea")

| Feature Dimension | Implementation Location | Capability Description |
|---|---|---|
| **Multi-Format Input** | `backend/app/idea_checker.py:extract_text_from_file` | Accepts raw text descriptions OR uploaded drafts in **PDF** and **DOCX** formats with automated text extraction. |
| **Concept & Domain Analysis** | `backend/app/idea_checker.py:analyze_research_idea` | Deconstructs idea into: problem statement, objectives, proposed methodology, key concepts/technologies, domain, and keywords. |
| **Verifiable Academic Search** | `backend/app/idea_checker.py:search_similar_papers` | Searches authentic literature across arXiv, OpenAlex, and CrossRef without fabricating DOIs, authors, or publication URLs. |
| **Novelty Categorization & Scoring** | `backend/app/idea_checker.py:assess_novelty` | Evaluates novelty into 4 tiers (`Highly Explored`, `Partially Explored`, `Limited Existing Research`, `Potentially Novel`) + 0–100 indicative score and academic disclaimer. |
| **5-Section Results Dashboard** | `frontend/src/App.jsx` (`appMode === "idea"`) | 1. Idea Overview<br>2. Novelty Assessment<br>3. Similar Research Papers (with direct clickable links)<br>4. Research Gap Identification<br>5. Actionable Recommendations. |

