---
name: ai-sdk-streaming-route
description: 新增或修改以 @ai-sdk/google + Vercel AI SDK streamText 為基礎的串流 AI 路由。當你要編輯 src/app/api/generate/route.ts 或建立另一個會把模型輸出串流到 client 的 POST 路由時使用。
---

## 概觀

本專案在 `src/app/api/generate/route.ts` 暴露唯一的 AI 端點,該檔以 `ai` 套件的 `streamText` 包裝 `@ai-sdk/google` 提供的 Gemini 2.0 Flash。對應的 client 消費者是 `src/hooks/useEmailCompletion.ts`,它讀取由 `result.toTextStreamResponse()` 產生的原始 UTF-8 chunks。Server 與 client 的串流協定必須一致,否則 UI 會無聲地什麼都不顯示。

## 何時使用

- 在 `route.ts` 變更模型、provider、prompt 或請求 schema。
- 加入超出 `draft` 與 `tone` 之外的新請求欄位。
- 建立第二個串流路由(例如 `/api/summarize`、`/api/translate`)。
- 遷移串流協定(text stream ↔ data stream)。

## 流程

1. **挑選一種串流協定,並在 server 與 client 兩端統一遵守。**
   - 目前選擇:`result.toTextStreamResponse()` = 純 UTF-8 chunks;client 透過 `reader.read()` + `TextDecoder` 讀取。
   - 若改用 `toDataStreamResponse()`,必須改寫 `useEmailCompletion.ts` 的 client 解碼迴圈以解析類 SSE 的 framing。
2. **先驗證輸入。** 對缺漏或型別錯誤的欄位以 HTTP 400 + JSON `{ error: string }` 拒絕。當回應非 OK 時,hook 會讀取 `data.error`,任何其他形狀都會被吞成「Request failed (400)」。
3. **在呼叫模型之前先執行速率限制。** 詳見 `rate-limit-hardening`。回傳 429 + `{ error }` JSON。絕對不要為被拒絕的請求啟動串流。
4. **在 handler 內部讀取環境變數**,而不是模組頂層:`const apiKey = process.env.GEMINI_API_KEY`。若缺漏則回 500 + `{ error }` JSON。在頂層讀取會破壞 Next 的 build pre-render。
5. **將 `systemPrompt` 與使用者 `prompt` 分開組裝。** Tone 對應要窮舉 — client 中 `TONE_OPTIONS` 的每個值都必須在 server 有對應的 `toneInstruction` 分支(見 `email-prompt-tuning`)。
6. **回傳 `result.toTextStreamResponse({ headers })`。** 不要在 server 端 `await` 整個串流。保留 `X-RateLimit-Remaining` header。
7. **測試串流。** `curl -N` 應該看到逐步出現的 chunks;UI 應該先顯示「Polishing…」的點點,然後文字一個字一個字出現。

## 常見的合理化藉口

- 「我直接 await 整段文字然後回 JSON 就好」 —
  **為什麼:** 你會失去 hook 為此打造的 UX;「Polishing…」會卡住直到完整回應就緒。
  **如何套用:** 一律串流。如果你需要完整文字做 logging,請在背景 callback 處理,不要在回應前 await。
- 「驗證錯誤直接 throw 沒問題」 —
  **為什麼:** 未捕捉的 throw 會回傳 Next 的錯誤頁面(HTML)。Hook 在失敗時嘗試 `res.json()` 並 fallback 為通用訊息 — 真正的錯誤永遠不會傳到使用者眼前。
  **如何套用:** 回傳一個帶有 `{ error }` JSON 與適當 status code 的 `Response`。
- 「我只在 server 端加新 tone 就好」 —
  **為什麼:** `src/app/page.tsx` 的 `<select>` 是使用者送出 tone 的唯一管道。只在 server 端的 tone 是 dead code。
  **如何套用:** 先加進 `TONE_OPTIONS`,再加 server 端分支。

## 警訊

- Server 用 `toTextStreamResponse`,client 卻用 data-stream 解析(或反過來)。
- 在模組層級讀取環境變數。
- 在速率限制檢查之前就啟動 `streamText`。
- 回傳非 JSON 的錯誤 body。
- 在 request body 加入 client 從不送出的欄位(或反之)。
- 在回傳之前 `await` 串流。

## 驗證

- [ ] `curl -N -X POST http://localhost:3000/api/generate -H 'Content-Type: application/json' -d '{"draft":"你好","tone":"professional"}'` 印出多個 chunks,而非一團輸出。
- [ ] `curl -X POST … -d '{}'` 回傳 HTTP 400 與 `{"error":"..."}`。
- [ ] 從同一 IP 連發第六個請求會回 HTTP 429 與 `{"error":"..."}`。
- [ ] `/` 的 UI 顯示載入點點然後逐步出現文字。
- [ ] `npm run build` 通過。
