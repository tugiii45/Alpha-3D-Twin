"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Alert, Language, RiskLevel, Scenario, Ward } from "@/types";
import { maxRisk } from "@/lib/risk";
import { DAYS_EN, SMS_COST_KES, buildDraft, segmentCount } from "@/lib/sms";
import { sendAlert } from "@/lib/api";
import RiskBadge from "./RiskBadge";
import ConfirmSendModal from "./ConfirmSendModal";

interface Props {
  wards: Ward[];
  scenarios: Scenario[];
  scenarioId: string;
  onScenario: (id: string) => void;
  selectedIds: string[];
  onToggleWard: (id: string) => void;
  risks: Record<string, RiskLevel>;
  previewId: string;
  onSent: (alert: Alert) => void;
}

export default function ComposerPanel(p: Props) {
  const [dayIdx, setDayIdx] = useState(1);
  const [language, setLanguage] = useState<Language>("en");
  const [edited, setEdited] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => p.wards.filter((w) => p.selectedIds.includes(w.id)), [p.wards, p.selectedIds]);
  const risk = maxRisk(selected.map((w) => p.risks[w.id] ?? "low"));

  const draft = useMemo(() => {
    if (!selected.length) return "";
    const roads = Array.from(new Set(selected.map((w) => w.roads[0]))).slice(0, 3);
    return buildDraft({ language, wardNames: selected.map((w) => w.name), risk, dayIdx, roads });
  }, [selected, language, risk, dayIdx]);

  const message = edited ?? draft;
  const segments = segmentCount(message);
  const recipients = selected.reduce((sum, w) => sum + w.subscriberCount, 0);
  const costKes = recipients * segments * SMS_COST_KES;
  const canSend = selected.length > 0 && message.trim().length > 0;

  async function confirm() {
    setSending(true);
    setError(null);
    try {
      const alert = await sendAlert({ wardIds: p.selectedIds, riskLevel: risk, message, language });
      setModalOpen(false);
      setEdited(null);
      p.onSent(alert);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Compose alert</h2>
        <Link href={`/view/${p.previewId}`} target="_blank" className="text-sm font-medium text-sky-700 hover:underline">
          Preview public view ↗
        </Link>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">1. Rainfall scenario</legend>
        <div className="grid grid-cols-3 gap-2">
          {p.scenarios.map((s) => {
            const active = s.id === p.scenarioId;
            return (
              <label key={s.id} className={`cursor-pointer rounded-lg border p-3 text-sm focus-within:ring-2 focus-within:ring-sky-500 ${active ? "border-sky-600 bg-sky-50 ring-1 ring-sky-600" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" name="scenario" className="sr-only" checked={active} onChange={() => p.onScenario(s.id)} />
                <span className="block font-medium text-slate-900">{s.label}</span>
                <span className="text-xs text-slate-500">{s.rainfallMm}mm / {s.hours}h</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">2. Wards</legend>
        <ul className="space-y-1.5">
          {p.wards.map((w) => (
            <li key={w.id}>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" checked={p.selectedIds.includes(w.id)} onChange={() => p.onToggleWard(w.id)} />
                  {w.name}
                </span>
                <RiskBadge level={p.risks[w.id] ?? "low"} />
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-day" className="mb-1 block text-sm font-medium text-slate-700">Rain starts</label>
          <select id="start-day" value={dayIdx} onChange={(e) => setDayIdx(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            {DAYS_EN.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-slate-700">Language</legend>
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-sm">
            {([["en", "English"], ["sw", "Kiswahili"]] as const).map(([code, label]) => (
              <label key={code} className={`cursor-pointer px-3 py-2 focus-within:ring-2 focus-within:ring-sky-500 ${language === code ? "bg-sky-700 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}>
                <input type="radio" name="language" className="sr-only" checked={language === code} onChange={() => { setLanguage(code); setEdited(null); }} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="sms-body" className="text-sm font-medium text-slate-700">3. SMS message</label>
          {edited !== null && (
            <button type="button" onClick={() => setEdited(null)} className="text-xs font-medium text-sky-700 hover:underline">Reset to auto draft</button>
          )}
        </div>
        <textarea
          id="sms-body" rows={5} value={message} onChange={(e) => setEdited(e.target.value)}
          placeholder="Select at least one ward to generate a draft."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className={`mt-1 text-xs ${segments > 1 ? "text-amber-700" : "text-slate-500"}`}>
          {message.length} characters · {segments} SMS segment{segments > 1 ? "s" : ""}
          {segments > 1 && " (over one segment, so cost per recipient rises)"}
        </p>
      </div>

      <div>
        <button type="button" disabled={!canSend} onClick={() => { setError(null); setModalOpen(true); }} className="w-full rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">
          Review and send alert
        </button>
        {!canSend && <p className="mt-2 text-xs text-slate-500">Select at least one ward to enable sending.</p>}
      </div>

      {modalOpen && (
        <ConfirmSendModal
          wardNames={selected.map((w) => w.name)} risk={risk} recipients={recipients} costKes={costKes}
          message={message} sending={sending} error={error}
          onCancel={() => setModalOpen(false)} onConfirm={confirm}
        />
      )}
    </div>
  );
}