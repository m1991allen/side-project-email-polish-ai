"use client";

import { useState } from "react";
import { useEmailCompletion } from "@/hooks/useEmailCompletion";
import {
  Mail,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import PricingModal from "@/components/PricingModal";

const TONE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
] as const;

type Tone = (typeof TONE_OPTIONS)[number]["value"];

export default function Home() {
  const [tone, setTone] = useState<Tone>("professional");
  const [copied, setCopied] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const { completion, input, setInput, handleSubmit, isLoading, error } =
    useEmailCompletion({ api: "/api/generate" });

  async function handleCopy() {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        {/* Nav */}
        <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Mail size={16} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">EmailPolish AI</span>
            </div>
            <button
              onClick={() => setPricingOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <Zap size={14} className="fill-yellow-300 text-yellow-300" />
              Upgrade Pro
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-sm text-indigo-700 font-medium mb-6">
            <Sparkles size={14} />
            Powered by Gemini 2.0 Flash
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Turn drafts into{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              professional emails
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Write in Chinese, get back polished English business emails instantly.
            No more staring at a blank screen.
          </p>
        </section>

        {/* Feature Pills */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 flex flex-wrap justify-center gap-3">
          {[
            { icon: Sparkles, text: "AI-powered rewrite" },
            { icon: Clock, text: "Instant results" },
            { icon: Shield, text: "API key stays on server" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-600 shadow-sm"
            >
              <Icon size={14} className="text-indigo-500" />
              {text}
            </div>
          ))}
        </section>

        {/* Main Editor */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Email tone</span>
              <div className="relative">
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                >
                  {TONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Editor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {/* Input */}
              <div className="flex flex-col">
                <div className="px-4 py-2.5 flex items-center gap-2 border-b border-gray-100">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Draft (Chinese)
                  </span>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="例如：你好，我想問一下上次開會討論的合約進度，不知道你們這邊有沒有什麼更新？謝謝。"
                  className="flex-1 min-h-[280px] w-full resize-none px-5 py-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none"
                />
              </div>

              {/* Output */}
              <div className="flex flex-col">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Polished Email (English)
                    </span>
                  </div>
                  {completion && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex-1 min-h-[280px] px-5 py-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {isLoading && !completion && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span>Polishing your email...</span>
                    </div>
                  )}
                  {completion ? (
                    <span>{completion}</span>
                  ) : (
                    !isLoading && (
                      <span className="text-gray-300">
                        Your polished email will appear here...
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              {error && (
                <p className="text-sm text-red-500">{error.message}</p>
              )}
              {!error && (
                <p className="text-xs text-gray-400">
                  Free tier: 5 requests/minute
                </p>
              )}
              <form onSubmit={(e) => handleSubmit(e, tone)}>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Polish Email
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Need unlimited emails?</p>
              <p className="text-indigo-200 text-sm">
                Upgrade to Pro for $9.9/month — unlimited generations, advanced
                tones & more.
              </p>
            </div>
            <button
              onClick={() => setPricingOpen(true)}
              className="shrink-0 rounded-xl bg-white text-indigo-600 font-semibold px-6 py-2.5 text-sm hover:bg-indigo-50 transition-colors"
            >
              See Plans
            </button>
          </div>
        </section>
      </div>

      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  );
}
