import connectDb from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type ChatRole = "user" | "delivery_boy";

const GEMINI_MODELS = ["gemini-3-flash-preview"];

function normalizeSuggestions(text: string) {
  return text
    .split(/[\n,]+/)
    .map((item) => item.trim().replace(/^[-*\d.)\s]+/, ""))
    .filter(Boolean)
    .slice(0, 3);
}

async function getGeminiSuggestions(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  let lastError = "Unknown Gemini error";

  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    const rawText = await response.text();
    let data: unknown = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        lastError = "Gemini returned invalid JSON";
        continue;
      }
    }

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof data.error === "object" &&
        data.error !== null &&
        "message" in data.error &&
        typeof data.error.message === "string"
          ? data.error.message
          : `Gemini request failed with status ${response.status}`;

      lastError = message;
      continue;
    }

    const text =
      typeof data === "object" &&
      data !== null &&
      "candidates" in data &&
      Array.isArray(data.candidates)
        ? data.candidates[0]?.content?.parts
            ?.map((part: { text?: string }) => part.text ?? "")
            .join(", ")
        : "";

    const suggestions = normalizeSuggestions(text ?? "");

    if (suggestions.length === 3) {
      return { suggestions, model };
    }

    lastError = "Gemini returned incomplete suggestions";
  }

  throw new Error(lastError);
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { message, role } = (await req.json()) as {
      message?: string | string[];
      role?: ChatRole;
    };

    const recentMessages = Array.isArray(message)
      ? message.map((item) => item.trim()).filter(Boolean)
      : [message?.trim()].filter(Boolean);

    if (recentMessages.length === 0) {
      return NextResponse.json(
        { message: "Message is required." },
        { status: 400 },
      );
    }

    const safeRole: ChatRole = role === "user" ? "user" : "delivery_boy";
    const prompt = `You are a delivery chat assistant for a grocery delivery app.

You will be given:
- role: either "user" or "delivery_boy"
- recent chat context: the latest messages in the conversation

Your task:
- If role is "user", generate 3 short WhatsApp-style replies that a customer could send.
- If role is "delivery_boy", generate 3 short WhatsApp-style replies that a delivery agent could send.

Rules:
- Replies must match the delivery context closely.
- Sound like real delivery updates, not general chat.
- Focus on arrival time, location, calling, handoff, delay, OTP, or order status when relevant.
- Do not invent names, personal details, or unrelated facts.
- Do not answer like a random assistant or chatbot.
- Keep replies short and human-like, max 12 words.
- Use at most one emoji per reply.
- No numbering and no extra explanation.
- Return only three comma-separated suggestions.

Role: ${safeRole}
Recent chat context:
${recentMessages.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;

    try {
      const result = await getGeminiSuggestions(prompt);
      return NextResponse.json(
        { suggestions: result.suggestions, source: result.model },
        { status: 200 },
      );
    } catch (error) {
      return NextResponse.json(
        {
          message:
            error instanceof Error ? error.message : "Gemini unavailable",
        },
        { status: 503 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to generate suggestions",
      },
      { status: 500 },
    );
  }
}
