"use client";
import { useState } from "react";
import Link from "next/link";
import type { Alert, Ward } from "@/types";
import RiskBadge from "./RiskBadge";
import { useDialog } from "./useDialog";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const STATUS_STYLE: Record<Alert["status"], string> = {
  Sent: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Delivering: "bg-sky-50 text-sky-800 border-sky-200",
  Failed: "bg-red-50 text-red-800 border-red-200",
};

function Drawer({ alert, wards, onClose }: { alert: Alert; wards: Ward[]; onClose: () => void }) {
  const ref = useDialog(onClose);
  const rows = wards.filter((w) => alert.wardIds.includes(w.id));
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <aside ref={ref} role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">Alert details</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">Close</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>{fmt(alert.sentAt)}</span>
          <RiskBadge level={alert.riskLevel} />
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[alert.status]}`}>{alert.status}</span>
          <span>{alert.language === "sw" ? "Kiswahili" : "English"}</span>
        </div>
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{alert.message}</p>

        <h3 className="mt-6 text-sm font-medium text-slate-700">Delivery by ward (mock estimate)</h3>
        <table className="mt-2 w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr><th className="py-1 font-medium">Ward</th><th className="py-1 text-right font-medium">Recipients</th><th className="py-1 text-right font-medium">Delivered</th></tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="border-t border-slate-100">
                <td className="py-1.5">{w.name}</td>
                <td className="py-1.5 text-right">{w.subscriberCount.toLocaleString()}</td>
                <td className="py-1.5 text-right">{Math.round((w.subscriberCount * alert.deliveredPct) / 100).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Link href={`/view/${alert.id}`} target="_blank" className="mt-6 inline-block text-sm font-medium text-sky-700 hover:underline">Open public view ↗</Link>
      </aside>
    </div>
  );
}

export default function AlertHistory({ alerts, wards }: { alerts: Alert[]; wards: Ward[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = alerts.find((a) => a.id === openId);
  const nameOf = (id: string) => wards.find((w) => w.id === id)?.name ?? id;

  return (
    <section aria-labelledby="history-title" className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 id="history-title" className="mb-3 text-lg font-semibold text-slate-900">Alert history</h2>
      {alerts.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No alerts sent yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 pr-3 font-medium">Wards</th>
                <th className="py-2 pr-3 font-medium">Risk</th>
                <th className="py-2 pr-3 font-medium">Message</th>
                <th className="py-2 pr-3 font-medium">Delivered</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} onClick={() => setOpenId(a.id)} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50">
                  <td className="whitespace-nowrap py-2.5 pr-3">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(a.id); }} className="text-left font-medium text-sky-700 hover:underline">{fmt(a.sentAt)}</button>
                  </td>
                  <td className="py-2.5 pr-3">{a.wardIds.map(nameOf).join(", ")}</td>
                  <td className="py-2.5 pr-3"><RiskBadge level={a.riskLevel} /></td>
                  <td className="max-w-xs truncate py-2.5 pr-3 text-slate-600">{a.message}</td>
                  <td className="py-2.5 pr-3">{a.deliveredPct}%</td>
                  <td className="py-2.5"><span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <Drawer alert={open} wards={wards} onClose={() => setOpenId(null)} />}
    </section>
  );
}