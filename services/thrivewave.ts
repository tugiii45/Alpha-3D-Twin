import { AppError } from "../config/errors";
import type { SendSmsResponse } from "../config/contracts";
import { postJson } from "./http";

/** Replace this path when the ThriveWave spec names the real send endpoint. */
const SEND_PATH = "/messages";

export interface ThriveWaveConfig {
  apiKey: string;
  senderId: string;
  baseUrl: string;
}

export interface InboundSms {
  from: string;
  to: string;
  text: string;
  receivedAt: string;
  raw: unknown;
}

export interface WebhookResult {
  accepted: boolean;
  message?: InboundSms;
}

export class ThriveWaveClient {
  constructor(private readonly config: ThriveWaveConfig) {}

  async sendSMS(to: string, text: string): Promise<SendSmsResponse> {
    this.assertConfigured();
    const payload = await postJson(
      `${this.config.baseUrl}${SEND_PATH}`,
      {
        to,
        text,
        sender_id: this.config.senderId,
      },
      { Authorization: `Bearer ${this.config.apiKey}` },
    );
    return normalizeSendResult(payload);
  }

  /**
   * Map a provider webhook body onto a generic inbound message.
   * Signature checks belong here once the provider documents them.
   */
  handleWebhook(payload: unknown): WebhookResult {
    const record = asRecord(payload);
    if (!record) return { accepted: false };

    const source = nestedRecord(record, "data") ?? record;
    const from = readString(source, ["from", "msisdn", "sender"]);
    const text = readString(source, ["text", "body", "message"]);
    if (!from || !text) return { accepted: false };

    return {
      accepted: true,
      message: {
        from,
        to: readString(source, ["to", "recipient", "destination"]) ?? "",
        text,
        receivedAt: readString(source, ["receivedAt", "timestamp", "time"]) ?? new Date().toISOString(),
        raw: payload,
      },
    };
  }

  private assertConfigured(): void {
    if (!this.config.apiKey || !this.config.senderId || !this.config.baseUrl) {
      throw new AppError(
        503,
        "NOT_CONFIGURED",
        "Set THRIVEWAVE_API_KEY, THRIVEWAVE_SENDER_ID, and THRIVEWAVE_BASE_URL before sending SMS",
      );
    }
  }
}

function normalizeSendResult(payload: unknown): SendSmsResponse {
  const record = asRecord(payload);
  const id = record ? readString(record, ["id", "message_id", "messageId"]) : undefined;
  if (!id) {
    throw new AppError(502, "UPSTREAM", "ThriveWave response did not include an id");
  }
  return {
    id,
    status: normalizeStatus(record?.status),
  };
}

function normalizeStatus(value: unknown): SendSmsResponse["status"] {
  if (value === "sent" || value === "queued" || value === "failed") return value;
  return "queued";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function nestedRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  return asRecord(record[key]);
}

function readString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return undefined;
}
