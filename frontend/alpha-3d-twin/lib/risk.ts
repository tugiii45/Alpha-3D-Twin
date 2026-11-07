import type { RiskLevel, Scenario, Ward } from "@/types";

export const RISK_ORDER: RiskLevel[] = ["low", "medium", "high", "severe"];
export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low", medium: "Medium", high: "High", severe: "Severe",
};
export const RISK_LABEL_SW: Record<RiskLevel, string> = {
  low: "Chini", medium: "Wastani", high: "Juu", severe: "Kali sana",
};
// Okabe-Ito colour-blind-safe palette. Labels are always shown alongside colour.
export const RISK_COLOR: Record<RiskLevel, string> = {
  low: "#56B4E9", medium: "#F0E442", high: "#E69F00", severe: "#D55E00",
};

/**
 * PLACEHOLDER thresholds. Replace with Kenya Meteorological Department
 * advisory levels and calibrated ward vulnerability data.
 * score = rainfall (mm) x ward vulnerability multiplier.
 */
export function riskFor(ward: Ward, scenario: Scenario): RiskLevel {
  const score = scenario.rainfallMm * ward.vulnerability;
  if (score >= 120) return "severe";
  if (score >= 80) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function maxRisk(levels: RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>(
    (top, l) => (RISK_ORDER.indexOf(l) > RISK_ORDER.indexOf(top) ? l : top),
    "low"
  );
}