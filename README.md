# Hackathon starter

A small TypeScript API and React client with room for three integrations: a container host, ThriveWave SMS, and an OpenAI-compatible model route. No product logic is included.

```
client/     React + Tailwind
server/     Express routes
services/   ThriveWave and model clients
config/     Environment and shared HTTP contracts
```

## Local

Requires Node.js 20 or newer.

```bash
cd hackathon-starter
cp .env.example .env
npm install
npm run dev
```

The API listens on port 8080. The client runs on port 5173 and proxies `/api` to it. `npm run build && npm start` serves the built client and the API from port 8080.

## RumptyCloud

The production image listens on port 8080 and is healthy when `GET /api/health` returns 200.

```bash
cp .env.example .env
npm run deploy
```

`scripts/deploy-rumpty.mjs` builds the image tagged `rumptycloud-app:latest`, starts it with Docker Compose, and polls the health route. Fill in the API keys in `.env` before you send SMS or call the model. The container always uses port 8080 internally. Set `HOST_PORT` if 8080 is already taken on the host.

Push `rumptycloud-app:latest` to the registry RumptyCloud gives you, or point the host at `docker-compose.yml`. The image runs as a non-root user and includes the same health check.

Manual equivalent:

```bash
docker compose up -d --build
curl http://127.0.0.1:8080/api/health
```

## HTTP

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| GET | `/api/health` | | `{ status, service, time, integrations }` |
| POST | `/api/ai/process` | `{ prompt, system? }` | `{ data, model }` |
| POST | `/api/sms/send` | `{ to, text }` | `{ id, status }` |
| POST | `/api/sms/webhook` | provider JSON plus `X-Webhook-Token` | `{ accepted: true }` |

Errors use `{ error: { code, message } }`. Missing credentials return `503` with code `NOT_CONFIGURED`. The process stays up so the health check still passes.

### Model route

`CursorAiClient` posts to `{CURSOR_BASE_URL}/v1/chat/completions` with `response_format: json_object`, then parses the message content as JSON. Use any host that speaks that contract. `CURSOR_MODEL` defaults to `gpt-4o-mini`.

### ThriveWave

`ThriveWaveClient.sendSMS(to, text)` posts to `{THRIVEWAVE_BASE_URL}/v1/message/send` with the `x-api-key` header and JSON `{ message, msisdn, sender_id? }`. ThriveVas returns a `transaction_id`; the app maps it to the response `id` and reports the initial status as queued. `THRIVEWAVE_SENDER_ID` is optional because the provider supplies a default.

`handleWebhook(payload)` accepts a loose JSON body. Any of these shapes is enough:

```json
{ "from": "+15551212", "to": "+15550000", "text": "hello" }
```

`from` may also be `msisdn` or `sender`. `text` may also be `body` or `message`. A nested `data` object is read the same way. The route acknowledges the message and does not store it or reply. It requires `X-Webhook-Token` to match `SMS_WEBHOOK_TOKEN`; configure the same secret with the provider. If the provider cannot send a custom header, use its documented signature mechanism before enabling the webhook.

## Environment

| Name | Purpose |
| --- | --- |
| `PORT` | Local listen port. Docker forces `8080`. |
| `CORS_ORIGINS` | Comma-separated browser origins allowed in production. |
| `SMS_WEBHOOK_TOKEN` | Shared secret required for inbound SMS webhook requests. |
| `THRIVEWAVE_API_KEY` | API key sent in the `x-api-key` header. |
| `THRIVEWAVE_SENDER_ID` | Optional sender ID sent as `sender_id`. |
| `THRIVEWAVE_BASE_URL` | Provider origin, for example `https://sms.thrivevas.com`, without a trailing path. |
| `CURSOR_API_KEY` | Bearer token for chat completions. |
| `CURSOR_BASE_URL` | OpenAI-compatible origin. Defaults to `https://api.openai.com`. |
| `CURSOR_MODEL` | Model name. Defaults to `gpt-4o-mini`. |

AI and SMS routes are limited per client IP to 30 and 20 requests per minute. This in-memory limit is per process; use a shared limiter when running multiple instances. Add application authentication before exposing these routes as a public multi-user service.

## Where a feature goes

Add the request and response types to `config/contracts.ts`. Call the outside system from a method on the existing service. Validate input in a route under `server/src/routes`, then render it from `client/src/components`. Conventions for that split are in `.cursorrules` and `.cursor/rules/fullstack.mdc`.
