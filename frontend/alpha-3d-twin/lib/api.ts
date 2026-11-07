import type { Alert, SendAlertInput, Ward } from "@/types";
import { INITIAL_ALERTS, WARDS } from "./mock";

// Swap each function body for a fetch() call when the real backend exists:
//   GET /wards   GET /alerts   POST /alerts
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MOCK_FAILURE_RATE = 0; // set to e.g. 0.3 to demo the error state

export async function getWards(): Promise<Ward[]> {
  await delay(300);
  return WARDS;
}

export async function getAlerts(): Promise<Alert[]> {
  await delay(300);
  return INITIAL_ALERTS;
}

export async function sendAlert(input: SendAlertInput): Promise<Alert> {
  await delay(1500);
  if (Math.random() < MOCK_FAILURE_RATE) {
    throw new Error("The SMS gateway did not respond. Please try again.");
  }
  return {
    id: `a-${Date.now()}`,
    ...input,
    sentAt: new Date().toISOString(),
    deliveredPct: 0,
    status: "Delivering",
  };
}