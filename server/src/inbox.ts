import type { InboundSms } from "../../services/thrivewave";

/** Feature code receives inbound SMS here. This starter does not store or reply. */
export function acceptInboundSms(message: InboundSms): void {
  void message;
}
