---
name: rate-limit-hardening
description: 把 src/app/api/generate/route.ts 中那個 in-memory Map 速率限制器,換成 Upstash Redis。在任何 production 部署之前、變更上限、加入 per-user 限制、或加入 Pro 層 bypass 時使用。
---

## 概觀

`src/app/api/generate/route.ts` 目前使用模組層級的 `Map<string, { count, resetAt }>`。在 `next dev`(單一 process)中是正確的,但只要該路由跑在多個 serverless instance 上,就立刻錯了:每個 instance 各自持有自己的 Map,實際上限會等於上限 × instance 數。原始碼裡的 `// For production, use Upstash Redis` 註解早就標記了這件事。

## 何時使用

- 第一次 production 部署之前。
- 變更 `RATE_LIMIT` 或 `RATE_WINDOW_MS` 時。
- 從 per-IP 改為 per-user 限制時。
- 加入會 bypass 上限的 Pro 層時(見 `lemon-squeezy-wiring`)。

## 流程

1. **開通 Upstash Redis**(免費層就夠)。抓下 `UPSTASH_REDIS_REST_URL` 與 `UPSTASH_REDIS_REST_TOKEN`。
2. **記錄環境變數。** 兩者都要加進 `.env.example`(留空)與 `.env.local`(真實值)。並在部署平台的環境設定中加入。
3. **安裝** `@upstash/ratelimit` 與 `@upstash/redis`。
4. **抽換限制器。** 用以下程式取代 `rateLimitMap`、`checkRateLimit`、以及 `POST` 中的 inline 檢查:
   ```ts
   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(RATE_LIMIT, "1 m"),
   });
   const { success, remaining } = await ratelimit.limit(ip);
   ```
   保持回應契約完全相同 — 429、JSON `{ error: "Rate limit exceeded. Please wait 1 minute." }`、header `X-RateLimit-Remaining`。Client 與 UI 不可變動。
5. **保留 IP 抽取邏輯。** 維持既有鏈條:`x-forwarded-for`(取第一筆,trim) → `x-real-ip` → `"unknown"`。在信任這些 header 之前,先確認部署平台的 forwarded-IP 語意。
6. **Pro bypass(若適用)。** 若已存在 Pro 驗證檢查,要在呼叫 Redis 之前 short-circuit 掉限制器 — 不要為付費使用者浪費一次 Redis 往返。
7. **刪除死碼。** 移除舊的 `rateLimitMap`、`checkRateLimit` 與不再使用的常數。`grep -r rateLimitMap src/` 必須沒有任何輸出。

## 常見的合理化藉口

- 「軟啟動階段 in-memory 沒問題」 —
  **為什麼:** Vercel 在幾乎任何負載下都會啟動第二個 Lambda,這一刻你的實質上限就翻倍。這是**正確性**的 bug,不是 scale 的考量。
  **如何套用:** 在第一次部署前就硬化,而不是部署後。
- 「我之後再加 Redis」 —
  **為什麼:**「之後」就是某個使用者發現可以打不同 edge region 來爆量之後。
  **如何套用:** 這是部署的 blocker,不是 nice-to-have。
- 「把 `RATE_LIMIT` 拉高就好」 —
  **為什麼:** 這是把 bug 蓋掉,不是修掉。Multi-instance 偏差仍然存在。

## 警訊

- Production 部署時模組層級的 `Map` 還在。
- 原始碼任何位置硬編碼 Upstash 憑證。
- 拿掉 `X-RateLimit-Remaining` header — 即使 client 目前沒讀,也要保持契約穩定。
- 改變 429 JSON 形狀 — `useEmailCompletion` 會讀 `data.error`。
- 在 `streamText` 啟動之後才呼叫 `await ratelimit.limit(ip)`。

## 驗證

- [ ] 同一 IP 在一分鐘內送出 6 個請求 → 第 6 個回 429 與預期的 JSON。
- [ ] 重啟 dev server;一個之前被限流的 IP 在 sliding window 結束前仍然被限流。這證明用的是 Redis 而非記憶體。
- [ ] `grep -r "rateLimitMap\|checkRateLimit" src/` 沒有任何輸出。
- [ ] `.env.example` 文件化了 `UPSTASH_REDIS_REST_URL` 與 `UPSTASH_REDIS_REST_TOKEN`。
- [ ] `npm run build` 通過。
