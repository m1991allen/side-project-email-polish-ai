---
name: email-prompt-tuning
description: 安全地修改潤稿 prompt、新增或移除語氣、變更輸出限制。當你要編輯 src/app/api/generate/route.ts 中的 system prompt,或 src/app/page.tsx 中的 TONE_OPTIONS 陣列時使用。
---

## 概觀

Prompt、tone 列表與 UI 文案必須在三個介面之間保持一致:

- `src/app/page.tsx` — `TONE_OPTIONS` 陣列(唯一真實來源)以及 `<select>` UI。
- `src/app/api/generate/route.ts` — `toneInstruction` 分支與 `systemPrompt`。
- `src/hooks/useEmailCompletion.ts` — 不透明地傳遞 `tone`;通常不需修改,但編輯前請重讀。

破壞一致性是無聲的:使用者選了某個 tone,server 卻 fallback 成「professional」,輸出看起來不對,但完全沒有錯誤。

## 何時使用

- 新增、改名或移除 tone。
- 變更輸出限制(主旨欄政策、長度上限、正式程度)。
- 改變目標語言(目前為 zh → en)。
- 加入新的 prompt 變數(收件人姓名、緊急程度、簽名)。
- 換模型。

## 流程

1. **決定權威的 tone 列表。** `page.tsx` 中的 `TONE_OPTIONS[].value` 是唯一真實來源。`Tone` 型別已從中推導 — 保留這層推導。
2. **在 server 端對應每一個 tone。** 更新 `toneInstruction` 鏈條,讓 `TONE_OPTIONS` 中的每一個值都有明確的分支。一旦超過 3 個 tone,就把三元鏈改寫為 `Record<Tone, string>` 查表:
   ```ts
   const TONE_INSTRUCTION: Record<Tone, string> = { … };
   const toneInstruction = TONE_INSTRUCTION[tone] ?? TONE_INSTRUCTION.professional;
   ```
3. **以條列規則撰寫 `systemPrompt`**,而非散文。保留 `Output ONLY the email body` 規則 — UI 用 `whitespace-pre-wrap` 直接渲染 `completion`,沒有 markdown parser,任何前言都會原封不動洩漏到輸出框。
4. **保持模型與首頁文案同步。** 若你變更 `gemini-2.0-flash`,也要更新 `page.tsx` 中的「Powered by Gemini 2.0 Flash」徽章。
5. **以同一份草稿測試每個 tone**,目視比對輸出是否漂移 — prompt 的小調整往往比預期更明顯地影響長度與語氣。
6. **新增欄位要從頭串到尾。** 若你新增了 `recipient` 欄位:UI 輸入 → `handleSubmit` → hook body → server 驗證 → prompt 範本。停在第一個沒接好的環節,你就上線了一個半套欄位。

## 常見的合理化藉口

- 「未知 tone server 會 fallback 成 professional,所以漏了分支沒關係」 —
  **為什麼:** 無聲的 fallback 正是這個 skill 要避免的 bug。使用者選「urgent」,卻得到「professional」,沒有任何提示。
  **如何套用:** 在 dev 環境中讓未知 tone 直接回 400,或使用窮舉的 `Record<Tone, string>`,讓缺鍵在型別檢查時就失敗。
- 「Prompt 文字不需要測試」 —
  **為什麼:** 措辭的小變動(「be concise」→「be brief」、加上「use bullet points」)會實質改變輸出長度與格式。
  **如何套用:** 任何 prompt 編輯後,每個 tone 抽查 2–3 份草稿。
- 「UI 文案可以跟行為脫鉤」 —
  **為什麼:** 首頁宣稱「Powered by Gemini 2.0 Flash」、特色標語寫「API key stays on server」、Pro 卡片寫「Unlimited emails」 — 這些是對使用者的契約,不是裝飾。
  **如何套用:** 行為一變,就走過 UI,把所有受影響的字串都更新。

## 警訊

- 某個 `TONE_OPTIONS` 的值在 server 端沒有對應的分支。
- System prompt 缺少 `Output ONLY the email body` 規則 — 輸出會把 `"Subject: …\n\nHere's your email:"` 一併當成正文寫進去。
- Tone 列表在兩處硬編碼。
- 模型常數與首頁「Powered by …」徽章不一致。
- Request body 加了新欄位,但 UI 上沒有任何控制元件可以產生它。

## 驗證

- [ ] `<select>` 中的每個 tone,對同一份草稿都產生肉眼可辨的差異。
- [ ] 沒有 tone 意外掉進 default 分支(在 dev 中印出 tone 來檢查)。
- [ ] 輸出絕不會以「Here's your email:」或類似 framing 文字開頭。
- [ ] 首頁文案與特色標語仍與目前的模型與行為相符。
- [ ] `npm run build` 與 `npm run lint` 皆乾淨。
