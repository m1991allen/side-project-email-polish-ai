---
name: lemon-squeezy-wiring
description: Replace the PricingModal placeholder checkout URL with a real Lemon Squeezy integration — checkout link, webhook verification, persisted Pro status, and rate-limit bypass. Use when moving from demo to paid product.
---

## Overview

`src/components/PricingModal.tsx` links to `https://YOUR_STORE.lemonsqueezy.com/checkout/buy/YOUR_PRODUCT_ID` — a literal placeholder. The rate limiter has no concept of Pro users. Wiring Lemon Squeezy has four parts: real checkout URL, webhook → persistence, Pro gating in the API route, and UI copy that no longer lies about limits.

## When to Use

- First paid launch.
- Pricing changes (currently $9.9/mo in `PricingModal.tsx` and the hero CTA banner in `page.tsx`).
- Adding annual plan, coupon, or additional tiers.
- Migrating to another processor — reuse this checklist as a structure.

## Process

1. **Create the product in Lemon Squeezy.** Capture: store subdomain, product ID, variant ID, webhook signing secret, test-mode API key.
2. **Document env vars in all three places** — blank in `.env.example`, real in `.env.local`, real in the deploy platform:
   - `LEMONSQUEEZY_STORE_SUBDOMAIN`
   - `LEMONSQUEEZY_VARIANT_ID`
   - `LEMONSQUEEZY_WEBHOOK_SECRET`
   - `LEMONSQUEEZY_API_KEY` (if generating signed URLs server-side)
3. **Build the checkout URL server-side.** Do not expose env vars to the client bundle. Either:
   - Pass the URL as a prop from a Server Component parent into `PricingModal`, or
   - Add `src/app/api/checkout/route.ts` returning a 307 redirect to the signed Lemon Squeezy URL, and point the modal's button at that route.
4. **Replace the placeholder `<a>` in `PricingModal.tsx`.** Preserve `target="_blank"` and `rel="noopener noreferrer"`.
5. **Add the webhook endpoint** at `src/app/api/webhook/lemonsqueezy/route.ts`:
   - Read the raw body (not `req.json()` — you need the exact bytes for HMAC).
   - Verify HMAC-SHA256 against `LEMONSQUEEZY_WEBHOOK_SECRET`. Reject mismatches with 401.
   - Handle at minimum: `subscription_created`, `subscription_updated`, `subscription_cancelled`.
6. **Pick a persistence layer and commit.** Vercel KV, Upstash Redis, Supabase — pick one. Minimum schema: `{ email, status: 'active' | 'cancelled', current_period_end, lemon_subscription_id }`. No in-memory, no localStorage.
7. **Gate Pro in `src/app/api/generate/route.ts`.** You need auth — decide the scheme (magic link, Clerk, NextAuth, or a signed cookie set after checkout). Without auth, you cannot identify the requester, so the bypass cannot exist. Plan auth before wiring payments.
8. **Update UI copy.** For Pro users, the "Free tier: 5 requests/minute" caption and the hero CTA banner must change. Feature pills should reflect reality (e.g. remove "5/min" once Pro is active).
9. **Cancellation path.** `subscription_cancelled` webhook → flip status to `cancelled`. Next request from that user falls back to the free limiter.

## Rationalizations

- "I'll just paste the URL and ship" —
  **Why:** you ship with no way to fulfill the subscription. Users pay and nothing happens.
  **How to apply:** webhook + persistence is not optional — it's the core of the product.
- "Webhook signature check is optional for now" —
  **Why:** anyone can POST a fake `subscription_created` to your public endpoint and self-grant Pro access.
  **How to apply:** no webhook ships without signature verification. Ever.
- "Pro status in a client cookie is good enough" —
  **Why:** trivially tampered with. Pro becomes free-for-all.
  **How to apply:** server-side truth only; the client reads derived state.

## Red Flags

- Any of `YOUR_STORE`, `YOUR_PRODUCT_ID`, `YOUR_VARIANT_ID` still in source.
- Webhook route without HMAC verification.
- Pro status read from an unsigned client cookie or localStorage.
- `LEMONSQUEEZY_*` env vars missing from `.env.example`.
- Rate limiter still 429-ing authenticated Pro users.
- UI still advertising "5/min" to Pro users after upgrade.

## Verification

- [ ] `grep -r "YOUR_STORE\|YOUR_PRODUCT_ID\|YOUR_VARIANT_ID" src/` returns nothing.
- [ ] Clicking "Get Pro" opens the real Lemon Squeezy checkout for this store and variant.
- [ ] Completing a test-mode checkout fires the webhook and persists an `active` row.
- [ ] Tampered webhook body (flipped byte) returns HTTP 401.
- [ ] A Pro user can burst past 5 requests/minute.
- [ ] Cancelling in the Lemon Squeezy dashboard flips status; the next request falls back to free.
- [ ] Free-tier UI copy still accurate; Pro-tier UI copy reflects no rate cap.
