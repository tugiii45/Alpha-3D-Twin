import { AppError } from "../config/errors";
import type { SendSmsResponse } from "../config/contracts";
import { postJson } from "./http";

const SEND_PATH = "/v1/message/send";

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
    const body: Record<string, string> = { message: text, msisdn: to };
    if (this.config.senderId) body.sender_id = this.config.senderId;
    const payload = await postJson(
      `${this.config.baseUrl}${SEND_PATH}`,
      body,
      { "x-api-key": this.config.apiKey },
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
    if (!this.config.apiKey || !this.config.baseUrl) {
      throw new AppError(
        503,
        "NOT_CONFIGURED",
        "Set THRIVEWAVE_API_KEY and THRIVEWAVE_BASE_URL before sending SMS",
      );
    }
  }
}

function normalizeSendResult(payload: unknown): SendSmsResponse {
  const record = asRecord(payload);
  const statusCode = record?.status;
  if (typeof statusCode === "number" && statusCode >= 400) {
    const message = (record ? readString(record, ["message"]) : undefined) ?? "Provider rejected the SMS request";
    throw new AppError(502, "UPSTREAM", `ThriveVas ${statusCode}: ${message}`);
  }
  const rawId = record?.transaction_id ?? record?.id ?? record?.message_id ?? record?.messageId;
  const id = typeof rawId === "number" || typeof rawId === "string" ? String(rawId) : undefined;
  if (!id) {
    const message = record ? readString(record, ["message"]) : undefined;
    throw new AppError(502, "UPSTREAM", message ?? "ThriveVas response did not include a transaction id");
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
