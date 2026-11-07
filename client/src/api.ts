import type {
  AiProcessRequest,
  AiProcessResponse,
  ApiErrorBody,
  HealthResponse,
  SendSmsRequest,
  SendSmsResponse,
} from "@config/contracts";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export function processPrompt(body: AiProcessRequest): Promise<AiProcessResponse> {
  return request<AiProcessResponse>("/api/ai/process", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function sendSms(body: SendSmsRequest): Promise<SendSmsResponse> {
  return request<SendSmsResponse>("/api/sms/send", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, readErrorMessage(payload, response.status));
  }
  return payload as T;
}

function readErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as ApiErrorBody).error;
    if (error && typeof error.message === "string" && error.message.trim() !== "") {
      return error.message;
    }
  }
  return `Request failed (${status})`;
}
