"use client";

import { useCallback, useEffect, useState } from "react";
import type { ParseResult } from "@/lib/decklist-parser";

interface DecklistTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DecklistTextarea({
  value,
  onChange,
  disabled,
}: DecklistTextareaProps) {
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [debouncing, setDebouncing] = useState(false);

  const runParse = useCallback(async (text: string) => {
    if (!text.trim()) {
      setPreview(null);
      return;
    }
    setDebouncing(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text }),
      });
      const data = (await res.json()) as ParseResult;
      setPreview(data);
    } finally {
      setDebouncing(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runParse(value), 400);
    return () => clearTimeout(t);
  }, [value, runParse]);

  const count = preview?.cardCount ?? 0;
  const countOk = count === 60;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">
          Lista de cartas (pega desde TCG Live / Limitless)
        </label>
        <span
          className={`text-sm font-mono font-semibold ${
            countOk ? "text-emerald-400" : count > 0 ? "text-amber-400" : "text-zinc-500"
          }`}
        >
          {debouncing ? "…" : `${count}/60`}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={14}
        placeholder={`4 Charmander OBF 26\n2 Boss's Orders PAL 172\n...\n12 Basic Fire Energy`}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
      />
      {preview && preview.errors.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-300">
          {preview.errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      )}
      {preview && preview.warnings.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-sm text-amber-200">
          {preview.warnings.slice(0, 5).map((w, i) => (
            <li key={i}>• {w}</li>
          ))}
          {preview.warnings.length > 5 && (
            <li>• +{preview.warnings.length - 5} avisos más</li>
          )}
        </ul>
      )}
    </div>
  );
}
