"use client";
import { useEffect, useMemo, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ExpressionSpecification, Map as MLMap } from "maplibre-gl";
import type { RiskLevel, Ward } from "@/types";
import { RISK_COLOR, RISK_LABEL, RISK_ORDER } from "@/lib/risk";

interface Props {
  wards: Ward[];
  risks: Record<string, RiskLevel>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

const FILL_COLOR = [
  "match", ["get", "risk"],
  "low", RISK_COLOR.low,
  "medium", RISK_COLOR.medium,
  "high", RISK_COLOR.high,
  "severe", RISK_COLOR.severe,
  "#999999",
] as unknown as ExpressionSpecification;

export default function WardMap({ wards, risks, selectedIds, onToggle }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const loaded = useRef(false);
  const toggleRef = useRef(onToggle);
  useEffect(() => { toggleRef.current = onToggle; });

  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: wards.map((w) => ({
        type: "Feature" as const,
        geometry: w.geometry,
        properties: {
          id: w.id,
          name: w.name,
          subscribers: w.subscriberCount,
          risk: risks[w.id] ?? "low",
          selected: selectedIds.includes(w.id),
        },
      })),
    }),
    [wards, risks, selectedIds]
  );
  const dataRef = useRef(data);

  // Push new data into the map whenever it changes.
  useEffect(() => {
    dataRef.current = data;
    if (!loaded.current || !mapRef.current) return;
    const src = mapRef.current.getSource("wards") as { setData: (d: unknown) => void } | undefined;
    src?.setData(data);
  }, [data]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map: MLMap | undefined;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !container.current) return;

      map = new maplibregl.Map({ container: container.current, style: OSM_STYLE, center: [36.82, -1.28], zoom: 10.8 });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

      map.on("load", () => {
        if (!map) return;
        map.addSource("wards", { type: "geojson", data: dataRef.current });
        map.addLayer({
          id: "wards-fill", type: "fill", source: "wards",
          paint: {
            "fill-color": FILL_COLOR,
            "fill-opacity": ["case", ["get", "selected"], 0.65, 0.25] as unknown as ExpressionSpecification,
          },
        });
        map.addLayer({
          id: "wards-line", type: "line", source: "wards",
          paint: {
            "line-color": "#0f172a",
            "line-width": ["case", ["get", "selected"], 3, 1] as unknown as ExpressionSpecification,
          },
        });
        map.on("click", "wards-fill", (e) => {
          const id = e.features?.[0]?.properties?.id;
          if (id) toggleRef.current(String(id));
        });
        map.on("mousemove", "wards-fill", (e) => {
          if (!map) return;
          map.getCanvas().style.cursor = "pointer";
          const p = e.features?.[0]?.properties;
          if (!p) return;
          popup
            .setLngLat(e.lngLat)
            .setText(`${p.name} · ${RISK_LABEL[p.risk as RiskLevel]} risk · ${Number(p.subscribers).toLocaleString()} subscribers`)
            .addTo(map);
        });
        map.on("mouseleave", "wards-fill", () => {
          if (map) map.getCanvas().style.cursor = "";
          popup.remove();
        });
        loaded.current = true;
      });
    })();

    return () => {
      cancelled = true;
      loaded.current = false;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div ref={container} className="h-[420px] w-full" role="region" aria-label="Map of Nairobi wards coloured by flood risk. Use the ward checkboxes to select wards with the keyboard." />
      <div className="absolute bottom-3 left-3 rounded-lg border border-slate-200 bg-white/95 p-2 text-xs shadow-sm">
        <p className="mb-1 font-medium text-slate-700">Flood risk</p>
        <ul className="space-y-1">
          {RISK_ORDER.map((l) => (
            <li key={l} className="flex items-center gap-2 text-slate-600">
              <span className="h-3 w-3 rounded-sm border border-slate-300" style={{ backgroundColor: RISK_COLOR[l] }} aria-hidden />
              {RISK_LABEL[l]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}