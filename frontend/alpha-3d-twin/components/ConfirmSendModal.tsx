"use client";
import { useState } from "react";
import type { RiskLevel } from "@/types";
import RiskBadge from "./RiskBadge";
import { useDialog } from "./useDialog";

interface Props {
  wardNames: string[];
  risk: RiskLevel;
  recipients: number;
  costKes: number;
  message: string;
  sending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmSendModal(p: Props) {
  const [approved, setApproved] = useState(false);
  const ref = useDialog(() => { if (!p.sending) p.onCancel(); });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-900">Confirm and send alert</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Wards</dt><dd className="text-right font-medium">{p.wardNames.join(", ")}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Risk level</dt><dd><RiskBadge level={p.risk} /></dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Recipients</dt><dd className="font-medium">{p.recipients.toLocaleString()}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Estimated cost</dt><dd className="font-medium">KES {p.costKes.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</dd></div>
        </dl>
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{p.message}</p>

        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5 h-4 w-4" checked={approved} onChange={(e) => setApproved(e.target.checked)} disabled={p.sending} />
          I confirm this alert is approved
        </label>

        {p.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{p.error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={p.onCancel} disabled={p.sending} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={p.onConfirm} disabled={!approved || p.sending} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">
            {p.sending ? "Sending…" : p.error ? "Retry send" : "Send alert"}
          </button>
        </div>
      </div>
    </div>
  );
}