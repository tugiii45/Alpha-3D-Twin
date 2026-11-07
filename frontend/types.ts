export type RiskLevel = "low" | "medium" | "high" | "severe";
export type Language = "en" | "sw";
export type AlertStatus = "Sent" | "Delivering" | "Failed";

export interface PolygonGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

export interface Ward {
  id: string;
  name: string;
  subscriberCount: number;
  vulnerability: number; // PLACEHOLDER multiplier, replace with real data
  roads: string[];
  geometry: PolygonGeometry;
}

export interface Scenario {
  id: string;
  label: string;
  rainfallMm: number;
  hours: number;
}

export interface Alert {
  id: string;
  wardIds: string[];
  riskLevel: RiskLevel;
  message: string;
  language: Language;
  sentAt: string; // ISO string
  deliveredPct: number;
  status: AlertStatus;
}

export interface SendAlertInput {
  wardIds: string[];
  riskLevel: RiskLevel;
  message: string;
  language: Language;
}