type ChatMessage = { role: "user" | "assistant"; content: string };

function parseSsePayload(raw: string): string | { error: string } {
  const parsed: unknown = JSON.parse(raw);
  if (parsed && typeof parsed === "object" && "error" in parsed) {
    const err = (parsed as { error: unknown }).error;
    return { error: typeof err === "string" ? err : "Stream failed" };
  }
  if (typeof parsed === "string") return parsed;
  return "";
}

/** POST /api/assistant and invoke onToken for each streamed text delta. */
export async function streamAssistantReply(
  messages: ChatMessage[],
  tripContext: string,
  onToken: (chunk: string) => void,
): Promise<void> {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, tripContext }),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      const text = await res.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error("No response body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith("data: ")) continue;
      const payload = parseSsePayload(line.slice(6));
      if (typeof payload === "object" && "error" in payload) {
        throw new Error(payload.error);
      }
      if (payload) onToken(payload);
    }
  }
}
