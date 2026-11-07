import type { Alert, PolygonGeometry, Scenario, Ward } from "@/types";

// Rough boxes around each area. Replace with real ward boundary GeoJSON.
const box = (lng: number, lat: number, w = 0.022, h = 0.018): PolygonGeometry => ({
  type: "Polygon",
  coordinates: [[
    [lng - w / 2, lat - h / 2], [lng + w / 2, lat - h / 2],
    [lng + w / 2, lat + h / 2], [lng - w / 2, lat + h / 2],
    [lng - w / 2, lat - h / 2],
  ]],
});

// Subscriber counts, vulnerability and road names are placeholders. Verify before presenting.
export const WARDS: Ward[] = [
  { id: "mathare", name: "Mathare", subscriberCount: 12400, vulnerability: 1.0, roads: ["Juja Rd", "Outer Ring Rd"], geometry: box(36.858, -1.259) },
  { id: "mukuru", name: "Mukuru kwa Njenga", subscriberCount: 9800, vulnerability: 0.9, roads: ["Enterprise Rd", "Mombasa Rd service lane"], geometry: box(36.88, -1.314) },
  { id: "kibera", name: "Kibera", subscriberCount: 15200, vulnerability: 0.85, roads: ["Ngong Rd", "Kibera Drive"], geometry: box(36.789, -1.313) },
  { id: "kawangware", name: "Kawangware", subscriberCount: 8600, vulnerability: 0.7, roads: ["Naivasha Rd", "Riruta Link Rd"], geometry: box(36.745, -1.283) },
  { id: "korogocho", name: "Korogocho", subscriberCount: 6900, vulnerability: 0.95, roads: ["Kamunde Rd", "Outer Ring Rd"], geometry: box(36.887, -1.243) },
];

export const SCENARIOS: Scenario[] = [
  { id: "moderate", label: "Moderate", rainfallMm: 50, hours: 48 },
  { id: "heavy", label: "Heavy", rainfallMm: 100, hours: 48 },
  { id: "extreme", label: "Extreme", rainfallMm: 150, hours: 48 },
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const INITIAL_ALERTS: Alert[] = [
  { id: "a-1006", wardIds: ["mathare", "korogocho"], riskLevel: "high", message: "FLOOD RISK HIGH in Mathare, Korogocho from Tue. Avoid Juja Rd, Kamunde Rd. See your area: https://fs.ke/k8d2mq", language: "en", sentAt: hoursAgo(2), deliveredPct: 97, status: "Sent" },
  { id: "a-1005", wardIds: ["kibera"], riskLevel: "medium", message: "HATARI YA MAFURIKO WASTANI katika Kibera kuanzia Jumatano. Epuka Ngong Rd. Angalia eneo lako: https://fs.ke/p3x9ta", language: "sw", sentAt: hoursAgo(26), deliveredPct: 95, status: "Sent" },
  { id: "a-1004", wardIds: ["mukuru"], riskLevel: "severe", message: "FLOOD RISK SEVERE in Mukuru kwa Njenga from Mon. Avoid Enterprise Rd. See your area: https://fs.ke/z1w7rb", language: "en", sentAt: hoursAgo(50), deliveredPct: 91, status: "Sent" },
  { id: "a-1003", wardIds: ["kawangware", "kibera"], riskLevel: "medium", message: "FLOOD RISK MEDIUM in Kawangware, Kibera from Fri. Avoid Naivasha Rd, Ngong Rd. See your area: https://fs.ke/m5c0ye", language: "en", sentAt: hoursAgo(75), deliveredPct: 62, status: "Failed" },
  { id: "a-1002", wardIds: ["mathare"], riskLevel: "low", message: "FLOOD RISK LOW in Mathare from Sun. Avoid Juja Rd. See your area: https://fs.ke/q9n4vh", language: "en", sentAt: hoursAgo(120), deliveredPct: 98, status: "Sent" },
];