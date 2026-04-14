"use client";

import { X, Check, Zap, Star } from "lucide-react";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREE_FEATURES = [
  "5 emails per minute",
  "Standard tone options",
  "Basic email templates",
];

const PRO_FEATURES = [
  "Unlimited emails",
  "Priority AI processing",
  "Advanced tone customization",
  "Custom signature templates",
  "Email history & favorites",
  "API access",
];

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={20} className="fill-yellow-300 text-yellow-300" />
            <span className="text-sm font-medium text-indigo-200 uppercase tracking-wider">
              Upgrade
            </span>
          </div>
          <h2 className="text-2xl font-bold">Unlock Pro Features</h2>
          <p className="text-indigo-200 mt-1">
            Write better emails, faster — no limits.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-8">
          {/* Free Plan */}
          <div className="rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Free</h3>
              <span className="text-2xl font-bold text-gray-900">$0</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-gray-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-xl border-2 border-indigo-500 p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                <Star size={12} className="fill-white" />
                MOST POPULAR
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Pro</h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">$9.9</span>
                <span className="text-sm text-gray-500">/mo</span>
              </div>
            </div>
            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-indigo-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {/*
              Replace href with your Lemon Squeezy checkout URL:
              e.g. https://yourstore.lemonsqueezy.com/checkout/buy/YOUR_PRODUCT_ID
            */}
            <a
              href="https://YOUR_STORE.lemonsqueezy.com/checkout/buy/YOUR_PRODUCT_ID"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-indigo-600 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Get Pro — $9.9/month
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Secure payment via Lemon Squeezy · Cancel anytime
        </p>
      </div>
    </div>
  );
}
