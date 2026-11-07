import { useCallback, useEffect, useState } from "react";
import type { HealthResponse } from "@config/contracts";
import { ApiError, getHealth } from "../api";
import { Panel } from "./Panel";

export function HealthCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      setHealth(await getHealth());
    } catch (caught) {
      setHealth(null);
      setError(caught instanceof ApiError ? caught.message : "Health check failed");
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Panel title="Health">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-medium">{health ? "API is up" : "Waiting for API"}</p>
          <p className="mt-1 text-sm text-stone-600">GET /api/health</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={pending}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Checking" : "Check"}
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {health ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Status label="ThriveWave" ready={health.integrations.thrivewave} />
          <Status label="Cursor AI" ready={health.integrations.cursor} />
        </div>
      ) : null}
    </Panel>
  );
}

function Status({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="rounded-xl bg-stone-50 px-3 py-2">
      <p className="text-stone-500">{label}</p>
      <p className="mt-1 font-medium">{ready ? "Configured" : "Not configured"}</p>
    </div>
  );
}
