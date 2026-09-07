import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getCurrentUserId } from "@/lib/session";
import { getAnthropicClient, buildUserContext, ASSISTANT_MODEL, ASSISTANT_SYSTEM_PROMPT } from "@/lib/anthropic";

// V3: AI planning assistant hook — chat endpoint, grounded in the user's real data
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getAnthropicClient();
  if (!client) {
    return NextResponse.json(
      { error: "not_configured", message: "AI assistant not configured. Set ANTHROPIC_API_KEY to enable it." },
      { status: 200 }
    );
  }

  const body = await req.json();
  const messages: { role: "user" | "assistant"; content: string }[] = body.messages || [];
  if (!messages.length) return NextResponse.json({ error: "No messages provided" }, { status: 400 });

  const { snapshot } = await buildUserContext(userId);

  try {
    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 1024,
      system: `${ASSISTANT_SYSTEM_PROMPT}\n\nUSER DATA SNAPSHOT:\n${snapshot}`,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return NextResponse.json({ role: "assistant", content: text });
  } catch (err: any) {
    return NextResponse.json({ error: "assistant_error", message: err?.message || "Assistant request failed" }, { status: 502 });
  }
}
