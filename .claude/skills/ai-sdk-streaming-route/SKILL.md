---
name: ai-sdk-streaming-route
description: Add or modify a streaming AI route backed by @ai-sdk/google + Vercel AI SDK streamText. Use when editing src/app/api/generate/route.ts or creating another POST route that streams model output to the client.
---

## Overview

The project exposes one AI endpoint at `src/app/api/generate/route.ts` that wraps `streamText` from the `ai` package around Gemini 2.0 Flash via `@ai-sdk/google`. The matching client consumer is `src/hooks/useEmailCompletion.ts`, which reads raw UTF-8 chunks produced by `result.toTextStreamResponse()`. Server and client stream protocols must match or the UI silently displays nothing.

## When to Use

- Changing model, provider, prompt, or request schema in `route.ts`.
- Adding a new request field beyond `draft` and `tone`.
- Creating a second streaming route (e.g. `/api/summarize`, `/api/translate`).
- Migrating stream protocol (text stream ↔ data stream).

## Process

1. **Pick the stream protocol and commit to it on both ends.**
   - Current choice: `result.toTextStreamResponse()` = plain UTF-8 chunks; client reads via `reader.read()` + `TextDecoder`.
   - If you switch to `toDataStreamResponse()`, rewrite the client decode loop in `useEmailCompletion.ts` to parse the SSE-like framing.
2. **Validate inputs first.** Reject missing / wrong-typed fields with HTTP 400 and JSON body `{ error: string }`. The hook reads `data.error` on non-OK responses — any other shape surfaces as "Request failed (400)".
3. **Enforce rate limit before the model call.** See `rate-limit-hardening`. Return 429 + `{ error }` JSON. Never start a stream for a denied request.
4. **Read env inside the handler**, not at module top level: `const apiKey = process.env.GEMINI_API_KEY`. Return 500 + `{ error }` JSON if missing. Top-level reads break Next build pre-render.
5. **Build `systemPrompt` and user `prompt` separately.** Keep tone selection exhaustive — every value in the client `TONE_OPTIONS` must have a `toneInstruction` branch (see `email-prompt-tuning`).
6. **Return `result.toTextStreamResponse({ headers })`.** Do not `await` the stream server-side. Preserve the `X-RateLimit-Remaining` header.
7. **Test the stream.** `curl -N` should show progressive chunks; the UI should show the "Polishing…" dots then text filling in word by word.

## Rationalizations

- "I'll just await the text and return JSON" —
  **Why:** you lose the UX the hook was built for; "Polishing…" will hang until the full response is ready.
  **How to apply:** always stream. If you need the full text for logging, do it in a background callback, not by awaiting before responding.
- "Throwing is fine for validation errors" —
  **Why:** an uncaught throw returns a Next error page (HTML). The hook tries `res.json()` on failure and falls back to a generic message — the real error never reaches the user.
  **How to apply:** return a `Response` with `{ error }` JSON and an appropriate status code.
- "I'll add the new tone server-side only" —
  **Why:** the `<select>` in `src/app/page.tsx` is the only way users send a tone. Server-only tones are dead code.
  **How to apply:** add to `TONE_OPTIONS` first, then the server branch.

## Red Flags

- Mixing `toTextStreamResponse` on the server with data-stream parsing on the client (or vice versa).
- Reading env vars at module scope.
- Starting `streamText` before the rate-limit check.
- Returning non-JSON error bodies.
- Adding a request-body field the client never sends (or vice versa).
- `await`ing the stream before returning.

## Verification

- [ ] `curl -N -X POST http://localhost:3000/api/generate -H 'Content-Type: application/json' -d '{"draft":"你好","tone":"professional"}'` prints multiple chunks, not one blob.
- [ ] `curl -X POST … -d '{}'` returns HTTP 400 with `{"error":"..."}`.
- [ ] Sixth rapid request from one IP returns HTTP 429 with `{"error":"..."}`.
- [ ] UI at `/` shows the loading dots then progressive text.
- [ ] `npm run build` passes.
