"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Alert, RiskLevel, Ward } from "@/types";
import { getAlerts, getWards } from "@/lib/api";
import { SCENARIOS } from "@/lib/mock";
import { riskFor } from "@/lib/risk";
import ComposerPanel from "@/components/ComposerPanel";
import WardMap from "@/components/WardMap";
import StatsCards from "@/components/StatsCards";
import AlertHistory from "@/components/AlertHistory";

export default function DashboardPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState(SCENARIOS[1].id);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [w, a] = await Promise.all([getWards(), getAlerts()]);
      setWards(w);
      setAlerts(a);
      setSelectedIds(w.length ? [w[0].id] : []);
    } catch {
      setLoadError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const risks = useMemo(
    () => Object.fromEntries(wards.map((w) => [w.id, riskFor(w, scenario)])) as Record<string, RiskLevel>,
    [wards, scenario]
  );

  const toggleWard = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const subscribers = wards.filter((w) => selectedIds.includes(w.id)).reduce((s, w) => s + w.subscriberCount, 0);
  const alertsToday = alerts.filter((a) => new Date(a.sentAt).toDateString() === new Date().toDateString()).length;

  function handleSent(alert: Alert) {
    setAlerts((prev) => [alert, ...prev]);
    setToast("Alert sent. Delivery is in progress.");
    // Mock delivery progress so the demo shows status changing.
    setTimeout(() => {
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, status: "Sent", deliveredPct: 96 } : a)));
    }, 4000);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <div>
            <h1 className="text-lg font-semibold">FloodSight Nairobi</h1>
            <p className="text-xs text-slate-500">Nairobi County · Disaster Management</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-600 sm:inline">Officer (demo)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-xs font-semibold text-white" aria-hidden>CO</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 lg:p-6">
        {loading ? (
          <p className="py-20 text-center text-sm text-slate-500" role="status">Loading dashboard…</p>
        ) : loadError ? (
          <div className="py-20 text-center" role="alert">
            <p className="text-sm text-red-700">{loadError}</p>
            <button type="button" onClick={load} className="mt-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">Retry</button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <ComposerPanel
                wards={wards} scenarios={SCENARIOS} scenarioId={scenarioId} onScenario={setScenarioId}
                selectedIds={selectedIds} onToggleWard={toggleWard} risks={risks}
                previewId={alerts[0]?.id ?? "demo"} onSent={handleSent}
              />
            </div>
            <div className="space-y-6 lg:col-span-3">
              <StatsCards subscribers={subscribers} reach={Math.round(subscribers * 0.92)} alertsToday={alertsToday} lastAlert={alerts[0]} />
              <WardMap wards={wards} risks={risks} selectedIds={selectedIds} onToggle={toggleWard} />
            </div>
            <div className="lg:col-span-5">
              <AlertHistory alerts={alerts} wards={wards} />
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div role="status" className="fixed bottom-4 right-4 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}