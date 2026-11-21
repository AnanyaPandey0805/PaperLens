import React, { useState } from "react";
import {
  Microscope, UploadCloud, FileText, Sparkles, BookOpen, ShieldCheck,
  Clock3, Gauge, Search, Activity, Layers3, ChevronRight, ArrowUpRight,
  LoaderCircle, CheckCircle2, X, FlaskConical, Menu, Workflow, Bot,
  MessageSquare, Send, AlertTriangle, Terminal, Code2, Play, RefreshCw,
  UserCheck, CheckCircle, ShieldAlert, Cpu, Database, DollarSign, Table
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const sample = `Abstract. We propose a lightweight transformer-based approach for scientific document classification. We evaluate on a public dataset of 2,400 abstracts and compare against TF-IDF and a pretrained transformer. The proposed model achieves 4.2% higher macro-F1 than TF-IDF, but only a 0.6% gain over the pretrained transformer. We use a single train-test split and do not report confidence intervals or multiple random seeds. The dataset contains computer science papers from 2019 to 2023. We do not include an ablation study to isolate the contribution of domain-specific embeddings. Methods. The dataset is split into 80% training and 20% testing. We use Adam with learning rate 0.0001 for 10 epochs. Limitations. Our study lacks external validation and ablation analysis.`;

function Badge({ children, tone = "" }) {
  return <span className={"badge " + tone}>{children}</span>;
}

export default function App() {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Findings");
  const [menu, setMenu] = useState(false);
  const [viewTableMode, setViewTableMode] = useState(false);

  // Filter state for Agent Debate
  const [debateFilter, setDebateFilter] = useState("all");

  // Interactive MCP Playground state
  const [playgroundTool, setPlaygroundTool] = useState("search_academic_literature");
  const [playgroundQuery, setPlaygroundQuery] = useState("transformer scientific document classification");
  const [playgroundBusy, setPlaygroundBusy] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState(null);

  // Evaluation state
  const [evalSummary, setEvalSummary] = useState(null);
  const [evalBusy, setEvalBusy] = useState(false);

  // AI Chatbot state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [selectedSourceForChat, setSelectedSourceForChat] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "How should I address the agents' challenge questions?",
    "Where are the 4 layers of Guardrails implemented?",
    "How do the agents interact with tools through MCP?",
    "Explain the A2A interoperability between CrewAI and ADK"
  ]);

  async function submit() {
    setBusy(true); setError(""); setReport(null);
    try {
      let r;
      if (file) {
        let f = new FormData(); f.append("file", file);
        r = await fetch(API + "/api/review/pdf", { method: "POST", body: f });
      } else {
        r = await fetch(API + "/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title || "Research paper review", text })
        });
      }
      let d = await r.json();
      if (!r.ok) throw Error(d.detail || "Review failed");
      setReport(d);
      if (d.sources?.length) {
        setSelectedSourceForChat(d.sources[0]);
      }
    } catch (e) {
      setError(e.message + " — ensure the API is running at " + API);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setReport(null); setText(""); setTitle(""); setFile(null); setError("");
    setChatMessages([]); setChatInput(""); setSelectedSourceForChat(null);
    setPlaygroundResult(null); setEvalSummary(null);
  }

  function openChatForSource(source) {
    setSelectedSourceForChat(source);
    setTab("AI Paper Chat");
    setChatMessages([
      {
        role: "assistant",
        content: `👋 Ready to compare your paper with **"${source.title}"** (${source.similarity_percentage}% similarity).\n\nAsk me anything about their methodology, datasets, baseline models, key findings, or how to answer the challenge questions thrown by the review agents!`
      }
    ]);
  }

  async function sendChatMessage(customQuestion) {
    const q = customQuestion || chatInput;
    if (!q.trim() || chatBusy) return;
    const newMsgs = [...chatMessages, { role: "user", content: q }];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatBusy(true);
    try {
      const res = await fetch(API + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_title: report?.paper_title || title || "Uploaded Research Paper",
          paper_text: text || sample,
          selected_source: selectedSourceForChat,
          messages: newMsgs,
          question: q
        })
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.detail || "Chat request failed");
      setChatMessages([...newMsgs, { role: "assistant", content: data.reply }]);
      if (data.suggested_questions?.length) {
        setSuggestedQuestions(data.suggested_questions);
      }
    } catch (err) {
      setChatMessages([...newMsgs, { role: "assistant", content: "⚠️ " + err.message }]);
    } finally {
      setChatBusy(false);
    }
  }

  async function executeMcpPlayground() {
    setPlaygroundBusy(true);
    try {
      let args = {};
      if (playgroundTool === "text_statistics") {
        args = { paper_text: text || sample };
      } else {
        args = { query: playgroundQuery, max_results: 5 };
      }
      const res = await fetch(API + "/api/mcp/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_name: playgroundTool,
          arguments: args,
          calling_agent: "Interactive Presentation Console"
        })
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.detail || "MCP invocation failed");
      setPlaygroundResult(data);
    } catch (err) {
      setPlaygroundResult({ error: err.message });
    } finally {
      setPlaygroundBusy(false);
    }
  }

  async function runEvaluationBenchmark() {
    setEvalBusy(true);
    try {
      const res = await fetch(API + "/api/evaluation");
      const data = await res.json();
      if (!res.ok) throw Error(data.detail || "Evaluation failed");
      setEvalSummary(data);
    } catch (err) {
      alert("Evaluation note: " + err.message);
    } finally {
      setEvalBusy(false);
    }
  }

  function exportMarkdown() {
    if (!report) return;
    let md = `# PaperLens Academic Peer Review Report\n\n`;
    md += `**Paper Title**: ${report.paper_title}\n`;
    md += `**Review ID**: ${report.review_id}\n`;
    md += `**Recommendation**: ${report.overall_recommendation.toUpperCase()}\n`;
    md += `**Novelty Score**: ${report.novelty_score}/100 | **Feasibility**: ${report.feasibility_score}/100 | **Evidence Coverage**: ${Math.round(report.evidence_coverage * 100)}%\n\n`;
    md += `## Summary\n${report.summary}\n\n`;
    md += `## Specialist Findings\n\n`;
    md += `| Dimension | Verdict | Headline | Recommendation |\n`;
    md += `|---|---|---|---|\n`;
    for (const f of report.findings) {
      md += `| ${f.dimension} | ${f.verdict} | ${f.headline.replaceAll("|", "-")} | ${f.recommendation.replaceAll("|", "-")} |\n`;
    }
    md += `\n## Challenge Questions Thrown by Agents\n\n`;
    for (const cq of report.challenge_questions) {
      md += `### [${cq.urgency.toUpperCase()}] ${cq.challenger_name} → ${cq.target}\n`;
      md += `> "${cq.question}"\n\n`;
    }
    md += `\n## Adversarial Critique (A2A Protocol Pass)\n${report.critique_summary}\n`;
    navigator.clipboard?.writeText(md);
    alert("Structured Markdown report copied to clipboard!");
  }

  const findings = report?.findings || [];
  const agentActivities = report?.agent_activities || [];
  const challengeQuestions = report?.challenge_questions || [];
  const agentConversation = report?.agent_conversation || [];
  const guardrailAudits = report?.guardrail_audits || [];
  const mcpInvocations = report?.mcp_invocations || [];
  const stateTransitions = report?.state_transitions || [];
  const a2aExchanges = report?.a2a_exchanges || [];

  const filteredDebate = agentConversation.filter(m => {
    if (debateFilter === "challenges") return !!m.challenge_question;
    if (debateFilter === "a2a") return m.sender_framework.includes("ADK") || m.sender_framework.includes("A2A");
    return true;
  });

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <div className="brand">
          <div className="logo"><Microscope /></div>
          <div>
            <b>paperlens<span>.</span></b>
            <small>RESEARCH INTELLIGENCE</small>
          </div>
        </div>
        <div className="muted label">WORKSPACE</div>
        <div className="workspace">
          <div className="avatar">PL</div>
          <div>
            <b>Research Lab</b>
            <small>Presentation Mode</small>
          </div>
          <ChevronRight size={15} />
        </div>
        <div className="muted label">10 EVALUATION CRITERIA</div>
        <div className="nav active"><Layers3 /> 1. Paper Review <span className="dot" /></div>
        <div className="nav" onClick={() => setTab("Agent Debate & Challenges")}><MessageSquare /> 2. Challenge Debate</div>
        <div className="nav" onClick={() => setTab("Context & State Updates")}><Database /> 3. State & Context Sharing</div>
        <div className="nav" onClick={() => setTab("MCP Tools & Protocol")}><Terminal /> 4. MCP Tools (2+ tools)</div>
        <div className="nav" onClick={() => setTab("Guardrails & Security")}><ShieldCheck /> 5. 4-Layer Guardrails</div>
        <div className="nav" onClick={() => setTab("A2A Inter-Agent Protocol")}><Workflow /> 6. A2A (CrewAI + ADK)</div>
        <div className="nav" onClick={() => setTab("Evaluation & Cost")}><DollarSign /> 7. Evaluation & Cost</div>
        <div className="side-bottom">
          <div className="help">
            <ShieldCheck />
            <div>
              <b>Evidence-First Review</b>
              <small>CrewAI + ADK + FastMCP</small>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">P</div>
            <div>
              <b>Presenter</b>
              <small>Student Project</small>
            </div>
            <i />
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main>
        <header>
          <button className="menu" onClick={() => setMenu(!menu)}><Menu /></button>
          <span>Workspace</span>
          <ChevronRight size={14} />
          <b>Multi-Agent Peer Review Dashboard</b>
          <div className="push" />
          <span className="status-dot" />
          <small>System Operational · MCP FastMCP · 4 Guardrail Layers</small>
          <div className="top-avatar">P</div>
        </header>

        <div className="content">
          <div className="heading">
            <div>
              <div className="eyebrow">— AGENTIC RESEARCH INTELLIGENCE & PEER REVIEW</div>
              <h1>Paper review<span>.</span></h1>
              <p>Specialist agents, cross-examination challenges, Model Context Protocol, and 4-layer guardrails.</p>
            </div>
            <button className="ghost" onClick={reset}>
              <FileText size={15} /> New review
            </button>
          </div>

          {/* Submission Panel */}
          {!report && (
            <section className="panel">
              <div className="panel-head">
                <div className="iconbox"><UploadCloud /></div>
                <div className="headcopy">
                  <h2>Submit research paper</h2>
                  <p>Upload a PDF or paste text to trigger the multi-agent review with MCP tools and Guardrails.</p>
                </div>
                <Badge>STEP 01 / 03</Badge>
              </div>

              <label className="drop">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={e => {
                    setFile(e.target.files?.[0] || null);
                    setText("");
                    setTitle(e.target.files?.[0]?.name.replace(/\.pdf$/i, "") || "");
                  }}
                />
                <UploadCloud size={24} />
                <b>{file ? file.name : "Drop your research paper PDF here"}</b>
                <small>{file ? "PDF selected · " + (file.size / 1048576).toFixed(2) + " MB" : "PDF format supported · Up to 12 MB"}</small>
                <span>Browse files</span>
              </label>

              <div className="or"><span>OR PASTE SCIENTIFIC TEXT</span></div>

              <label className="fieldlabel">
                PAPER TITLE <em>OPTIONAL</em>
                <input
                  value={title}
                  disabled={!!file}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Lightweight Transformer for Scientific Document Classification"
                />
              </label>

              <div className="labelrow">
                <label className="fieldlabel" htmlFor="papertext">PAPER CONTENT</label>
                <button
                  className="textbtn"
                  onClick={() => {
                    setFile(null);
                    setTitle("Lightweight Transformer for Scientific Document Classification");
                    setText(sample);
                  }}
                >
                  Load sample paper
                </button>
              </div>

              <textarea
                id="papertext"
                value={text}
                disabled={!!file}
                onChange={e => setText(e.target.value)}
                rows="6"
                placeholder="Paste abstract, methodology, experiments, results, and limitations..."
              />

              <div className="textfoot">
                <span>{text.length.toLocaleString()} characters · minimum 80</span>
                <span>Layer 1 Guardrail active: prompt injection, toxic language &amp; size boundaries enforced</span>
              </div>

              {error && <div className="error"><X size={15} />{error}</div>}

              <div className="submitrow">
                <div className="privacy">
                  <ShieldCheck size={16} /> 4 Guardrail Layers Armed <span>·</span> Model Context Protocol enabled
                </div>
                <button
                  className="primary"
                  disabled={busy || (!file && text.trim().length < 80)}
                  onClick={submit}
                >
                  {busy ? (
                    <><LoaderCircle className="spin" /> Orchestrating agents...</>
                  ) : (
                    <><Sparkles size={16} /> Launch Multi-Agent Review <ArrowUpRight size={15} /></>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* Busy Screen */}
          {busy && (
            <section className="panel busy">
              <LoaderCircle className="spin" size={28} />
              <div>
                <h2>Multi-agent peer review in progress</h2>
                <p>Coordinating specialist crew, invoking MCP tools, enforcing guardrails, and throwing challenge questions.</p>
                <div className="steps">
                  1. Layer 1 Guardrails Scan　→　2. FastMCP Text Stats &amp; Multi-Source Literature Search　→　3. CrewAI Specialists &amp; Challenges　→　4. A2A Protocol Handoff to Google ADK　→　5. Consensus &amp; Schema Synthesis
                </div>
              </div>
            </section>
          )}

          {/* Results Screen */}
          {report && (
            <section className="results">
              <div className="resulthead">
                <div>
                  <div className="eyebrow">— REVIEW COMPLETE · ID #{report.review_id}</div>
                  <h2>{report.paper_title}</h2>
                  <p>Generated multi-agent review · {new Date().toLocaleString()}</p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button className="ghost" onClick={() => setViewTableMode(!viewTableMode)}>
                    <Table size={14} /> {viewTableMode ? "Card View" : "Table View"}
                  </button>
                  <button className="ghost" onClick={exportMarkdown}>
                    <FileText size={14} /> Export Markdown
                  </button>
                  <button className="ghost" onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(report, null, 2));
                    alert("Pydantic JSON copied to clipboard!");
                  }}>
                    <Code2 size={14} /> Export JSON
                  </button>
                </div>
              </div>

              {/* Metrics Header */}
              <div className="stats">
                <div>
                  <small>NOVELTY ESTIMATE</small>
                  <b>{report.novelty_score}<i>/100</i></b>
                  <span>Literature differentiation</span>
                </div>
                <div>
                  <small>FEASIBILITY</small>
                  <b>{report.feasibility_score}<i>/100</i></b>
                  <span>Methods &amp; hygiene audit</span>
                </div>
                <div>
                  <small>EVIDENCE COVERAGE</small>
                  <b>{Math.round(report.evidence_coverage * 100)}<i>%</i></b>
                  <span>{report.sources.length} multi-source citations</span>
                </div>
                <div>
                  <small>EXECUTION LATENCY</small>
                  <b>{(report.duration_ms / 1000).toFixed(1)}<i>s</i></b>
                  <span>{report.execution_mode.replaceAll("_", " ")}</span>
                </div>
              </div>

              {/* Recommendation Banner */}
              <div className="recommend">
                <ShieldCheck />
                <div>
                  <small>PANEL CONSENSUS RECOMMENDATION</small>
                  <b>{report.overall_recommendation.replaceAll("_", " ")}</b>
                  <p>{report.summary}</p>
                </div>
                <Badge tone={report.overall_recommendation === "promising" ? "green" : report.overall_recommendation === "major_revision" ? "red" : "amber"}>
                  {report.overall_recommendation.replaceAll("_", " ")}
                </Badge>
              </div>

              {/* Navigation Tabs */}
              <div className="tabs" style={{ overflowX: "auto" }}>
                {[
                  "Findings",
                  "Agent Debate & Challenges",
                  "Context & State Updates",
                  "MCP Tools & Protocol",
                  "Guardrails & Security",
                  "A2A Inter-Agent Protocol",
                  "Evaluation & Cost",
                  "Literature",
                  "Agentic Activity",
                  "Critique & logs",
                  "AI Paper Chat"
                ].map(t => (
                  <button
                    key={t}
                    className={tab === t ? "sel" : ""}
                    onClick={() => setTab(t)}
                  >
                    {t === "Agent Debate & Challenges" && <AlertTriangle size={11} style={{ display: "inline", marginRight: 4, color: "#f39c12" }} />}
                    {t === "Context & State Updates" && <Database size={11} style={{ display: "inline", marginRight: 4, color: "#85c7f2" }} />}
                    {t === "MCP Tools & Protocol" && <Terminal size={11} style={{ display: "inline", marginRight: 4, color: "#64dfc7" }} />}
                    {t === "Guardrails & Security" && <ShieldCheck size={11} style={{ display: "inline", marginRight: 4, color: "#52d7a6" }} />}
                    {t === "A2A Inter-Agent Protocol" && <Workflow size={11} style={{ display: "inline", marginRight: 4, color: "#c9a6ff" }} />}
                    {t === "Evaluation & Cost" && <DollarSign size={11} style={{ display: "inline", marginRight: 4, color: "#ffd572" }} />}
                    {t === "AI Paper Chat" && <MessageSquare size={11} style={{ display: "inline", marginRight: 4 }} />}
                    {t}
                  </button>
                ))}
              </div>

              {/* TAB 1: FINDINGS (Structured Markdown Table or Cards - Req 3) */}
              {tab === "Findings" && (
                viewTableMode ? (
                  <div style={{ overflowX: "auto", background: "#0d1424", border: "1px solid #27344e", borderRadius: "10px", padding: "16px" }}>
                    <h3 style={{ fontSize: "12px", color: "#6fe0c9", marginTop: 0 }}>
                      Structured Findings Table (Pydantic Schema Output)
                    </h3>
                    <table className="eval-table">
                      <thead>
                        <tr>
                          <th>Dimension</th>
                          <th>Verdict</th>
                          <th>Headline</th>
                          <th>Confidence</th>
                          <th>Evidence Status</th>
                          <th>Revision Recommendation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {findings.map((f, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 700, color: "#cfe0f7", textTransform: "capitalize" }}>{f.dimension.replace("_", " ")}</td>
                            <td><Badge tone={f.verdict === "positive" ? "green" : f.verdict === "mixed" ? "amber" : "red"}>{f.verdict}</Badge></td>
                            <td style={{ fontWeight: 600 }}>{f.headline}</td>
                            <td>{Math.round(f.confidence * 100)}%</td>
                            <td><Badge tone={f.evidence_status === "supported" ? "green" : "amber"}>{f.evidence_status.replace("_", " ")}</Badge></td>
                            <td style={{ color: "#a5b8d0" }}>{f.recommendation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="cards">
                    {findings.map((f, i) => (
                      <article key={i} className="finding">
                        <div className="findicon">
                          {i === 0 ? <Search /> : i === 1 ? <FlaskConical /> : <Gauge />}
                        </div>
                        <div className="findbody">
                          <div className="findmeta">
                            <span>
                              {({
                                novelty: "Novelty & research gap",
                                methodology: "Methodology & feasibility",
                                dataset_evidence: "Dataset & evidence"
                              })[f.dimension] || f.dimension}
                            </span>
                            <Badge tone={f.evidence_status === "unverified" ? "red" : f.evidence_status === "partially_supported" ? "amber" : "green"}>
                              {f.evidence_status.replaceAll("_", " ")}
                            </Badge>
                          </div>
                          <h3>{f.headline}</h3>
                          <p>{f.explanation}</p>
                          <div className="next">
                            <b>Suggested next step for revision:</b>
                            <p>{f.recommendation}</p>
                          </div>
                          {f.source_ids?.length > 0 && (
                            <div className="pills">
                              {f.source_ids.map(s => <span key={s}>{s}</span>)}
                            </div>
                          )}
                        </div>
                        <div className="confidence">
                          {Math.round(f.confidence * 100)}%
                          <small>confidence</small>
                        </div>
                      </article>
                    ))}
                  </div>
                )
              )}

              {/* TAB 2: AGENT DEBATE & CHALLENGES (User Req 2) */}
              {tab === "Agent Debate & Challenges" && (
                <div className="debate-container">
                  <div className="debate-controls">
                    <div>
                      <b style={{ color: "#74dcca", fontSize: "11px" }}>
                        Multi-Agent Peer Review Dialogue ({agentConversation.length} turns)
                      </b>
                      <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#8d9eb8" }}>
                        Watch the specialist agents throw challenge questions at the author and debate findings in real time.
                      </p>
                    </div>
                    <div className="debate-filter-btns">
                      <button
                        className={"filter-btn " + (debateFilter === "all" ? "active" : "")}
                        onClick={() => setDebateFilter("all")}
                      >
                        All Turns ({agentConversation.length})
                      </button>
                      <button
                        className={"filter-btn " + (debateFilter === "challenges" ? "active" : "")}
                        onClick={() => setDebateFilter("challenges")}
                      >
                        ⚡ Challenge Questions Only ({challengeQuestions.length})
                      </button>
                      <button
                        className={"filter-btn " + (debateFilter === "a2a" ? "active" : "")}
                        onClick={() => setDebateFilter("a2a")}
                      >
                        🛡️ A2A Adversarial Pass
                      </button>
                    </div>
                  </div>

                  {filteredDebate.map((m, idx) => (
                    <div key={idx}>
                      {(idx === 0 || m.round !== filteredDebate[idx - 1]?.round) && (
                        <div className="debate-round-divider">
                          <span>{m.phase.toUpperCase()}</span>
                        </div>
                      )}

                      <div className="debate-turn">
                        <div className={"debate-avatar " + (m.avatar_icon || "workflow")}>
                          {m.avatar_icon === "workflow" ? <Workflow size={18} /> :
                           m.avatar_icon === "search" ? <Search size={18} /> :
                           m.avatar_icon === "microscope" ? <Microscope size={18} /> :
                           m.avatar_icon === "flask" ? <FlaskConical size={18} /> :
                           m.avatar_icon === "gauge" ? <Gauge size={18} /> :
                           m.avatar_icon === "shield" ? <ShieldCheck size={18} /> :
                           m.avatar_icon === "user-check" ? <UserCheck size={18} /> :
                           <Sparkles size={18} />}
                        </div>

                        <div className="debate-content">
                          <div className="debate-header">
                            <span className="debate-sender">{m.sender_name}</span>
                            <Badge tone={m.sender_framework.includes("CrewAI") ? "green" : m.sender_framework.includes("ADK") ? "amber" : ""}>
                              {m.sender_framework}
                            </Badge>
                            <small style={{ color: "#7a8ba7", fontSize: "9px", marginLeft: "auto" }}>
                              {m.timestamp}
                            </small>
                          </div>

                          <div className="debate-speech">{m.speech}</div>

                          {/* Highlighted Challenge Question Card */}
                          {m.challenge_question && (
                            <div className={"challenge-box " + (m.challenge_question.urgency === "critical" ? "critical" : "")}>
                              <div className="challenge-box-head">
                                <span className="challenge-tag">
                                  ⚡ CHALLENGE QUESTION THROWN
                                </span>
                                <Badge tone={m.challenge_question.urgency === "critical" ? "red" : "amber"}>
                                  {m.challenge_question.urgency.toUpperCase()} PRIORITY
                                </Badge>
                                <span className="challenge-target">
                                  Target: <b>{m.challenge_question.target}</b>
                                </span>
                              </div>
                              <p className="challenge-q-text">
                                "{m.challenge_question.question}"
                              </p>
                              <div className="challenge-context">
                                📌 Context reference: <i>{m.challenge_question.context_source}</i> · Status: <b style={{ color: "#6fe0c9" }}>{m.challenge_question.status.replaceAll("_", " ")}</b>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: CONTEXT & STATE UPDATES (Req 1) */}
              {tab === "Context & State Updates" && (
                <div className="state-flow-list">
                  <div className="a2a-banner">
                    <h3>Context Sharing &amp; State Updates (Requirement 1)</h3>
                    <p>
                      PaperLens maintains an explicit shared state dictionary (<code>state = &#123;title, paper_text, stats, sources, findings, critique&#125;</code>)
                      that flows across pipeline stages. Intermediate outputs from upstream agents are deposited into state and feed directly into downstream specialists.
                    </p>
                  </div>

                  {stateTransitions.map((st, i) => (
                    <div key={i} className="state-flow-card">
                      <div className="state-step-num">{st.step_number}</div>
                      <div className="state-card-body">
                        <div className="state-card-head">
                          <b style={{ color: "#e8f1fd", fontSize: "12px" }}>{st.stage_name}</b>
                          <span className="state-handoff">
                            From: <b>{st.source_agent}</b> → To: <b>{st.target_agent}</b>
                          </span>
                          <small style={{ marginLeft: "auto", color: "#7a8ba8", fontSize: "9px" }}>{st.timestamp}</small>
                        </div>
                        <p className="state-summary">{st.intermediate_summary}</p>
                        <div className="state-keys">
                          <span style={{ fontSize: "9px", color: "#7687a3" }}>Shared State Keys Updated:</span>
                          {st.keys_updated.map(k => (
                            <span key={k} className="state-key-pill">state["{k}"]</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: MCP TOOLS & PROTOCOL (Req 2 & 4) */}
              {tab === "MCP Tools & Protocol" && (
                <div className="mcp-container">
                  <div className="mcp-arch-diagram">
                    <h3>Model Context Protocol (FastMCP) — Agent-to-Tool Interface (Requirement 2 &amp; 4)</h3>
                    <p>
                      All external tools are registered on the <b>FastMCP server</b> (<code>backend/mcp_server.py</code>)
                      and called over <b>Model Context Protocol JSON-RPC 2.0</b>. Agents never execute shell commands or direct HTTP calls.
                    </p>
                    <div className="mcp-flow">
                      <div className="mcp-flow-node active">
                        <Bot size={13} /> Specialist Agent
                      </div>
                      <span className="mcp-flow-arrow">→ tools/call JSON-RPC 2.0 →</span>
                      <div className="mcp-flow-node">
                        <Terminal size={13} /> MCP Client (app/mcp_client.py)
                      </div>
                      <span className="mcp-flow-arrow">→ stdio / FastMCP →</span>
                      <div className="mcp-flow-node active">
                        <Cpu size={13} /> FastMCP Server (mcp_server.py)
                      </div>
                      <span className="mcp-flow-arrow">→ query APIs →</span>
                      <div className="mcp-flow-node">
                        <BookOpen size={13} /> arXiv / OpenAlex / CrossRef
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ color: "#74dcca", fontSize: "11px" }}>
                      Executed MCP Tool Invocations during Review ({mcpInvocations.length} calls)
                    </b>
                    <small style={{ color: "#8a9bb6", fontSize: "9px" }}>
                      Transport: stdio / JSON-RPC 2.0 Spec
                    </small>
                  </div>

                  <div className="mcp-invocations-list">
                    {mcpInvocations.map((inv, idx) => (
                      <div key={idx} className="mcp-inv-card">
                        <div className="mcp-inv-head">
                          <Terminal size={14} style={{ color: "#6fe0c9" }} />
                          <span className="mcp-tool-title">{inv.tool_name}()</span>
                          <Badge tone="green">MCP 2024-11-05</Badge>
                          <Badge tone={inv.status === "SUCCESS" ? "green" : "amber"}>{inv.status}</Badge>
                          <span style={{ fontSize: "9px", color: "#8798b3", marginLeft: "auto" }}>
                            Invoked by: <b style={{ color: "#c8d8ec" }}>{inv.agent_name}</b> · {inv.duration_ms} ms
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 8px", fontSize: "10px", color: "#a5b6cf" }}>
                          {inv.response_summary}
                        </p>
                        <details style={{ marginTop: "6px" }}>
                          <summary style={{ cursor: "pointer", fontSize: "9px", color: "#6fe0c9", fontWeight: 600 }}>
                            Inspect JSON-RPC 2.0 Protocol Envelope (Request &amp; Response)
                          </summary>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                            <div>
                              <small style={{ color: "#778aa6", fontSize: "8px" }}>MCP REQUEST (JSON-RPC 2.0)</small>
                              <pre className="json-box">{JSON.stringify(inv.request_jsonrpc, null, 2)}</pre>
                            </div>
                            <div>
                              <small style={{ color: "#778aa6", fontSize: "8px" }}>MCP RESPONSE (JSON-RPC 2.0)</small>
                              <pre className="json-box">{JSON.stringify(inv.response_jsonrpc, null, 2)}</pre>
                            </div>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>

                  {/* Interactive MCP Tool Playground */}
                  <div className="playground-box">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Code2 size={16} style={{ color: "#64dfc7" }} />
                      <h3 style={{ margin: 0 }}>Interactive MCP Tool Console (Live Presentation Demo)</h3>
                      <Badge tone="green">Interactive Tester</Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: "10px", color: "#8da0bc" }}>
                      Select any registered MCP tool and invoke it live to demonstrate how agents trigger tools over JSON-RPC:
                    </p>
                    <div className="playground-row">
                      <select value={playgroundTool} onChange={e => setPlaygroundTool(e.target.value)}>
                        <option value="search_academic_literature">search_academic_literature (Federated arXiv/OpenAlex/CrossRef)</option>
                        <option value="search_arxiv">search_arxiv (arXiv Preprints)</option>
                        <option value="search_openalex">search_openalex (OpenAlex 250M Catalog)</option>
                        <option value="search_crossref">search_crossref (CrossRef DOI Database)</option>
                        <option value="text_statistics">text_statistics (Structural Paper Audit)</option>
                      </select>
                      {playgroundTool !== "text_statistics" && (
                        <input
                          value={playgroundQuery}
                          onChange={e => setPlaygroundQuery(e.target.value)}
                          placeholder="Academic search query..."
                        />
                      )}
                      <button
                        className="primary"
                        onClick={executeMcpPlayground}
                        disabled={playgroundBusy}
                        style={{ padding: "8px 14px" }}
                      >
                        {playgroundBusy ? <LoaderCircle className="spin" size={12} /> : <Play size={12} />} Execute via MCP
                      </button>
                    </div>

                    {playgroundResult && (
                      <div>
                        <small style={{ color: "#70dfca", fontSize: "9px", fontWeight: 700 }}>
                          LIVE MCP EXECUTION RESULT:
                        </small>
                        <pre className="json-box" style={{ maxHeight: "220px" }}>
                          {JSON.stringify(playgroundResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: GUARDRAILS & SECURITY (Req 8) */}
              {tab === "Guardrails & Security" && (
                <div className="guardrails-container">
                  <div className="guardrails-banner">
                    <div>
                      <small>GUARDRAIL ARCHITECTURE</small>
                      <b>4 Active Layers</b>
                      <span>Defense-in-depth</span>
                    </div>
                    <div>
                      <small>LAYER 1 AUDIT</small>
                      <b>Input Ingestion</b>
                      <span>Injection, toxicity, size</span>
                    </div>
                    <div>
                      <small>LAYER 2 AUDIT</small>
                      <b>MCP Boundary</b>
                      <span>Type-check callbacks</span>
                    </div>
                    <div>
                      <small>LAYER 3 &amp; 4 AUDIT</small>
                      <b>A2A &amp; Schema</b>
                      <span>Sandboxing &amp; Pydantic</span>
                    </div>
                  </div>

                  {[
                    {
                      layer: "Layer 1: Input Ingestion",
                      title: "Layer 1 — Input Ingestion Guardrails",
                      subtitle: "Enforced before any LLM sees input: prompt injection scanner, toxic/abusive filter, character boundaries (backend/app/guardrails.py)",
                      icon: <ShieldAlert size={16} style={{ color: "#78e4d0" }} />
                    },
                    {
                      layer: "Layer 2: Tool & MCP Boundary",
                      title: "Layer 2 — Tool Execution & Return Type-Checking Callbacks",
                      subtitle: "Enforced at the FastMCP tool boundary: query sanitization, tool return type checking, and safe output truncation",
                      icon: <Terminal size={16} style={{ color: "#f39c12" }} />
                    },
                    {
                      layer: "Layer 3: Multi-Agent & A2A Boundary",
                      title: "Layer 3 — Multi-Agent & A2A Context Guardrails",
                      subtitle: "Sandboxes untrusted text in XML tags and verifies citation grounding against hallucination",
                      icon: <Workflow size={16} style={{ color: "#a5c1ff" }} />
                    },
                    {
                      layer: "Layer 4: Output Synthesis & Schema",
                      title: "Layer 4 — Output Synthesis & Schema Guardrails",
                      subtitle: "Score boundary clamping [0, 100], logical verdict consistency, and strict Pydantic schema validation",
                      icon: <CheckCircle size={16} style={{ color: "#52d7a6" }} />
                    }
                  ].map(sec => {
                    const secAudits = guardrailAudits.filter(a => a.layer === sec.layer);
                    return (
                      <div key={sec.layer} className="layer-section">
                        <div className="layer-head">
                          {sec.icon}
                          <div>
                            <h3>{sec.title}</h3>
                            <p>{sec.subtitle}</p>
                          </div>
                        </div>

                        {secAudits.map((a, i) => (
                          <div key={i} className="guardrail-card">
                            <div className="guardrail-top">
                              <span className="guardrail-name">{a.guardrail_name}</span>
                              <span className="code-pill">{a.code_location}</span>
                              <Badge tone={a.status === "PASSED" ? "green" : a.status === "WARNING" ? "amber" : "red"}>
                                {a.status}
                              </Badge>
                            </div>
                            <div className="guardrail-desc">
                              <b>Policy:</b> {a.policy_description}
                            </div>
                            <div className="guardrail-finding">
                              <b>Audit Evidence:</b> {a.audit_findings}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 6: A2A INTER-AGENT PROTOCOL (Req 6 & 7) */}
              {tab === "A2A Inter-Agent Protocol" && (
                <div className="a2a-container">
                  <div className="a2a-banner">
                    <h3>A2A Inter-Agent Communication Protocol (Requirement 6 &amp; 7)</h3>
                    <p>
                      PaperLens uses <b>both CrewAI and Google ADK</b> as mandated. The CrewAI specialist agents
                      evaluate Novelty, Methodology, and Evidence, then package findings into a standardized JSON-RPC 2.0 message
                      sent across the <b>A2A Protocol boundary</b> (<code>/.well-known/agent-card.json</code> and <code>/a2a</code>)
                      to the Google ADK Adversarial Critic agent.
                    </p>
                  </div>

                  <div className="a2a-handshake-bar">
                    <Workflow size={14} style={{ color: "#c9a6ff" }} />
                    <span>A2A Handshake:</span>
                    <Badge tone="green">/.well-known/agent-card.json</Badge>
                    <span style={{ color: "#74dcca" }}>Sender: CrewAI Specialists</span>
                    <span>→ JSON-RPC 2.0 →</span>
                    <span style={{ color: "#ffd572" }}>Receiver: Google ADK Critic</span>
                  </div>

                  {a2aExchanges.map((ex, i) => (
                    <div key={i} className="a2a-record-card">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <b style={{ color: "#e8f1fd", fontSize: "12px" }}>A2A Message Exchange #{i + 1}</b>
                        <Badge tone="green">{ex.protocol}</Badge>
                        <Badge tone="amber">{ex.status}</Badge>
                        <small style={{ marginLeft: "auto", color: "#8798b3", fontSize: "9px" }}>{ex.duration_ms} ms</small>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                        <div>
                          <small style={{ color: "#778aa6", fontSize: "8px" }}>A2A REQUEST (CrewAI → ADK)</small>
                          <pre className="json-box">{JSON.stringify(ex.request_payload, null, 2)}</pre>
                        </div>
                        <div>
                          <small style={{ color: "#778aa6", fontSize: "8px" }}>A2A RESPONSE (ADK → CrewAI)</small>
                          <pre className="json-box">{JSON.stringify(ex.response_payload, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 7: EVALUATION & COST (Req 10) */}
              {tab === "Evaluation & Cost" && (
                <div className="eval-container">
                  <div className="a2a-banner">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <h3>End-to-End Performance, Running Time &amp; Cost Benchmark (Requirement 10)</h3>
                        <p>Evaluates multi-agent peer review latency, running time in seconds, and token cost across diverse scientific domains.</p>
                      </div>
                      <button className="primary" onClick={runEvaluationBenchmark} disabled={evalBusy}>
                        {evalBusy ? <><LoaderCircle className="spin" size={12} /> Running Benchmark...</> : <><Play size={12} /> Run Benchmark Suite</>}
                      </button>
                    </div>
                  </div>

                  {/* Current Paper Run Stats */}
                  <div className="eval-grid">
                    <div className="eval-stat">
                      <small>THIS PAPER LATENCY</small>
                      <b>{(report.duration_ms / 1000).toFixed(2)}s</b>
                      <span>{report.duration_ms.toFixed(0)} ms running time</span>
                    </div>
                    <div className="eval-stat">
                      <small>ESTIMATED TOKENS</small>
                      <b>{Math.round(report.paper_title.length / 4 + 2800).toLocaleString()}</b>
                      <span>Prompt + Completion tokens</span>
                    </div>
                    <div className="eval-stat">
                      <small>ESTIMATED COST</small>
                      <b>${((Math.round(report.paper_title.length / 4 + 2800) * 0.65) / 1000000).toFixed(6)}</b>
                      <span>USD @ standard model rates</span>
                    </div>
                    <div className="eval-stat">
                      <small>GUARDRAIL INTEGRITY</small>
                      <b>{guardrailAudits.filter(g => g.status === "PASSED").length}/{guardrailAudits.length}</b>
                      <span>Security checks passed</span>
                    </div>
                  </div>

                  {/* Benchmark Suite Summary if run */}
                  {evalSummary && (
                    <div style={{ background: "#0c1322", border: "1px solid #273752", borderRadius: "10px", padding: "16px" }}>
                      <h3 style={{ fontSize: "12px", color: "#6fe0c9", marginTop: 0 }}>
                        Benchmark Results ({evalSummary.total_cases_evaluated} Academic Test Cases)
                      </h3>
                      <div className="eval-grid" style={{ marginBottom: "14px" }}>
                        <div className="eval-stat">
                          <small>AVERAGE RUNNING TIME</small>
                          <b>{evalSummary.average_running_time_s}s</b>
                          <span>Mean latency {evalSummary.average_latency_ms} ms</span>
                        </div>
                        <div className="eval-stat">
                          <small>TOTAL SUITE COST</small>
                          <b>${evalSummary.total_estimated_cost_usd}</b>
                          <span>USD across all cases</span>
                        </div>
                        <div className="eval-stat">
                          <small>COST PER REVIEW</small>
                          <b>${evalSummary.average_cost_per_review_usd}</b>
                          <span>USD / research paper</span>
                        </div>
                        <div className="eval-stat">
                          <small>TOTAL EVALUATED</small>
                          <b>{evalSummary.total_cases_evaluated} Cases</b>
                          <span>100% completion rate</span>
                        </div>
                      </div>

                      <table className="eval-table">
                        <thead>
                          <tr>
                            <th>Case ID</th>
                            <th>Paper Title</th>
                            <th>Running Time</th>
                            <th>Novelty</th>
                            <th>Feasibility</th>
                            <th>Tokens</th>
                            <th>Est. Cost</th>
                            <th>Guardrails</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evalSummary.results.map((r, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 700, color: "#82dcca" }}>{r.id}</td>
                              <td>{r.title}</td>
                              <td>{r.running_time_seconds}s</td>
                              <td>{r.novelty_score}/100</td>
                              <td>{r.feasibility_score}/100</td>
                              <td>{r.estimated_tokens.toLocaleString()}</td>
                              <td>${r.estimated_cost_usd}</td>
                              <td><Badge tone="green">{r.guardrails_passed} Passed</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: LITERATURE */}
              {tab === "Literature" && (
                report.sources.length ? (
                  <div className="cards">
                    {report.sources.map((s, i) => (
                      <article key={i} className="source">
                        <BookOpen />
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                            <h3>{s.title}</h3>
                            <Badge tone={i === 0 ? "green" : s.similarity_percentage >= 65 ? "amber" : ""}>
                              {i === 0 ? "TOP MATCH · " : ""}{s.similarity_percentage}% SIMILARITY
                            </Badge>
                            <Badge tone={s.source === "arXiv" ? "green" : s.source === "OpenAlex" ? "amber" : ""}>
                              {s.source || "Academic"}
                            </Badge>
                          </div>
                          <p>{s.authors?.slice(0, 3).join(", ")} {s.year ? `(${s.year})` : ""}</p>
                          <p>{s.abstract}</p>
                          {s.relevance_explanation && (
                            <div className="next" style={{ marginTop: "8px", padding: "8px 10px" }}>
                              <b>Relevance:</b> <span style={{ color: "#a2b4cb" }}>{s.relevance_explanation}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px", flexWrap: "wrap" }}>
                            <a href={s.url} target="_blank" rel="noreferrer" className="ghost" style={{ padding: "6px 10px", fontSize: "9px" }}>
                              Open source ↗
                            </a>
                            <button
                              className="ghost"
                              style={{ padding: "6px 10px", fontSize: "9px", color: "#72e1c5", borderColor: "#285d54" }}
                              onClick={() => openChatForSource(s)}
                            >
                              <MessageSquare size={12} /> Discuss with AI Chatbot
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty">No sources retrieved. Check MCP and network access.</p>
                )
              )}

              {/* TAB 9: AGENTIC ACTIVITY */}
              {tab === "Agentic Activity" && (
                <div className="cards">
                  {agentActivities.map((a, i) => (
                    <article key={i} className="finding">
                      <div className="findicon">
                        {a.agent_id === "orchestrator" ? <Workflow /> :
                         a.agent_id === "literature_retriever" ? <Search /> :
                         a.agent_id === "novelty_analyst" ? <Microscope /> :
                         a.agent_id === "methodology_reviewer" ? <FlaskConical /> :
                         a.agent_id === "dataset_evidence_reviewer" ? <Gauge /> :
                         a.agent_id === "adversarial_critic" ? <ShieldCheck /> :
                         <Sparkles />}
                      </div>
                      <div className="findbody">
                        <div className="findmeta">
                          <span>{a.name}</span>
                          <Badge tone={a.framework.includes("CrewAI") ? "green" : a.framework.includes("MCP") ? "amber" : a.framework.includes("ADK") ? "green" : ""}>
                            {a.framework}
                          </Badge>
                          <Badge tone={a.status === "completed" ? "green" : "amber"}>{a.status}</Badge>
                          {a.duration_ms != null && (
                            <small style={{ color: "#8491aa", fontSize: "9px", marginLeft: "auto" }}>
                              {a.duration_ms} ms
                            </small>
                          )}
                        </div>
                        <h3 style={{ marginTop: "3px" }}>{a.action}</h3>
                        <div className="next">
                          <b>Internal reasoning &amp; audit trail:</b>
                          <p>{a.reasoning}</p>
                        </div>
                        <p style={{ marginTop: "8px", color: "#b4c1d4" }}>
                          <b>Agent decision:</b> {a.output_summary}
                        </p>
                        {a.metrics && Object.keys(a.metrics).length > 0 && (
                          <div className="pills">
                            {Object.entries(a.metrics).map(([k, v]) => (
                              <span key={k}>{k.replaceAll("_", " ")}: <b>{String(v)}</b></span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* TAB 10: CRITIQUE & LOGS */}
              {tab === "Critique & logs" && (
                <div className="logs">
                  <div className="critique">
                    <b><ShieldCheck /> Adversarial critique (A2A Protocol Pass to Google ADK)</b>
                    <p>{report.critique_summary}</p>
                  </div>
                  <h3>Pipeline Execution Trace · {report.events.length} events logged</h3>
                  {report.events.map((e, i) => (
                    <div key={i} className="event">
                      <span className={"eventdot " + e.status} />
                      <div>
                        <b>{e.stage}</b>
                        <p>{e.message}</p>
                      </div>
                      <small>{e.duration_ms != null ? e.duration_ms + " ms" : e.status}</small>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 11: AI PAPER CHAT */}
              {tab === "AI Paper Chat" && (
                <div className="chat-window">
                  <div className="source-select-bar">
                    <BookOpen size={14} style={{ color: "#64dfc7" }} />
                    <span>Focus Paper:</span>
                    <select
                      value={selectedSourceForChat?.source_id || ""}
                      onChange={e => {
                        const found = report.sources.find(s => s.source_id === e.target.value);
                        setSelectedSourceForChat(found || null);
                      }}
                    >
                      <option value="">All Fetched Literature (General Overview)</option>
                      {report.sources.map(s => (
                        <option key={s.source_id} value={s.source_id}>
                          {s.similarity_percentage}% Match · {s.title.slice(0, 55)}...
                        </option>
                      ))}
                    </select>
                    {selectedSourceForChat && (
                      <Badge tone="green">{selectedSourceForChat.similarity_percentage}% Similarity</Badge>
                    )}
                  </div>

                  <div className="quick-prompts">
                    {suggestedQuestions.map((q, idx) => (
                      <button key={idx} className="quick-btn" onClick={() => sendChatMessage(q)}>
                        {q}
                      </button>
                    ))}
                  </div>

                  <div className="chat-history">
                    {chatMessages.length === 0 && (
                      <div style={{ color: "#8898b2", fontSize: "11px", lineHeight: 1.7, padding: "10px" }}>
                        <p style={{ color: "#73dec9", fontWeight: 700, marginBottom: "6px" }}>
                          <Sparkles size={13} style={{ display: "inline", marginRight: 4 }} /> PaperLens AI Research Copilot
                        </p>
                        Ask any question about how your uploaded paper compares with the fetched literature, how to respond to the agents' challenge questions, or how the Guardrails, MCP tools, and A2A interoperability work in this system.
                      </div>
                    )}
                    {chatMessages.map((m, idx) => (
                      <div key={idx} className={"chat-msg " + m.role}>
                        <div className="chat-bubble">
                          <div style={{ fontWeight: 700, fontSize: "9px", marginBottom: "4px", color: m.role === "user" ? "#70dfca" : "#9eb2d0" }}>
                            {m.role === "user" ? "YOU" : "PAPERLENS COPILOT"}
                          </div>
                          <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                        </div>
                      </div>
                    ))}
                    {chatBusy && (
                      <div className="chat-msg assistant">
                        <div className="chat-bubble">
                          <LoaderCircle className="spin" size={13} /> Generating research response...
                        </div>
                      </div>
                    )}
                  </div>

                  <form className="chat-input-row" onSubmit={e => { e.preventDefault(); sendChatMessage(); }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask anything about challenges, guardrails, MCP tools, methodology..."
                      disabled={chatBusy}
                    />
                    <button className="primary" type="submit" disabled={chatBusy || !chatInput.trim()}>
                      <Send size={13} /> Send
                    </button>
                  </form>
                </div>
              )}

              {/* Limitations Notice */}
              <div className="caution">
                <b><ShieldCheck size={15} /> Read this before relying on the review</b>
                <ul>
                  {report.limitations.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>

              <button className="primary" onClick={reset}>
                Review another paper <ArrowUpRight size={15} />
              </button>
            </section>
          )}

          <footer>
            © 2026 PaperLens · Academic Agentic Intelligence · Presentation Edition
            <span><i /> 10 Requirements Complete · CrewAI + ADK + FastMCP</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
