"use client";

import { useState, useCallback } from "react";

interface UseEmailCompletionOptions {
  api: string;
}

export function useEmailCompletion({ api }: UseEmailCompletionOptions) {
  const [completion, setCompletion] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const complete = useCallback(
    async (draft: string, tone: string) => {
      if (!draft.trim()) return;

      setIsLoading(true);
      setCompletion("");
      setError(null);

      try {
        const res = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft, tone }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // toTextStreamResponse sends plain UTF-8 text chunks
          const chunk = decoder.decode(value, { stream: true });
          setCompletion((prev) => prev + chunk);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    },
    [api]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent, tone: string) => {
      e.preventDefault();
      complete(input, tone);
    },
    [complete, input]
  );

  return {
    completion,
    input,
    setInput,
    isLoading,
    error,
    handleSubmit,
  };
}
