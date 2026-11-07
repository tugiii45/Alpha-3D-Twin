import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../../config/errors";

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "Invalid JSON" } });
    return;
  }
  console.error(req.method, req.path, err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Unexpected error" } });
}
