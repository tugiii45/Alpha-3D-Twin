import dotenv from "dotenv";
import path from "path";
import { AppError } from "./errors";

export interface AppConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  thrivewave: {
    apiKey: string;
    senderId: string;
    baseUrl: string;
  };
  cursor: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
}

export function loadConfig(overrides: NodeJS.ProcessEnv = {}): AppConfig {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  const env = { ...process.env, ...overrides };

  return {
    port: readPort(env.PORT),
    nodeEnv: readNodeEnv(env.NODE_ENV),
    thrivewave: {
      apiKey: readString(env.THRIVEWAVE_API_KEY),
      senderId: readString(env.THRIVEWAVE_SENDER_ID),
      baseUrl: trimSlash(readString(env.THRIVEWAVE_BASE_URL)),
    },
    cursor: {
      apiKey: readString(env.CURSOR_API_KEY),
      baseUrl: trimSlash(readString(env.CURSOR_BASE_URL) || "https://api.openai.com"),
      model: readString(env.CURSOR_MODEL) || "gpt-4o-mini",
    },
  };
}

function readPort(value: string | undefined): number {
  const port = Number(value || "8080");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new AppError(500, "CONFIG", "PORT must be an integer between 1 and 65535");
  }
  return port;
}

function readNodeEnv(value: string | undefined): AppConfig["nodeEnv"] {
  if (value === "production" || value === "test") return value;
  return "development";
}

function readString(value: string | undefined): string {
  return value?.trim() ?? "";
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
