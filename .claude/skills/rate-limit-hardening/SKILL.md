---
name: rate-limit-hardening
description: Replace the in-memory Map rate limiter in src/app/api/generate/route.ts with Upstash Redis. Use before any production deploy, when changing the limit, adding per-user limits, or adding a Pro-tier bypass.
---

## Overview

`src/app/api/generate/route.ts` currently uses a module-level `Map<string, { count, resetAt }>`. This is correct in `next dev` (single process) but incorrect the moment the route runs on more than one serverless instance: each instance holds its own Map, so the effective limit multiplies by the instance count. The comment `// For production, use Upstash Redis` already flags this.

## When to Use

- Before the first production deploy.
- When changing `RATE_LIMIT` or `RATE_WINDOW_MS`.
- When moving from per-IP to per-user limiting.
- When adding a Pro tier that bypasses the limit (see `lemon-squeezy-wiring`).

## Process

1. **Provision Upstash Redis** (free tier is enough). Capture `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
2. **Document the env vars.** Add both to `.env.example` (blank) and `.env.local` (real values). Add to the deploy platform's env settings.
3. **Install** `@upstash/ratelimit` and `@upstash/redis`.
4. **Swap the limiter.** Replace `rateLimitMap`, `checkRateLimit`, and the inline check in `POST` with:
   ```ts
   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(RATE_LIMIT, "1 m"),
   });
   const { success, remaining } = await ratelimit.limit(ip);
   ```
   Keep the response contract identical — 429, JSON `{ error: "Rate limit exceeded. Please wait 1 minute." }`, header `X-RateLimit-Remaining`. The client and UI must not change.
5. **Preserve IP extraction.** Keep the existing chain: `x-forwarded-for` (first entry, trimmed) → `x-real-ip` → `"unknown"`. Verify your deploy platform's forwarded-IP semantics before trusting these headers.
6. **Pro bypass (if applicable).** If a Pro auth check exists, short-circuit the limiter before calling Redis — don't waste a Redis round-trip for paid users.
7. **Delete dead code.** Remove the old `rateLimitMap`, `checkRateLimit`, and unused constants. `grep -r rateLimitMap src/` must return nothing.

## Rationalizations

- "In-memory is fine for a soft launch" —
  **Why:** the moment Vercel spins up a second Lambda (which happens under almost any load), your effective limit doubles. It's a correctness bug, not a scale concern.
  **How to apply:** harden before first deploy, not after.
- "I'll add Redis later" —
  **Why:** "later" is after a user finds they can burst by hitting different edge regions.
  **How to apply:** this is a deploy blocker, not a nice-to-have.
- "Just raise `RATE_LIMIT`" —
  **Why:** hides the bug, doesn't fix it. Multi-instance skew still exists.

## Red Flags

- Production deploy with the module-level `Map` still present.
- Hardcoded Upstash credentials anywhere in source.
- Dropping the `X-RateLimit-Remaining` header — keep the contract stable even if the client currently ignores it.
- Changing the 429 JSON shape — `useEmailCompletion` reads `data.error`.
- Calling `await ratelimit.limit(ip)` after starting `streamText`.

## Verification

- [ ] 6 requests in one minute from one IP → 6th returns 429 with the expected JSON.
- [ ] Restart the dev server; a previously limited IP is still limited until the sliding window expires. Proves Redis, not memory.
- [ ] `grep -r "rateLimitMap\|checkRateLimit" src/` returns nothing.
- [ ] `.env.example` documents both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- [ ] `npm run build` passes.
