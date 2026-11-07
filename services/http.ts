import { AppError } from "../config/errors";

export async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new AppError(502, "UPSTREAM", message);
  }

  const text = await response.text();
  const parsed = text ? parseJson(text) : null;
  if (!response.ok) {
    throw new AppError(502, "UPSTREAM", upstreamMessage(response.status, parsed, text));
  }
  return parsed;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function upstreamMessage(status: number, parsed: unknown, text: string): string {
  if (parsed && typeof parsed === "object" && "error" in parsed) {
    const detail = (parsed as { error: unknown }).error;
    const message =
      detail && typeof detail === "object" && "message" in detail
        ? String((detail as { message: unknown }).message)
        : JSON.stringify(detail);
    return `Upstream ${status}: ${message}`;
  }
  const snippet = text.replace(/\s+/g, " ").slice(0, 240);
  return `Upstream ${status}: ${snippet || "request failed"}`;
}
