import type { AiProcessResponse } from "../config/contracts";
import { AppError } from "../config/errors";
import { postJson } from "./http";

export interface CursorAiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ProcessInput {
  prompt: string;
  system?: string;
}

/**
 * OpenAI-compatible chat client. `baseUrl` may be OpenAI or a Cursor
 * gateway that exposes `POST /v1/chat/completions`.
 */
export class CursorAiClient {
  constructor(private readonly config: CursorAiConfig) {}

  async process(input: ProcessInput): Promise<AiProcessResponse> {
    if (!this.config.apiKey) {
      throw new AppError(503, "NOT_CONFIGURED", "Set CURSOR_API_KEY before calling the model");
    }

    const payload = await postJson(
      chatCompletionsUrl(this.config.baseUrl),
      {
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: systemPrompt(input.system),
          },
          { role: "user", content: input.prompt },
        ],
        response_format: { type: "json_object" },
      },
      { Authorization: `Bearer ${this.config.apiKey}` },
    );

    const completion = readCompletion(payload, this.config.model);
    return {
      data: parseModelJson(completion.content),
      model: completion.model,
    };
  }
}

function systemPrompt(extra: string | undefined): string {
  const instruction = "Reply with one JSON object and no surrounding prose.";
  const trimmed = extra?.trim();
  return trimmed ? `${trimmed}\n\n${instruction}` : instruction;
}

function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

function readCompletion(payload: unknown, fallbackModel: string): { content: string; model: string } {
  if (!payload || typeof payload !== "object") {
    throw new AppError(502, "UPSTREAM", "AI response was empty");
  }
  const record = payload as Record<string, unknown>;
  const model = typeof record.model === "string" ? record.model : fallbackModel;
  const choices = record.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new AppError(502, "UPSTREAM", "AI response did not include choices");
  }
  const first = choices[0];
  if (!first || typeof first !== "object") {
    throw new AppError(502, "UPSTREAM", "AI response choice was malformed");
  }
  const message = (first as Record<string, unknown>).message;
  if (!message || typeof message !== "object") {
    throw new AppError(502, "UPSTREAM", "AI response did not include a message");
  }
  const content = (message as Record<string, unknown>).content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new AppError(502, "UPSTREAM", "AI response content was empty");
  }
  return { content, model };
}

export function parseModelJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new AppError(502, "AI_PARSE", "Model response was not JSON");
    }
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    } catch {
      throw new AppError(502, "AI_PARSE", "Model response was not JSON");
    }
  }
}
