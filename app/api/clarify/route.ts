import { NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";

export const runtime = "nodejs";

type ReqBody = {
  prompt: string;
  gradeLevel?: string;
  language?: string;
  teacherSafe?: boolean;
};

function extractFirstTextItem(message: any): string | null {
  // Cohere v2 chat: message.content is typically an array of items.
  // Some items may be "thinking" without a text field.
  const content = message?.content;
  if (!Array.isArray(content)) return null;

  for (const item of content) {
    if (item && typeof item.text === "string" && item.text.trim().length > 0) {
      return item.text;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;

    const prompt = body.prompt?.trim() ?? "";
    const gradeLevel = body.gradeLevel ?? "High school";
    const language = body.language ?? "Other";
    const teacherSafe = body.teacherSafe ?? true;

    if (prompt.length < 20) {
      return NextResponse.json({ error: "Prompt too short" }, { status: 400 });
    }

    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing COHERE_API_KEY" }, { status: 500 });
    }

    const cohere = new CohereClientV2({ token: apiKey });

    const systemPrompt = `
You are an educational assistant that clarifies assignment prompts.

You DO NOT generate final solutions (no finished code, no full essays).
Instead you:
- clarify requirements
- extract deliverables
- list constraints
- propose planning steps
- generate a submission checklist
- list questions to ask the teacher
- warn about common pitfalls

Return ONLY valid JSON (no markdown, no extra text).
`.trim();

    const userPrompt = `
Generate a JSON object with EXACTLY these keys:

summary_plain (string)
requirements (string[])
deliverables (string[])
constraints (string[])
step_by_step_plan (string[])
checklist (string[])
questions_for_teacher (string[])
common_pitfalls (string[])

Assignment prompt:
"""
${prompt}
"""

Context:
- Grade level: ${gradeLevel}
- Language/subject: ${language}
- Teacher-safe mode: ${teacherSafe}

Rules:
- Arrays must contain short bullet-style strings.
- Extract explicit requirements/deliverables/constraints from the prompt when possible.
- If something is ambiguous, add it to questions_for_teacher.
`.trim();

    const response = await cohere.chat({
      model: "command-a-03-2025",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // ✅ correct property name for the SDK typings
      responseFormat: { type: "json_object" },
    });

    // ✅ robust extraction across union content item types
    const text = extractFirstTextItem(response.message);

    if (!text) {
      return NextResponse.json({ error: "Empty response from Cohere" }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Very rare with responseFormat, but good to have a helpful error
      return NextResponse.json(
        { error: "Model did not return valid JSON", raw: text.slice(0, 500) },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}