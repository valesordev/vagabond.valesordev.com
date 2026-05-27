"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getVagabondMockData, type Stop } from "@/lib/mock/vagabond-data";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STUB_REPLY = "[AI assistant not yet configured — see Story 13 for wiring]";

async function completeAssistant(_prompt: string): Promise<string> {
  return STUB_REPLY;
}

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

  const tripContext = useMemo(() => {
    const t = D.trip;
    const lines: string[] = [];
    lines.push(`Trip: ${t.name} (${t.id}) — ${t.window}`);
    lines.push(
      `Route: ${t.totalMiles} mi, ${t.driveHours}h drive over ${t.campNights + 1} days; crosses ${t.crossesTz}.`,
    );
    lines.push("");
    lines.push("Stops:");
    stops.forEach((s) => {
      const meet = s.meetings
        ? ` — meetings: ${s.meetings.map((m) => `${m.title} ${m.homeTime} (${m.duration}m, ${m.connectivity})`).join("; ")}`
        : "";
      const buf =
        s.preBufferMargin != null
          ? ` — slack pre +${s.preBufferMargin}m / post +${s.postBufferMargin}m (${s.feasible})`
          : "";
      const fb = s.fallback ? ` — fallback: ${s.fallback.name} (${s.fallback.note})` : "";
      lines.push(
        `- [${s.kind}] ${s.name} @ ${s.loc}${s.arrival ? ` — arr ${s.arrival}, dep ${s.departure || ""}` : ""}${meet}${buf}${fb}`,
      );
    });
    lines.push("");
    lines.push(`Currently selected stop: ${selectedId}`);
    lines.push("");
    const tb = D.money.tripBudget;
    lines.push(`Monetary budget: $${tb.total} planned over 3 days (currency: ${D.money.currency}).`);
    lines.push(
      `By category: ${tb.categories
        .filter((c) => c.planned > 0)
        .map((c) => `${c.label} $${c.planned}`)
        .join(", ")}.`,
    );
    lines.push(
      `Pre-trip spend already on card: $${tb.preTripSpend.reduce((a, tx) => a + tx.amount, 0).toFixed(2)} (${tb.preTripSpend.length} charges).`,
    );
    return lines.join("\n");
  }, [stops, selectedId, D]);

  const send = async (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content || busy) return;
    setDraft("");
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);
    try {
      const reply = await completeAssistant(tripContext);
      setMessages((cur) => [...cur, { role: "assistant", content: reply.trim() }]);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [
    "Why is Weatherford tight?",
    "Propose a fallback for day 2",
    "Re-time the customer demo to give 30m slack",
    "Where can I add a sunset stop without breaking the schedule?",
  ];

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
              {suggestions.map((s) => (
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

        {busy && (
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
