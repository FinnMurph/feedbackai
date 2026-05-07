import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Lock, BookOpen, ChevronRight, LayoutGrid, Type, BookMarked, Lightbulb, X } from "lucide-react";
import { api } from "../hooks/useApi";

/* ── Rubric color map ─────────────────────────────────────────── */
const RUBRIC_COLORS = {
  Organization: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: LayoutGrid },
  Clarity:      { color: "#8b5cf6", bg: "rgba(99,102,241,0.08)", icon: Type },
  Evidence:     { color: "#059669", bg: "rgba(5,150,105,0.08)",  icon: BookMarked },
  "Critical Thinking": { color: "#d97706", bg: "rgba(217,119,6,0.08)", icon: Lightbulb },
};

function RubricTag({ rubric }) {
  const r = RUBRIC_COLORS[rubric];
  if (!r) return null;
  const Icon = r.icon;
  return (
    <span className="rubric-tag" style={{ background: r.bg, color: r.color }}>
      <Icon size={12} /> Rubric: {rubric}
    </span>
  );
}

/* ── Suggestion chips (context-aware) ─────────────────────────── */
function getChips(lastRubric) {
  if (lastRubric === "Organization") return ["How about my transitions?", "Should I restructure?", "Check my evidence next"];
  if (lastRubric === "Clarity") return ["Is my thesis direct enough?", "Any jargon to simplify?", "Now review my sources"];
  if (lastRubric === "Evidence") return ["What databases should I check?", "Is one source enough?", "Review my critical thinking"];
  if (lastRubric === "Critical Thinking") return ["What counterarguments exist?", "Am I being too one-sided?", "Go back to structure"];
  return ["Review my structure", "Is my thesis clear?", "What sources should I add?"];
}

/* ── Rubric Modal ─────────────────────────────────────────────── */
function RubricModal({ areas, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Assignment Rubric</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="modal-desc">
          Each piece of AI feedback maps to one of these four criteria. Your instructor uses this rubric to evaluate your work.
        </p>
        {areas.map((area) => {
          const rc = RUBRIC_COLORS[area.key] || {};
          const Icon = rc.icon || Sparkles;
          return (
            <div key={area.key} className="rubric-card" style={{ background: rc.bg, border: `1.5px solid ${rc.color}20` }}>
              <div className="rubric-card-header">
                <span className="rubric-card-name" style={{ color: rc.color }}>
                  <Icon size={16} /> {area.key}
                </span>
                <span className="rubric-card-weight" style={{ background: rc.bg, color: rc.color }}>
                  {area.weight}%
                </span>
              </div>
              <p className="rubric-card-desc">{area.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Assignments ──────────────────────────────────────────────── */
const ASSIGNMENTS = [
  { title: "Product Roadmap Essay", due: "Feb 15", status: "In Progress", statusClass: "in-progress", active: true },
  { title: "Market Research Report", due: "Feb 22", status: "Awaiting Feedback", statusClass: "awaiting", active: false },
  { title: "UX Wireframe Project", due: "Mar 1", status: "Not Started", statusClass: "not-started", active: false },
];

/* ── Main Component ───────────────────────────────────────────── */
export default function StudentView() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi Finn! I'm here to help you improve your essay. I've reviewed the rubric for this assignment. Would you like feedback on a specific section, or should I analyze what you have so far?", rubric: null, flagged: false },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paragraphs, setParagraphs] = useState([]);
  const [rubricAreas, setRubricAreas] = useState([]);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [showRubric, setShowRubric] = useState(false);
  const [lastRubric, setLastRubric] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.getHighlights().then((d) => {
      setParagraphs(d.paragraphs);
      setRubricAreas(d.rubric_areas);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const resp = await api.sendMessage(text.trim(), history);
      const aiMsg = { role: "assistant", text: resp.text, rubric: resp.rubric, flagged: resp.flagged };
      setMessages((prev) => [...prev, aiMsg]);
      setLastRubric(resp.rubric);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong. Please try again.", rubric: null, flagged: false }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleHighlightClick = (highlight) => {
    setActiveHighlight(highlight);
    sendMessage(`Can you give me feedback on the ${highlight.rubric} aspect of this passage?`);
  };

  const chips = getChips(lastRubric);

  return (
    <>
      {showRubric && <RubricModal areas={rubricAreas} onClose={() => setShowRubric(false)} />}

      <div className="student-view">
        {/* ── Left Sidebar ── */}
        <div className="sidebar">
          <div className="sidebar-label">My Assignments</div>
          {ASSIGNMENTS.map((a, i) => (
            <div key={i} className={`assignment-card ${a.active ? "active" : ""}`}>
              <div className="assignment-card-title">{a.title}</div>
              <div className="assignment-card-meta">
                <span className="assignment-card-due">Due {a.due}</span>
                <span className={`status-badge ${a.statusClass}`}>{a.status}</span>
              </div>
            </div>
          ))}

          <div className="sidebar-actions">
            <div className="sidebar-label">Quick Actions</div>
            <button className="btn-primary" onClick={() => sendMessage("Can you review my full draft?")}>
              Request Feedback
            </button>
            <button className="btn-secondary" onClick={() => setShowRubric(true)}>
              <BookOpen size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
              View Rubric
            </button>
          </div>
        </div>

        {/* ── Center: Document Panel ── */}
        <div className="document-panel">
          <div className="document-header">
            <div>
              <h2 className="document-title">Product Roadmap Essay</h2>
              <span className="document-meta">Due Feb 15, 2026 · Draft</span>
            </div>
            <span className="rubric-active-badge">
              <Sparkles size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
              Rubric Active
            </span>
          </div>

          <div className="essay-body">
            {paragraphs.map((para) => (
              <p key={para.id}>
                {para.highlights.length > 0 ? (
                  <>
                    {para.text.slice(0, para.highlights[0].start)}
                    <span
                      className={`highlight ${activeHighlight === para.highlights[0] ? "active" : ""}`}
                      onClick={() => handleHighlightClick(para.highlights[0])}
                      title={`Click for ${para.highlights[0].rubric} feedback`}
                      style={activeHighlight === para.highlights[0] ? {
                        borderBottomColor: RUBRIC_COLORS[para.highlights[0].rubric]?.color
                      } : undefined}
                    >
                      {para.text.slice(para.highlights[0].start, para.highlights[0].end)}
                    </span>
                    {para.text.slice(para.highlights[0].end)}
                  </>
                ) : para.text}
              </p>
            ))}
          </div>

          <div className="feedback-banner">
            <span className="feedback-banner-icon">💡</span>
            <div>
              <div className="feedback-banner-title">AI Feedback Available</div>
              <div className="feedback-banner-text">
                Click highlighted passages for rubric-aligned feedback, or ask questions in the chat panel.
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Chat Panel ── */}
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-avatar">AI</div>
            <div className="chat-header-text">
              <h3>Feedback Assistant</h3>
              <span>Rubric-aligned suggestions</span>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role === "user" ? "user" : "ai"}`}>
                {msg.role === "assistant" && <div className="chat-message-avatar">AI</div>}
                <div className={`chat-bubble ${msg.role === "user" ? "user" : "ai"}`}>
                  {msg.text}
                  {msg.rubric && <div><RubricTag rubric={msg.rubric} /></div>}
                  {msg.flagged && (
                    <div className="flag-notice">⚠ This interaction has been flagged for instructor review</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message ai">
                <div className="chat-message-avatar">AI</div>
                <div className="chat-bubble ai">
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-chips">
            {chips.map((chip) => (
              <button key={chip} className="chip" onClick={() => sendMessage(chip)}>{chip}</button>
            ))}
          </div>

          <div className="chat-transparency">
            <Lock size={10} /> Conversations are logged and reviewable by your instructor
          </div>

          <div className="chat-input-area">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Ask for feedback or clarification..."
              disabled={loading}
            />
            <button className="chat-send" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
