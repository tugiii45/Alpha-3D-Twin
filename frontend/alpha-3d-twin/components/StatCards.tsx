import type { Alert } from "@/types";

interface Props {
  subscribers: number;
  reach: number;
  alertsToday: number;
  lastAlert?: Alert;
}

export default function StatsCards({ subscribers, reach, alertsToday, lastAlert }: Props) {
  const cards = [
    { label: "Registered subscribers", value: subscribers.toLocaleString(), hint: "Selected wards" },
    { label: "Estimated reach", value: reach.toLocaleString(), hint: "Assumes ~92% delivery (mock)" },
    { label: "Alerts sent today", value: String(alertsToday), hint: "All wards" },
    { label: "Last alert status", value: lastAlert ? lastAlert.status : "None", hint: lastAlert ? `${lastAlert.deliveredPct}% delivered` : "No alerts yet" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{c.value}</p>
          <p className="mt-0.5 text-xs text-slate-400">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}