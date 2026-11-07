import type { Language, RiskLevel } from "@/types";
import { RISK_LABEL, RISK_LABEL_SW } from "./risk";

export const SMS_COST_KES = 0.8; // mock constant per SMS segment
export const SHORT_LINK = "https://fs.ke/abc123"; // placeholder
export const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAYS_SW = ["Jumatatu", "Jumanne", "Jumatano", "Alhamisi", "Ijumaa", "Jumamosi", "Jumapili"];

export function buildDraft(opts: {
  language: Language;
  wardNames: string[];
  risk: RiskLevel;
  dayIdx: number;
  roads: string[];
}): string {
  const wards = opts.wardNames.join(", ");
  const roads = opts.roads.join(", ");
  if (opts.language === "sw") {
    return `HATARI YA MAFURIKO ${RISK_LABEL_SW[opts.risk].toUpperCase()} katika ${wards} kuanzia ${DAYS_SW[opts.dayIdx]}. Epuka ${roads}. Angalia eneo lako: ${SHORT_LINK}`;
  }
  return `FLOOD RISK ${RISK_LABEL[opts.risk].toUpperCase()} in ${wards} from ${DAYS_EN[opts.dayIdx]}. Avoid ${roads}. See your area: ${SHORT_LINK}`;
}

export function segmentCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / 160));
}