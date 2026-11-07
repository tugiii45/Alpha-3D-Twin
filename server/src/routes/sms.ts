import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import type { SendSmsResponse, SmsWebhookResponse } from "../../../config/contracts";
import type { AppConfig } from "../../../config/env";
import { ThriveWaveClient } from "../../../services/thrivewave";
import { AppError } from "../../../config/errors";
import { acceptInboundSms } from "../inbox";
import { asyncHandler } from "../http";
import { asRecord, requiredString } from "../validate";

export function smsRouter(config: AppConfig): Router {
  const client = new ThriveWaveClient(config.thrivewave);
  const router = Router();

  router.post(
    "/send",
    asyncHandler(async (req, res) => {
      const body = asRecord(req.body);
      const result: SendSmsResponse = await client.sendSMS(
        requiredString(body, "to"),
        requiredString(body, "text"),
      );
      res.status(202).json(result);
    }),
  );

  router.post(
    "/webhook",
    asyncHandler(async (req, res) => {
      if (!config.webhookToken) {
        throw new AppError(503, "NOT_CONFIGURED", "Set SMS_WEBHOOK_TOKEN before accepting webhooks");
      }
      const expected = Buffer.from(config.webhookToken);
      const supplied = Buffer.from(req.get("x-webhook-token") ?? "");
      if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
        throw new AppError(401, "UNAUTHORIZED", "Invalid webhook token");
      }
      const result = client.handleWebhook(req.body);
      if (!result.accepted || !result.message) {
        throw new AppError(400, "BAD_REQUEST", "Unrecognized SMS payload");
      }
      acceptInboundSms(result.message);
      const body: SmsWebhookResponse = { accepted: true };
      res.status(200).json(body);
    }),
  );

  return router;
}
