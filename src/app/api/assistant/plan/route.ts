import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getCurrentUserId } from "@/lib/session";
import { getAnthropicClient, buildUserContext, ASSISTANT_MODEL, ASSISTANT_SYSTEM_PROMPT } from "@/lib/anthropic";

// V3: AI planning assistant hook — structured "today's plan" generation
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getAnthropicClient();
  if (!client) {
    return NextResponse.json(
      { error: "not_configured", message: "AI assistant not configured. Set ANTHROPIC_API_KEY to enable it." },
      { status: 200 }
    );
  }

  const { snapshot } = await buildUserContext(userId);

  const instructions = `Using the user data snapshot, produce a suggested plan for today. Respond with ONLY a JSON object (no prose, no markdown fences) matching exactly this shape:
{
  "priorities": ["string", "string", "string"],
  "timeBlocks": [{"start": "HH:MM", "end": "HH:MM", "label": "string"}],
  "note": "one short encouraging or observational sentence, never judgmental"
}
"priorities" must be at most 3 short, concrete items drawn from the user's real open tasks/goals — these will pre-fill their 3 daily priorities. "timeBlocks" should be a realistic, humane schedule for the rest of today given existing events. Keep it simple.`;

  try {
    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 1024,
      system: `${ASSISTANT_SYSTEM_PROMPT}\n\nUSER DATA SNAPSHOT:\n${snapshot}`,
      messages: [{ role: "user", content: instructions }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!parsed) throw new Error("Could not parse plan response");

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: "assistant_error", message: err?.message || "Plan generation failed" }, { status: 502 });
  }
}
