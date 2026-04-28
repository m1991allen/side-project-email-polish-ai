---
name: nextjs-16-docs-first
description: 在本 repo 寫任何 Next.js 程式碼前,先查閱 node_modules/next/dist/docs/。當你要編輯 src/app/ 下的任何檔案、處理 routing、caching、fetching、metadata、middleware 或 config 時使用。
---

## 概觀

本 repo 鎖定 Next.js 16.2.3 與 React 19.2.4。兩者都帶有可能與你訓練資料記憶不一致的 breaking changes。權威來源是隨 `node_modules/next/dist/docs/` 一同安裝的 Next.js 文件(章節 `01-app`、`02-pages`、`03-architecture`、`04-community`)。**絕對不要**憑記憶寫 Next 16 程式碼 — 先翻開本機文件。

## 何時使用

下列任何情境前都要觸發:
- 編輯或建立 `src/app/` 下的檔案(routes、layouts、pages、route handlers、metadata)。
- 使用 `fetch`、`cache`、`revalidate`、`headers()`、`cookies()`、`draftMode()`、`unstable_*` 等 API。
- 劃定新的 Server / Client Component 邊界(`"use client"`)。
- 動到 `next.config.ts`、middleware、image 最佳化或 font 載入。
- 升版 `next` 相依。

可略過:純 TypeScript 工具模組、純 Tailwind class 編輯、不引用 `next/*` 的第三方套件。

## 流程

1. 辨識目前要碰的概念:routing、caching、streaming、metadata、middleware、image、font 等等。
2. `ls node_modules/next/dist/docs/01-app/` 並進入符合該概念的子目錄。
3. 把對應的文件檔從頭讀到尾。記下你會依靠的具體章節標題。
4. 對已安裝的型別 grep 棄用標記:`grep -rn "@deprecated" node_modules/next/dist/ | head -20`。對你打算呼叫的任何 API 交叉比對。
5. **這時候才**開始寫 code。在 commit body / PR description 中註明你依循的文件路徑(例如 `per node_modules/next/dist/docs/01-app/.../route-handlers.md`)。

## 常見的合理化藉口

- 「我記得 Next 14 是這樣做」 — Next 16 已變更 caching、dynamic params(以 Promise 包裹)以及 route segment config 的預設值。記憶過時了。
  **為什麼:** 無聲的行為變更不會產生 TypeScript 錯誤。你會直接上線一個 bug。
  **如何套用:** 把記憶當假設,把本機文件當真相。
- 「網路上有部落格教這個」 — 大多數公開教學針對 Next ≤ 15。
  **為什麼:** 你比較容易從 Google 上 cargo-cult 一個棄用的寫法,而不是從 `node_modules`。
- 「能編譯就能用」 — 棄用 API 仍然能編譯。
  **為什麼:** 編譯只檢查型別,不保證語意或升級安全性。

## 警訊

- 沒先翻本機文件就把另一個 Next.js 專案的寫法照抄過來。
- 用了 `export const dynamic`、`revalidate` 或 `fetchCache`,卻沒在已安裝的文件中確認當前語意。
- 在 route segment 中把 params 寫成 `params: { id: string }`,而不是 `params: Promise<{ id: string }>`。
- 從 `node_modules/next/` 中根本不存在的路徑(`next/…`)import。
- 編輯 `src/app/**` 的 PR 描述完全沒引用任何文件。

## 驗證

- [ ] 列出參照過的具體文件檔,附上 `node_modules/next/dist/docs/` 下的路徑。
- [ ] 對所碰到的 API 跑過 `grep -n "@deprecated"`,沒有殘留任何已棄用的呼叫。
- [ ] `npm run build` 通過,輸出中沒有 Next.js 棄用警告。
- [ ] `npm run lint` 乾淨。
- [ ] 實作對齊目前文件範例,而非歷史版本。
