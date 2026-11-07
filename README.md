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
| POST | `/api/sms/webhook` | provider JSON | `{ accepted: true }` |

Errors use `{ error: { code, message } }`. Missing credentials return `503` with code `NOT_CONFIGURED`. The process stays up so the health check still passes.

### Model route

`CursorAiClient` posts to `{CURSOR_BASE_URL}/v1/chat/completions` with `response_format: json_object`, then parses the message content as JSON. Use any host that speaks that contract. `CURSOR_MODEL` defaults to `gpt-4o-mini`.

### ThriveWave

`ThriveWaveClient.sendSMS(to, text)` posts `{ to, text, sender_id }` to `{THRIVEWAVE_BASE_URL}/messages`. Change `SEND_PATH` in `services/thrivewave.ts` when the real path is known.

`handleWebhook(payload)` accepts a loose JSON body. Any of these shapes is enough:

```json
{ "from": "+15551212", "to": "+15550000", "text": "hello" }
```

`from` may also be `msisdn` or `sender`. `text` may also be `body` or `message`. A nested `data` object is read the same way. The route acknowledges the message and does not store it or reply.

## Environment

| Name | Purpose |
| --- | --- |
| `PORT` | Local listen port. Docker forces `8080`. |
| `THRIVEWAVE_API_KEY` | Bearer token for send requests. |
| `THRIVEWAVE_SENDER_ID` | Sent as `sender_id`. |
| `THRIVEWAVE_BASE_URL` | Provider origin, without a trailing path. |
| `CURSOR_API_KEY` | Bearer token for chat completions. |
| `CURSOR_BASE_URL` | OpenAI-compatible origin. Defaults to `https://api.openai.com`. |
| `CURSOR_MODEL` | Model name. Defaults to `gpt-4o-mini`. |

## Where a feature goes

Add the request and response types to `config/contracts.ts`. Call the outside system from a method on the existing service. Validate input in a route under `server/src/routes`, then render it from `client/src/components`. Conventions for that split are in `.cursorrules` and `.cursor/rules/fullstack.mdc`.
