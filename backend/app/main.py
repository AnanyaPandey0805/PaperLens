try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

import os, sys, tempfile, pathlib
os.environ["PYTHONHTTPSVERIFY"] = "0"
os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
os.environ["CREWAI_TELEMETRY_OPT_OUT"] = "true"
os.environ["OTEL_SDK_DISABLED"] = "true"

# Prevent CrewAI from attempting to write credentials to forbidden AppData folder on Windows:
try:
    from crewai_core import token_manager
    def _safe_storage_path() -> pathlib.Path:
        p = pathlib.Path(tempfile.gettempdir()) / "crewai_storage"
        p.mkdir(parents=True, exist_ok=True)
        return p
    token_manager.TokenManager._get_secure_storage_path = staticmethod(_safe_storage_path)
except Exception:
    pass

try:
    import litellm
    litellm.ssl_verify = False
    litellm.telemetry = False
except Exception:
    pass

import io
import pdfplumber
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .schemas import (
    PaperInput, ReviewReport, ChatRequest, ChatResponse,
    McpInvokeRequest, McpInvokeResponse, EvaluationSummary,
    IdeaInput, IdeaNoveltyReport
)
from .guardrails import validate_paper_text
from .pipeline import run_review
from .chat import handle_paper_chat
from .mcp_client import call_mcp_tool
from .a2a import router as a2a_router
from .idea_checker import check_research_idea_novelty, extract_text_from_file

app = FastAPI(title="PaperLens API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.include_router(a2a_router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "paperlens-api",
        "mode": "live_llm" if settings.groq_api_key else "demo_fallback",
        "frameworks": ["CrewAI", "Google ADK"],
        "protocols": ["Model Context Protocol (JSON-RPC 2.0)", "A2A Protocol (JSON-RPC 2.0)"],
        "guardrail_layers": 4
    }

@app.post("/api/review", response_model=ReviewReport)
async def review(payload: PaperInput):
    return await run_review(payload.title, validate_paper_text(payload.text, settings.max_text_chars))

@app.post("/api/review/pdf", response_model=ReviewReport)
async def review_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(415, "Upload a PDF file.")
    data = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, "PDF exceeds upload limit.")
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as exc:
        raise HTTPException(422, f"Could not parse PDF: {type(exc).__name__}")
    return await run_review(file.filename.rsplit(".", 1)[0], validate_paper_text(text, settings.max_text_chars))

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_paper(payload: ChatRequest):
    return await handle_paper_chat(payload)

@app.post("/api/mcp/invoke", response_model=McpInvokeResponse)
async def invoke_mcp_tool(payload: McpInvokeRequest):
    result, invocation = await call_mcp_tool(payload.tool_name, payload.arguments, payload.calling_agent)
    return McpInvokeResponse(invocation=invocation, result=result)

@app.get("/api/evaluation", response_model=EvaluationSummary)
async def get_evaluation_metrics():
    """Run end-to-end performance evaluation, latency, running time, and cost estimates."""
    from ..evaluation.run_eval import evaluate_all_cases
    return await evaluate_all_cases()

# --- Feature: Research Idea Novelty Checker Endpoints ---

@app.post("/api/idea/check", response_model=IdeaNoveltyReport)
async def check_idea(payload: IdeaInput):
    clean_text = payload.idea_text.strip()
    if len(clean_text) < 20:
        raise HTTPException(422, "Please describe your research idea in at least 20 characters.")
    return await check_research_idea_novelty(payload.title, clean_text)

@app.post("/api/idea/check/file", response_model=IdeaNoveltyReport)
async def check_idea_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(400, "No file uploaded.")
    fn = file.filename.lower()
    if not (fn.endswith(".pdf") or fn.endswith(".docx")):
        raise HTTPException(415, "Unsupported file format. Please upload a .pdf or .docx document.")
    data = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"File exceeds the maximum upload limit ({settings.max_upload_mb} MB).")
    try:
        text = extract_text_from_file(data, file.filename)
    except Exception as exc:
        raise HTTPException(422, f"Could not extract text: {exc}")
    
    if len(text.strip()) < 20:
        raise HTTPException(422, "Uploaded document contains insufficient extractable text (minimum 20 characters).")
        
    title = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
    return await check_research_idea_novelty(title, text)

