"use client";

import { useState, useCallback, useTransition } from "react";
import type { ActionResponse } from "@/types";

export function useAction<TInput, TOutput = unknown>(
  action: (input: TInput) => Promise<ActionResponse<TOutput>>,
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TOutput | null>(null);

  const execute = useCallback(
    async (input: TInput) => {
      setError(null);
      setData(null);

      return new Promise<ActionResponse<TOutput>>((resolve) => {
        startTransition(async () => {
          const result = await action(input);
          if (result.success && result.data) {
            setData(result.data);
          } else if (!result.success) {
            setError(result.error || "Something went wrong");
          }
          resolve(result);
        });
      });
    },
    [action],
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
  }, []);

  return { execute, isPending, error, data, reset };
}
