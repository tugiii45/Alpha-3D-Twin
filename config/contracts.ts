export interface HealthResponse {
  status: "ok";
  service: string;
  time: string;
  integrations: {
    thrivewave: boolean;
    cursor: boolean;
  };
}

export interface AiProcessRequest {
  prompt: string;
  system?: string;
}

export interface AiProcessResponse {
  data: unknown;
  model: string;
}

export interface SendSmsRequest {
  to: string;
  text: string;
}

export interface SendSmsResponse {
  id: string;
  status: "queued" | "sent" | "failed";
}

export interface SmsWebhookResponse {
  accepted: boolean;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
