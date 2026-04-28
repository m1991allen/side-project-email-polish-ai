---
name: lemon-squeezy-wiring
description: 把 PricingModal 的占位 checkout URL 替換為真正的 Lemon Squeezy 整合 — checkout 連結、webhook 驗章、持久化 Pro 狀態、以及速率限制 bypass。當你從 demo 走向付費產品時使用。
---

## 概觀

`src/components/PricingModal.tsx` 連到 `https://YOUR_STORE.lemonsqueezy.com/checkout/buy/YOUR_PRODUCT_ID` — 一個字面上的占位字串。速率限制器目前完全不認識 Pro 使用者。Lemon Squeezy 的接線分為四部分:真正的 checkout URL、webhook → 持久化、API 路由的 Pro gating、以及不再對使用者說謊的 UI 文案。

## 何時使用

- 第一次付費上線。
- 變更定價(目前在 `PricingModal.tsx` 與 `page.tsx` 的首頁 CTA banner 都寫著 $9.9/mo)。
- 加入年費方案、優惠券或額外層級。
- 改用其他金流 — 把這份檢查表當作結構重複使用。

## 流程

1. **在 Lemon Squeezy 建立商品。** 抓下:store subdomain、product ID、variant ID、webhook 簽章 secret、test-mode API key。
2. **在三個地方都記錄環境變數** — `.env.example`(留空)、`.env.local`(真實值)、部署平台(真實值):
   - `LEMONSQUEEZY_STORE_SUBDOMAIN`
   - `LEMONSQUEEZY_VARIANT_ID`
   - `LEMONSQUEEZY_WEBHOOK_SECRET`
   - `LEMONSQUEEZY_API_KEY`(若你會在 server 端產生簽章 URL)
3. **在 server 端組 checkout URL。** 不要把環境變數暴露到 client bundle。可以二擇一:
   - 從 Server Component 父層把 URL 當 prop 傳進 `PricingModal`,或
   - 新增 `src/app/api/checkout/route.ts`,回 307 redirect 到簽章後的 Lemon Squeezy URL,把 modal 的按鈕指向這條路由。
4. **替換 `PricingModal.tsx` 的占位 `<a>`。** 保留 `target="_blank"` 與 `rel="noopener noreferrer"`。
5. **加上 webhook 端點** `src/app/api/webhook/lemonsqueezy/route.ts`:
   - 讀取原始 body(不要用 `req.json()` — HMAC 需要精確的 bytes)。
   - 用 `LEMONSQUEEZY_WEBHOOK_SECRET` 對 HMAC-SHA256 進行驗章。不符即 401 拒絕。
   - 至少處理:`subscription_created`、`subscription_updated`、`subscription_cancelled`。
6. **挑一個持久化層並承諾。** Vercel KV、Upstash Redis、Supabase — 選一個。最低 schema:`{ email, status: 'active' | 'cancelled', current_period_end, lemon_subscription_id }`。不可用 in-memory,不可用 localStorage。
7. **在 `src/app/api/generate/route.ts` gate Pro。** 你需要驗證身份 — 決定方案(magic link、Clerk、NextAuth、checkout 後設定的簽章 cookie)。沒有驗證,就無法辨識請求者,bypass 也就無從談起。在接金流前先規劃好驗證機制。
8. **更新 UI 文案。** 對 Pro 使用者,「Free tier: 5 requests/minute」字樣與首頁 CTA banner 都必須變更。特色標語要反映現實(例如 Pro 啟動後就拿掉「5/min」)。
9. **取消路徑。** `subscription_cancelled` webhook → 將狀態翻為 `cancelled`。該使用者的下一次請求會 fallback 回免費限制器。

## 常見的合理化藉口

- 「我直接貼 URL 上線就好」 —
  **為什麼:** 你會在沒有任何履約機制的情況下上線。使用者付了錢,什麼也沒發生。
  **如何套用:** Webhook + 持久化不是可選 — 它就是產品的核心。
- 「Webhook 簽章驗證之後再加」 —
  **為什麼:** 任何人都可以對你的公開端點 POST 一個假的 `subscription_created`,自助升級成 Pro。
  **如何套用:** 沒有簽章驗證的 webhook 永遠不上線。零例外。
- 「Pro 狀態存在 client cookie 就夠了」 —
  **為什麼:** 可被輕易竄改。Pro 變成人人有獎。
  **如何套用:** 真實狀態只在 server 端;client 只讀取衍生狀態。

## 警訊

- 原始碼中還有 `YOUR_STORE`、`YOUR_PRODUCT_ID`、`YOUR_VARIANT_ID` 任何一個。
- Webhook 路由沒有 HMAC 驗章。
- Pro 狀態從未簽章的 client cookie 或 localStorage 讀取。
- `LEMONSQUEEZY_*` 環境變數沒寫進 `.env.example`。
- 速率限制器仍然對已驗證的 Pro 使用者回 429。
- 升級後 UI 還在對 Pro 使用者宣傳「5/min」。

## 驗證

- [ ] `grep -r "YOUR_STORE\|YOUR_PRODUCT_ID\|YOUR_VARIANT_ID" src/` 沒有任何輸出。
- [ ] 點擊「Get Pro」會打開該 store 與 variant 的真正 Lemon Squeezy checkout。
- [ ] 完成 test-mode checkout 會觸發 webhook,並寫入一筆 `active` 紀錄。
- [ ] 竄改過的 webhook body(翻一個 byte)回 HTTP 401。
- [ ] Pro 使用者可以爆量超過 5 requests/minute。
- [ ] 在 Lemon Squeezy 後台取消訂閱會翻轉狀態;下一次請求 fallback 回免費。
- [ ] 免費層 UI 文案仍然準確;Pro 層 UI 文案反映無速率上限。
