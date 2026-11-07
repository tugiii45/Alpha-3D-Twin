import { AppError } from "../../config/errors";

export function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(400, "BAD_REQUEST", "Expected a JSON object");
  }
  return body as Record<string, unknown>;
}

export function requiredString(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, "BAD_REQUEST", `Field \`${field}\` is required`);
  }
  return value.trim();
}

export function optionalString(record: Record<string, unknown>, field: string): string | undefined {
  const value = record[field];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new AppError(400, "BAD_REQUEST", `Field \`${field}\` must be a string`);
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
