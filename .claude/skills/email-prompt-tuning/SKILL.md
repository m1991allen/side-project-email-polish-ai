---
name: email-prompt-tuning
description: Safely modify the polishing prompt, add or remove tones, or change output constraints. Use when editing the system prompt in src/app/api/generate/route.ts or the TONE_OPTIONS array in src/app/page.tsx.
---

## Overview

Prompt, tone list, and UI copy must stay aligned across three surfaces:

- `src/app/page.tsx` — `TONE_OPTIONS` array (source of truth) and the `<select>` UI.
- `src/app/api/generate/route.ts` — `toneInstruction` branches and `systemPrompt`.
- `src/hooks/useEmailCompletion.ts` — passes `tone` opaquely; usually no change, but re-read before editing.

Breaking alignment is silent: the user picks a tone, the server defaults to "professional", output looks wrong, nothing errors.

## When to Use

- Adding, renaming, or removing a tone.
- Changing output constraints (subject-line policy, length cap, formality).
- Shifting target language (currently zh → en).
- Adding prompt variables (recipient name, urgency, signature).
- Swapping the model.

## Process

1. **Decide the canonical tone list.** `TONE_OPTIONS[].value` in `page.tsx` is the source of truth. The `Tone` type is already derived from it — keep that derivation.
2. **Map every tone on the server.** Update the `toneInstruction` chain so EVERY value in `TONE_OPTIONS` has an explicit branch. Once you hit 3+ tones, convert the ternary chain to a `Record<Tone, string>` lookup:
   ```ts
   const TONE_INSTRUCTION: Record<Tone, string> = { … };
   const toneInstruction = TONE_INSTRUCTION[tone] ?? TONE_INSTRUCTION.professional;
   ```
3. **Edit `systemPrompt` as a bulleted rule list**, not prose. Keep the `Output ONLY the email body` rule — the UI renders `completion` with `whitespace-pre-wrap` and no markdown parser, so any preamble leaks into the output box verbatim.
4. **Keep model and hero copy in sync.** If you change `gemini-2.0-flash`, also update the "Powered by Gemini 2.0 Flash" badge in `page.tsx`.
5. **Sanity-test every tone** with the same input draft. Eyeball the outputs for drift — prompt tweaks often shift length and register more than expected.
6. **Thread new fields end-to-end.** If you add a `recipient` prop: UI input → `handleSubmit` → hook body → server validation → prompt template. Stop at the first missing link and you ship a half-wired field.

## Rationalizations

- "The server defaults to 'professional' for unknown tones, so missing a branch is harmless" —
  **Why:** silent defaulting is the exact bug this skill exists to prevent. The user picks "urgent" and gets "professional" with no warning.
  **How to apply:** make unknown tones a 400 error in dev, or use an exhaustive `Record<Tone, string>` that fails type-check on missing keys.
- "Prompt text doesn't need testing" —
  **Why:** small wording changes ("be concise" → "be brief", adding "use bullet points") materially shift output length and format.
  **How to apply:** spot-check 2–3 drafts per tone after any prompt edit.
- "UI copy can drift from behavior" —
  **Why:** the hero claims "Powered by Gemini 2.0 Flash", feature pills say "API key stays on server", the Pro card says "Unlimited emails" — these are user-facing contracts, not decoration.
  **How to apply:** if behavior changes, walk the UI and update every affected string.

## Red Flags

- A `TONE_OPTIONS` value with no matching server branch.
- System prompt missing the `Output ONLY the email body` rule — outputs will include `"Subject: …\n\nHere's your email:"` as if it were body text.
- Tone list hardcoded in two places.
- Model constant diverges from the hero "Powered by …" badge.
- New field added to the request body but no UI control to produce it.

## Verification

- [ ] Every tone in the `<select>` produces visibly different output for the same draft.
- [ ] No tone falls through to the default branch unintentionally (log the tone in dev to check).
- [ ] Output never starts with "Here's your email:" or similar framing text.
- [ ] Hero copy and feature pills still match the current model and behavior.
- [ ] `npm run build` and `npm run lint` clean.
