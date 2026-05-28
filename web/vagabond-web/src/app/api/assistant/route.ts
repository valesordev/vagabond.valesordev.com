import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";

export const runtime = "nodejs";

const MODEL = "claude-haiku-4-5";

const SYSTEM_PROMPT =
  "You are the Vagabond trip co-pilot — a concise, calm assistant for a self-hosted RV trip planner. Reply in short, plain sentences. Surface concrete suggestions and tradeoffs over generic advice. When numbers help, use them. Do not invent stops that aren't in the trip; you can propose alternatives, but flag them as proposals.";

type ChatMessage = { role: "user" | "assistant"; content: string };

type AssistantRequest = {
  messages?: ChatMessage[];
  tripContext?: string;
};

function buildAnthropicMessages(tripContext: string, messages: ChatMessage[]): MessageParam[] {
  const out: MessageParam[] = [];
  let snapshotMerged = false;

  for (const m of messages) {
    if (m.role === "user" && !snapshotMerged) {
      out.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `== Trip snapshot ==\n${tripContext}`,
            cache_control: { type: "ephemeral" },
          },
          { type: "text", text: m.content },
        ],
      });
      snapshotMerged = true;
      continue;
    }
    out.push({ role: m.role, content: m.content });
  }

  return out;
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: { code: "ASSISTANT_ERROR", message } }, { status });
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse("ANTHROPIC_API_KEY is not set. Add it to .env for the planner assistant.", 503);
  }

  let body: AssistantRequest;
  try {
    body = (await req.json()) as AssistantRequest;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { tripContext, messages } = body;
  if (!tripContext || typeof tripContext !== "string") {
    return errorResponse("tripContext is required", 400);
  }
  if (
    !Array.isArray(messages) ||
    messages.some((m) => m.role !== "user" && m.role !== "assistant") ||
    messages.some((m) => typeof m.content !== "string")
  ) {
    return errorResponse("messages must be { role: user|assistant, content: string }[]", 400);
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: buildAnthropicMessages(tripContext, messages),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const token = event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(token)}\n\n`));
            }
          }
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream failed";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assistant request failed";
    return errorResponse(message, 502);
  }
}
