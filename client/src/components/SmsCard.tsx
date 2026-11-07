import { useState, type FormEvent } from "react";
import type { SendSmsResponse } from "@config/contracts";
import { ApiError, sendSms } from "../api";
import { Panel } from "./Panel";

export function SmsCard() {
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<SendSmsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      setResult(await sendSms({ to, text }));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "SMS request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel title="SMS">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-3">
        <label className="block text-sm">
          <span className="text-stone-600">To</span>
          <input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-stone-600">Text</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            required
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Sending" : "POST /api/sms/send"}
        </button>
      </form>
      <p className="mt-3 text-sm text-stone-500">Inbound messages land on POST /api/sms/webhook.</p>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {result ? (
        <pre className="mt-4 overflow-auto rounded-xl bg-stone-950 p-4 text-sm text-stone-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </Panel>
  );
}
