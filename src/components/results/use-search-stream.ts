"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { translateStage } from "@/components/results/stage-labels";
import { useI18n } from "@/i18n/provider";
import type { PublicQuote, SearchEvent } from "@/lib/types";

export interface StageView {
  id: string;
  label: string;
  detail: string;
  progress: number;
  at: number;
}

export interface SearchStreamState {
  status: "connecting" | "searching" | "done" | "error";
  corridor: string;
  partnersScanned: number;
  stages: StageView[];
  progress: number;
  quotes: PublicQuote[];
  expectedTotal: number | null;
  summary: Extract<SearchEvent, { type: "done" }> | null;
  error: string | null;
  elapsedMs: number;
}

const INITIAL: SearchStreamState = {
  status: "connecting",
  corridor: "",
  partnersScanned: 0,
  stages: [],
  progress: 2,
  quotes: [],
  expectedTotal: null,
  summary: null,
  error: null,
  elapsedMs: 0,
};

/**
 * Consumes the NDJSON quote stream.
 *
 * Quotes are appended as they arrive so the board paints progressively; the
 * progress figure blends declared stage progress with how many of the expected
 * results have actually landed, which keeps the bar honest rather than
 * theatrical.
 */
export function useSearchStream(leadId: string, token: string | null) {
  const { dict, locale } = useI18n();
  const [state, setState] = useState<SearchStreamState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * The stream carries an English label per stage because the route handler
   * runs without a locale. It also carries a stable `id` and the values the
   * label was built from, so the narration is rebuilt here in the reader's
   * language and the API payload stays language-free. An id we do not know
   * falls back to the server text rather than rendering blank.
   */
  const dictRef = useRef(dict);
  dictRef.current = dict;
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ ...INITIAL });

    const startedAt = performance.now();

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, token }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setState((s) => ({
          ...s,
          status: "error",
          error: data?.error ?? dictRef.current.results.networkError,
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handle = (event: SearchEvent) => {
        setState((prev) => {
          switch (event.type) {
            case "open":
              return {
                ...prev,
                status: "searching",
                corridor: event.corridor,
                partnersScanned: event.partnersScanned,
              };
            case "stage": {
              const text = translateStage(localeRef.current, dictRef.current, event);
              return {
                ...prev,
                stages: [
                  ...prev.stages,
                  {
                    id: event.id,
                    label: text.label,
                    detail: text.detail,
                    progress: event.progress,
                    at: performance.now() - startedAt,
                  },
                ],
                progress: Math.max(prev.progress, event.progress),
              };
            }
            case "quote": {
              const quotes = [...prev.quotes, event.quote];
              const landed = (quotes.length / event.total) * 100;
              return {
                ...prev,
                quotes,
                expectedTotal: event.total,
                progress: Math.max(prev.progress, Math.min(97, 30 + landed * 0.68)),
              };
            }
            case "done":
              return {
                ...prev,
                status: "done",
                summary: event,
                progress: 100,
                elapsedMs: event.elapsedMs,
              };
            default:
              return prev;
          }
        });
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            handle(JSON.parse(line) as SearchEvent);
          } catch {
            /* partial frame — ignore */
          }
        }
      }

      setState((prev) =>
        prev.status === "done" ? prev : { ...prev, status: "done", progress: 100 },
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setState((s) => ({
        ...s,
        status: "error",
        error: error instanceof Error ? error.message : dictRef.current.results.searchFailed,
      }));
    }
  }, [leadId, token]);

  useEffect(() => {
    // `run` is stable for a given lead, so this fires once per search. Under
    // React's dev-mode double effect the first stream is aborted by the
    // cleanup and the second one takes over — which is exactly what we want;
    // guarding the restart instead would leave the board frozen mid-scan.
    void run();
    return () => abortRef.current?.abort();
  }, [run]);

  const retry = useCallback(() => {
    void run();
  }, [run]);

  return { ...state, retry };
}
