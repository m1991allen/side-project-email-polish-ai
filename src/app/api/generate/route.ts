import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

// Simple in-memory rate limiter (per IP, resets on server restart)
// For production, use Upstash Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

export async function POST(req: NextRequest) {
  // Get client IP for rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please wait 1 minute." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { draft, tone } = await req.json();

  if (!draft || typeof draft !== "string" || draft.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Draft is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured on server." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const google = createGoogleGenerativeAI({ apiKey });

  const toneInstruction =
    tone === "formal"
      ? "very formal and conservative"
      : tone === "friendly"
      ? "professional yet warm and friendly"
      : "professional and polite";

  const systemPrompt = `You are an expert business email writer.
Your task is to transform a rough Chinese draft into a polished, ${toneInstruction} English business email.

Rules:
- Output ONLY the email body (Subject line optional if appropriate)
- Use proper business email structure
- Be concise and clear
- Maintain the original intent but elevate the language
- Do not add any explanation or commentary outside the email itself`;

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: systemPrompt,
    prompt: `Transform this Chinese draft into a professional English business email:\n\n${draft}`,
  });

  return result.toTextStreamResponse({
    headers: {
      "X-RateLimit-Remaining": String(remaining),
    },
  });
}
