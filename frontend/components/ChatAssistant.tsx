"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Business } from "@/lib/api";

// ── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  businesses?: Business[];
  suggestions?: string[];
  timestamp: Date;
}

interface ChatResponse {
  reply: string;
  businesses: Business[];
  intent: string;
  suggestions: string[];
}

// ── Tiny markdown-to-JSX renderer ─────────────────────────────────────────
function RenderMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part.split("\n\n").map((block, j) => (
          <span key={j}>{block}{j < part.split("\n\n").length - 1 ? <><br /><br /></> : null}</span>
        ))}</span>;
      })}
    </>
  );
}

// ── Mini Business Card inside chat ─────────────────────────────────────────
function ChatBizCard({ biz }: { biz: Business }) {
  const stars = Math.round(biz.stars);
  const emoji =
    biz.primary_category?.toLowerCase().includes("cafe") ? "☕" :
    biz.primary_category?.toLowerCase().includes("pizza") ? "🍕" :
    biz.primary_category?.toLowerCase().includes("italian") ? "🍝" :
    biz.primary_category?.toLowerCase().includes("japanese") ? "🍣" :
    biz.primary_category?.toLowerCase().includes("bar") ? "🍺" :
    biz.primary_category?.toLowerCase().includes("bakery") ? "🥐" : "🍽️";

  return (
    <div
      style={{
        background: "var(--bg-card-high)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "0.55rem 0.8rem",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        transition: "border-color 0.2s",
        cursor: "default",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-light)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div style={{
        width: "30px", height: "30px", borderRadius: "6px", flexShrink: 0,
        background: "var(--bg-card-highest)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px",
      }}>
        {emoji}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px", fontFamily: "'DM Sans', sans-serif" }}>
          {biz.name}
        </div>
        <div style={{ fontSize: "0.67rem", color: "var(--text-secondary)", marginTop: "1px" }}>
          <span style={{ color: "var(--amber)" }}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
          {" "}{biz.stars.toFixed(1)} · {biz.area}
        </div>
      </div>
      {biz.is_successful === 1 && (
        <div style={{ marginLeft: "auto", fontSize: "0.6rem", background: "var(--teal-alpha)", color: "var(--teal)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: "20px", padding: "2px 7px", flexShrink: 0 }}>
          Top
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: "5px", height: "5px", borderRadius: "50%",
          background: "var(--indigo)",
          animation: `chatDot 1.3s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── QUICK PROMPTS ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "Find Italian restaurants near Indiranagar",
  "What are the trending cafes this week?",
  "Should I open a Japanese restaurant in Koramangala?",
  "How many pizza places are there in Whitefield?",
  "Show me restaurants similar to Olive Garden",
];

// ── Main ChatAssistant ───────────────────────────────────────────────────────
export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "👋 Hi! I'm your **BLR Intel AI Assistant**.\n\nAsk me to find restaurants, discover trending spots, or get market insights for business owners!",
      suggestions: QUICK_PROMPTS.slice(0, 3),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: ChatResponse = await res.json();

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: data.reply || "Here's what I found:",
        businesses: data.businesses,
        suggestions: data.suggestions,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "⚠️ Couldn't connect to the backend. Make sure the server is running on port 8000.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* ── Inline keyframes ── */}
      <style>{`
        @keyframes chatDot {
          0%, 60%, 100% { opacity: 0.25; transform: scale(0.85); }
          30% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes chatPanelIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatBubbleIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .chat-chip:hover {
          background: var(--indigo-alpha) !important;
          border-color: rgba(124,106,247,0.35) !important;
          color: var(--indigo) !important;
        }
        .chat-send-btn:hover {
          background: var(--indigo-dim) !important;
          transform: translateY(-1px);
        }
        .chat-fab:hover {
          background: var(--indigo-dim) !important;
          transform: translateY(-2px) !important;
        }
      `}</style>

      {/* ── Floating Action Button ── */}
      <button
        className="chat-fab"
        onClick={() => setOpen(v => !v)}
        title="AI Assistant"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 1000,
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "var(--indigo)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(124,106,247,0.35), 0 2px 6px rgba(0,0,0,0.3)",
          transition: "all 0.2s ease",
        }}
        id="chat-fab-btn"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div
          id="chat-panel"
          style={{
            position: "fixed",
            bottom: "90px",
            right: "28px",
            zIndex: 999,
            width: "min(400px, calc(100vw - 56px))",
            height: "min(580px, calc(100vh - 130px))",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-low)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            boxShadow: "0 20px 48px rgba(0,0,0,0.5)",
            animation: "chatPanelIn 0.2s ease forwards",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "0.9rem 1.1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            background: "var(--bg-card)",
            flexShrink: 0,
          }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "var(--indigo)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", flexShrink: 0,
            }}>💬</div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                BLR Intel AI
              </div>
              <div style={{ fontSize: "0.67rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--teal)", display: "inline-block" }} />
                Online
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                animation: "chatBubbleIn 0.22s ease forwards",
              }}>
                {/* Bubble */}
                <div style={{
                  maxWidth: "88%",
                  padding: "0.6rem 0.85rem",
                  borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  background: msg.role === "user" ? "var(--indigo)" : "var(--bg-card)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  fontSize: "0.84rem",
                  lineHeight: 1.55,
                  color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                }}>
                  <RenderMarkdown text={msg.text} />
                </div>

                {/* Inline business cards */}
                {msg.businesses && msg.businesses.length > 0 && (
                  <div style={{
                    maxWidth: "92%",
                    marginTop: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                    width: "100%",
                  }}>
                    {msg.businesses.slice(0, 5).map(biz => (
                      <ChatBizCard key={biz.business_id} biz={biz} />
                    ))}
                    {msg.businesses.length > 5 && (
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", paddingLeft: "4px" }}>
                        + {msg.businesses.length - 5} more results
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestion chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{
                    maxWidth: "92%",
                    marginTop: "0.5rem",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.4rem",
                  }}>
                    {msg.suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="chat-chip"
                        onClick={() => sendMessage(s)}
                        style={{
                          background: "var(--bg-card-highest)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                          borderRadius: "20px",
                          padding: "4px 11px",
                          fontSize: "0.71rem",
                          cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 500,
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                animation: "chatBubbleIn 0.2s ease forwards",
              }}>
                <div style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px 12px 12px 4px",
                  padding: "0.6rem 0.85rem",
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding: "0.75rem 0.9rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            background: "var(--bg-card)",
            flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              id="chat-input"
              style={{
                flex: 1,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.55rem 0.85rem",
                fontSize: "0.84rem",
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "Inter, sans-serif",
                transition: "border-color 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--indigo)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
              placeholder="Ask about restaurants, trends, or insights…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              id="chat-send-btn"
              className="chat-send-btn"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: "36px", height: "36px",
                borderRadius: "8px",
                background: input.trim() ? "var(--indigo)" : "var(--bg-card-high)",
                border: "none",
                cursor: input.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s, transform 0.15s",
                opacity: loading ? 0.5 : 1,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
