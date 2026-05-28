"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getVagabondMockData, type Stop } from "@/lib/mock/vagabond-data";
import { buildTripContext } from "./build-trip-context";
import { streamAssistantReply } from "./stream-assistant";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Why is Weatherford tight?",
  "Propose a fallback for day 2",
  "Re-time the customer demo to give 30m slack",
  "Where can I add a sunset stop without breaking the schedule?",
] as const;

export function PlannerAssistant({
  stops,
  selectedId,
}: {
  stops: Stop[];
  selectedId: string;
  setSelected: (id: string) => void;
}) {
  const D = getVagabondMockData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, busy]);

  const tripContext = useMemo(
    () => buildTripContext(D, stops, selectedId),
    [D, stops, selectedId],
  );

  const send = async (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content || busy) return;
    setDraft("");
    setError(null);

    const conversation: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...conversation, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      await streamAssistantReply(conversation, tripContext, (chunk) => {
        setMessages((cur) => {
          if (cur.length === 0) return cur;
          const last = cur[cur.length - 1];
          if (last.role !== "assistant") return cur;
          const next = cur.slice();
          next[next.length - 1] = { role: "assistant", content: last.content + chunk };
          return next;
        });
      });
    } catch (e) {
      setMessages(conversation);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const showThinking =
    busy && (messages.length === 0 || messages[messages.length - 1]?.role !== "assistant");

  return (
    <div className="assistant">
      <div className="assistant-head">
        <div>
          <div className="micro" style={{ marginBottom: 2 }}>
            Assistant{" "}
            <span
              className="mono"
              style={{ textTransform: "none", letterSpacing: 0, color: "var(--color-text-faint)" }}
            >
              · claude-haiku-4-5
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-soft)" }}>
            Trip-aware. <span className="mono" style={{ fontSize: 11 }}>{stops.length} stops</span> &middot;{" "}
            <span className="mono" style={{ fontSize: 11 }}>{D.trip.meetings} meetings</span> in context.
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            className="btn-sm ghost"
            style={{ fontSize: 11 }}
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="assistant-scroll" ref={scrollerRef}>
        {messages.length === 0 && (
          <div className="assistant-empty">
            <p style={{ margin: "0 0 12px", color: "var(--color-text-soft)", fontSize: 13, lineHeight: 1.55 }}>
              Ask about timing, fallbacks, or what&rsquo;s risky on this route. The trip plan above is loaded into
              context on every turn.
            </p>
            <div className="assistant-chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="assistant-chip" onClick={() => send(s)} disabled={busy}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`msg msg-${m.role}`}>
            {m.role === "assistant" && <div className="msg-byline">Assistant</div>}
            <div className="msg-body">{m.content}</div>
          </div>
        ))}

        {showThinking && (
          <div className="msg msg-assistant">
            <div className="msg-byline">Assistant</div>
            <div className="msg-body thinking">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {error && (
          <div className="msg msg-error">
            <div className="msg-byline">Error</div>
            <div className="msg-body">{error}</div>
          </div>
        )}
      </div>

      <form
        className="assistant-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          rows={2}
          placeholder="Ask the assistant…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={busy}
        />
        <div className="assistant-input-foot">
          <span className="micro" style={{ color: "var(--color-text-faint)" }}>
            <span className="mono" style={{ textTransform: "none", letterSpacing: 0 }}>
              shift
            </span>
            +
            <span className="mono" style={{ textTransform: "none", letterSpacing: 0 }}>
              return
            </span>{" "}
            for newline
          </span>
          <button type="submit" className="btn-sm" disabled={busy || !draft.trim()}>
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
