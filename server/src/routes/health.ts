import { Router } from "express";
import type { HealthResponse } from "../../../config/contracts";
import type { AppConfig } from "../../../config/env";

export function healthRouter(config: AppConfig): Router {
  const router = Router();
  router.get("/", (_req, res) => {
    const body: HealthResponse = {
      status: "ok",
      service: "hackathon-starter",
      time: new Date().toISOString(),
      integrations: {
        thrivewave: Boolean(
          config.thrivewave.apiKey && config.thrivewave.senderId && config.thrivewave.baseUrl,
        ),
        cursor: Boolean(config.cursor.apiKey),
      },
    };
    res.json(body);
  });
  return router;
}
