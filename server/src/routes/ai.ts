import { Router } from "express";
import type { AiProcessResponse } from "../../../config/contracts";
import type { AppConfig } from "../../../config/env";
import { CursorAiClient } from "../../../services/cursorAi";
import { asyncHandler } from "../http";
import { asRecord, optionalString, requiredString } from "../validate";

export function aiRouter(config: AppConfig): Router {
  const client = new CursorAiClient(config.cursor);
  const router = Router();

  router.post(
    "/process",
    asyncHandler(async (req, res) => {
      const body = asRecord(req.body);
      const result: AiProcessResponse = await client.process({
        prompt: requiredString(body, "prompt"),
        system: optionalString(body, "system"),
      });
      res.json(result);
    }),
  );

  return router;
}
