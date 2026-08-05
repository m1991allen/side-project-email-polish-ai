# side-project-email-polish-ai

這是一個由 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) 建立的 [Next.js](https://nextjs.org) 專案。

## 開始使用

需求：Node.js 20 以上。

```bash
git clone https://github.com/m1991allen/side-project-email-polish-ai.git
cd side-project-email-polish-ai
npm install
```

接著設定環境變數。潤稿 API 需要 Google Gemini 金鑰，缺少時 `/api/generate` 會回 500：

```bash
cp .env.example .env.local
```

編輯 `.env.local`，把 `GEMINI_API_KEY` 填入你在 [Google AI Studio](https://aistudio.google.com/apikey) 取得的金鑰。

最後啟動開發伺服器：

```bash
npm run dev
```

用瀏覽器打開 [http://localhost:3000](http://localhost:3000) 即可看到結果。

你可以透過修改 `app/page.tsx` 開始編輯這個頁面。檔案儲存後頁面會自動更新。

本專案使用 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) 自動最佳化並載入 [Geist](https://vercel.com/font),這是 Vercel 推出的全新字型家族。

## 進一步學習

想深入認識 Next.js,可以參考以下資源:

- [Next.js 官方文件](https://nextjs.org/docs) — 認識 Next.js 的功能與 API。
- [Learn Next.js](https://nextjs.org/learn) — 互動式的 Next.js 教學。

歡迎參觀 [Next.js GitHub repository](https://github.com/vercel/next.js) — 我們很歡迎你的回饋與貢獻!

## 部署到 Vercel

部署 Next.js app 最簡單的方式,就是使用由 Next.js 開發團隊打造的 [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)。

更多細節請參考 [Next.js 部署文件](https://nextjs.org/docs/app/building-your-application/deploying)。
