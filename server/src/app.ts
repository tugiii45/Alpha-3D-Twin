import cors from "cors";
import express, { type Express } from "express";
import path from "path";
import type { AppConfig } from "../../config/env";
import { errorHandler } from "./http";
import { aiRouter } from "./routes/ai";
import { healthRouter } from "./routes/health";
import { smsRouter } from "./routes/sms";

export function createApp(config: AppConfig): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  const allowedOrigins = config.corsOrigins.length
    ? config.corsOrigins
    : config.nodeEnv === "production"
      ? []
      : ["http://localhost:5173", "http://127.0.0.1:5173"];
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter(config));
  app.use("/api/ai", requestLimit(30, 60_000), aiRouter(config));
  app.use("/api/sms", requestLimit(20, 60_000), smsRouter(config));
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
  });

  if (config.nodeEnv === "production") {
    const deskDir = path.resolve(process.cwd(), "floodsight");
    app.use(express.static(deskDir));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        next();
        return;
      }
      res.sendFile(path.join(deskDir, "index.html"), (error) => {
        if (error && !res.headersSent) next(error);
      });
    });
  }

  app.use(errorHandler);
  return app;
}

function requestLimit(maxRequests: number, windowMs: number): express.RequestHandler {
  const clients = new Map<string, { count: number; resetAt: number }>();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let entry = clients.get(key);
    if (!entry || entry.resetAt <= now) {
      if (!entry && clients.size >= 10_000) {
        for (const [client, value] of clients) {
          if (value.resetAt <= now) clients.delete(client);
        }
        if (clients.size >= 10_000) {
          res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many requests" } });
          return;
        }
      }
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > maxRequests) {
      res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many requests" } });
      return;
    }
    next();
  };
}
