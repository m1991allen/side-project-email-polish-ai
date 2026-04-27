---
name: nextjs-16-docs-first
description: Consult node_modules/next/dist/docs/ before writing any Next.js code in this repo. Use when editing anything under src/app/, touching routing, caching, fetching, metadata, middleware, or config.
---

## Overview

This repo pins Next.js 16.2.3 and React 19.2.4. Both shipped breaking changes likely inconsistent with training-data memory. The authoritative source is the Next.js docs bundled inside `node_modules/next/dist/docs/` (sections `01-app`, `02-pages`, `03-architecture`, `04-community`). Never write Next 16 code from memory — open the local docs first.

## When to Use

Trigger before any of:
- Editing or creating files in `src/app/` (routes, layouts, pages, route handlers, metadata).
- Using `fetch`, `cache`, `revalidate`, `headers()`, `cookies()`, `draftMode()`, `unstable_*` APIs.
- Drawing a new Server / Client Component boundary (`"use client"`).
- Touching `next.config.ts`, middleware, image optimization, or font loading.
- Bumping the `next` dependency.

Skip for: pure TypeScript utility modules, pure Tailwind class edits, third-party library code that does not import `next/*`.

## Process

1. Identify the concept being touched: routing, caching, streaming, metadata, middleware, image, font, etc.
2. `ls node_modules/next/dist/docs/01-app/` and drill into the sub-folder that matches the concept.
3. Read the specific doc file end-to-end. Note the exact section heading you will rely on.
4. Grep the installed types for deprecations: `grep -rn "@deprecated" node_modules/next/dist/ | head -20`. Cross-check any API you intend to call.
5. Only then write the code. In the commit body / PR description, cite the doc path you followed (e.g. `per node_modules/next/dist/docs/01-app/.../route-handlers.md`).

## Rationalizations

- "I remember how Next 14 did it" — Next 16 changed defaults around caching, dynamic params (Promise-wrapped), and route segment config. Memory is stale.
  **Why:** silent behavior changes don't produce TypeScript errors. You will ship a bug.
  **How to apply:** treat memory as a hypothesis, the local docs as ground truth.
- "There are blog posts about this" — Most public tutorials target Next ≤ 15.
  **Why:** you're more likely to cargo-cult a deprecated pattern from Google than from `node_modules`.
- "It compiled, so it works" — Deprecated APIs still compile.
  **Why:** compilation checks types, not semantics or upgrade safety.

## Red Flags

- Copying a pattern from another Next.js project without opening the local docs.
- Using `export const dynamic`, `revalidate`, or `fetchCache` without verifying current semantics in the installed docs.
- Typing `params: { id: string }` instead of `params: Promise<{ id: string }>` in a route segment.
- Importing from a path (`next/…`) that does not exist under `node_modules/next/`.
- A PR that edits `src/app/**` with no doc reference in the description.

## Verification

- [ ] Named the exact doc file(s) consulted, with paths under `node_modules/next/dist/docs/`.
- [ ] `grep -n "@deprecated"` was run against the APIs touched; no deprecated calls remain.
- [ ] `npm run build` passes with no Next.js deprecation warnings in the output.
- [ ] `npm run lint` is clean.
- [ ] The implementation mirrors current doc examples, not historical ones.
