import { useState, useRef, useEffect, Fragment } from "react";
import {
  BarChart3,
  Heart,
  Leaf,
  Route,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useProfiles } from "../lib/profileContext";

/** One message in the session-only conversation. */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  source?: string;
  isError?: boolean;
}

/** The four starter cards — each fires a canned AirAware question on click. */
const STARTERS: {
  key: string;
  title: string;
  desc: string;
  question: string;
  Icon: typeof BarChart3;
}[] = [
  {
    key: "scales",
    title: "AQI Scales",
    desc: "NAQI & US EPA",
    question: "Explain the Indian NAQI and US EPA air quality scales",
    Icon: BarChart3,
  },
  {
    key: "health",
    title: "Health & Gear",
    desc: "Precautions & masks",
    question: "What health precautions and protective gear should I use on poor air days?",
    Icon: Heart,
  },
  {
    key: "lifestyle",
    title: "Daily Lifestyle",
    desc: "Commute & habits",
    question: "Give me daily lifestyle tips to reduce air exposure on my commute.",
    Icon: Route,
  },
  {
    key: "nature",
    title: "Nature & Future",
    desc: "Eco actions",
    question: "What sustainable actions help improve air quality and support nature?",
    Icon: Leaf,
  },
];

/**
 * Render a chat line with light **bold** emphasis preserved. Splits on
 * newlines first, then on balanced ** pairs, so the deterministic and AI
 * answers read as tidy lists with bolded lead-ins.
 */
function renderRich(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={j} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={j}>{part}</Fragment>
        ),
      )}
      {i < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

export function AskAirAware() {
  const { activeProfile } = useProfiles();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const newId = () => {
    idRef.current += 1;
    return `m-${idRef.current}`;
  };

  // Keep the newest bubble (or the typing dots) in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const userMsg: Message = { id: newId(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setPending(true);

    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787/api";
    try {
      const resp = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          profile: activeProfile
            ? {
                name: activeProfile.name,
                age: activeProfile.age,
                lifestyle: activeProfile.lifestyle,
                health_conditions: activeProfile.health_conditions ?? [],
              }
            : null,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error ? `Request failed: ${data.error}` : `Service error ${resp.status}`);
      }

      const assistantMsg: Message = {
        id: newId(),
        role: "assistant",
        content: String(data.response ?? "I couldn't answer that one — try a different question."),
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : undefined,
        source: typeof data.source === "string" ? data.source : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: `I couldn't reach the air-quality assistant just now. ${msg}`,
          isError: true,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setDraft("");
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && !m.isError);
  const lastSuggestions = lastAssistant?.suggestions ?? [];
  const hasConversation = messages.length > 0 || pending;

  return (
    <div>
      {/* Header: Playfair heading + tailored-for pill */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-deep-pine)] text-[var(--color-warm-dawn)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="font-display text-3xl tracking-tight text-[var(--color-deep-pine)]">
              Ask AirAware
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Ask anything about air quality, health, and living greener — answers are grounded in
            the latest data and tailored to your profile.
          </p>
        </div>
        <span className="glass-panel inline-flex items-center gap-1.5 self-start rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--color-deep-pine)] sm:self-auto">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-warm-dawn)]" />
          Tailored for {activeProfile?.name ?? "You"}
        </span>
      </div>

      {/* Conversation card */}
      <div className="glass-panel flex h-[68vh] min-h-[460px] flex-col overflow-hidden rounded-2xl p-4 sm:p-5">
        {!hasConversation ? (
          /* Empty state: the four starter cards */
          <div className="flex flex-1 flex-col">
            <p className="mb-4 text-center text-sm font-medium text-slate-500">
              Where would you like to start?
            </p>
            <div className="grid flex-1 grid-cols-2 content-start gap-3 lg:grid-cols-4">
              {STARTERS.map((s, i) => (
                <button
                  key={s.key}
                  onClick={() => void send(s.question)}
                  className="card-lift glass-panel-solid press-soft animate-card-rise flex flex-col items-start gap-2 rounded-xl p-4 text-left active:scale-[0.98]"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-sky-soft)] text-[var(--color-sky-accent)]">
                    <s.Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-deep-pine)]">
                    {s.title}
                  </span>
                  <span className="text-xs text-slate-500">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active conversation */
          <>
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Conversation
              </span>
              <button
                onClick={clearChat}
                className="press-soft flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-white/60 hover:text-[var(--color-deep-pine)] active:scale-[0.98]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Chat
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`animate-card-rise flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%] ${
                      m.role === "user"
                        ? "bg-[var(--color-deep-pine)] text-[var(--color-misty-alabaster)]"
                        : m.isError
                          ? "border border-red-200 bg-red-50 text-red-700"
                          : "glass-panel text-slate-700"
                    }`}
                  >
                    {renderRich(m.content)}
                    {m.role === "assistant" && m.source && !m.isError && (
                      <span className="mt-1.5 block text-[10px] uppercase tracking-wider text-slate-400">
                        {m.source === "ai" ? "AI + Rules" : "Rules-based"}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {pending && (
                <div className="animate-card-rise flex justify-start">
                  <div className="glass-panel flex items-center gap-1.5 rounded-2xl px-4 py-3">
                    <span className="chat-dot" style={{ animationDelay: "0ms" }} />
                    <span className="chat-dot" style={{ animationDelay: "150ms" }} />
                    <span className="chat-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Follow-up suggestions from the last answer */}
            {lastSuggestions.length > 0 && !pending && (
              <div className="flex flex-wrap gap-2 pt-3">
                {lastSuggestions.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => void send(sug)}
                    className="press-soft rounded-full border border-[var(--color-sage-border)] bg-white/60 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-white active:scale-[0.98]"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Responsive input bar */}
            <div className="pt-3">
              <div className="glass-panel flex items-center gap-2 rounded-xl p-1.5">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(draft);
                    }
                  }}
                  placeholder="Ask about air quality, health, or living greener…"
                  aria-label="Ask AirAware a question"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={() => void send(draft)}
                  disabled={pending || draft.trim().length === 0}
                  aria-label="Send"
                  className="press-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-deep-pine)] text-[var(--color-warm-dawn)] transition-colors hover:bg-[var(--color-deep-pine-soft)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
