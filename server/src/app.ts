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
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter(config));
  app.use("/api/ai", aiRouter(config));
  app.use("/api/sms", smsRouter(config));
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
  });

  if (config.nodeEnv === "production") {
    const clientDir = path.resolve(process.cwd(), "client/dist");
    app.use(express.static(clientDir));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        next();
        return;
      }
      res.sendFile(path.join(clientDir, "index.html"), (error) => {
        if (error && !res.headersSent) next(error);
      });
    });
  }

  app.use(errorHandler);
  return app;
}
