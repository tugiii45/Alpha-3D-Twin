import { useState, type FormEvent } from "react";
import type { AiProcessResponse } from "@config/contracts";
import { ApiError, processPrompt } from "../api";
import { Panel } from "./Panel";

export function AiCard() {
  const [prompt, setPrompt] = useState("Reply with a JSON object that has a greeting field.");
  const [system, setSystem] = useState("");
  const [result, setResult] = useState<AiProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      setResult(
        await processPrompt({
          prompt,
          ...(system.trim() ? { system: system.trim() } : {}),
        }),
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "AI request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel title="AI process">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-3">
        <label className="block text-sm">
          <span className="text-stone-600">Prompt</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            required
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-stone-600">System message</span>
          <input
            value={system}
            onChange={(event) => setSystem(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Sending" : "POST /api/ai/process"}
        </button>
      </form>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {result ? (
        <pre className="mt-4 overflow-auto rounded-xl bg-stone-950 p-4 text-sm text-stone-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </Panel>
  );
}
