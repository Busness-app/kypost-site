# Server — Push Relays

Two Cloudflare Workers deliver native push. The maintainer runs them. Self-hosters use them through a per-server API key. No Firebase or Apple Developer account is needed, and no app recompile is needed.

- **Android/FCM**: `kypost-server/worker/` — Firebase Cloud Messaging
- **iOS/APNs**: `kypost-server/worker-apns/` — Apple Push Notification service

```
self-hosted Go server --Bearer key--> Worker --service account / APNs key--> FCM / APNs --> device
```

## Why a relay exists

The published apps are built against one Firebase project and one Apple bundle ID. Only a holder of those credentials can deliver push to them. The relay holds the one service account and the one APNs auth key. Servers forward push requests to the relay.

The backend never holds Firebase credentials and never reads `google-services.json`. That file belongs in the mobile project at `app/google-services.json` and must not be committed.

## Endpoints (both workers)

Both workers expose three routes. Anything else returns `404`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /health | none | Liveness and whether configured |
| POST | /register | none | Self-issue a per-server key |
| POST | /send | Bearer key | Deliver one push |

### POST /send body

FCM and APNs workers accept the same JSON from the Go backend:

```json
{ "token": "<FCM or APNs token>", "title": "...", "body": "...", "data": { "url": "/read" }, "platform": "android" }
```

APNs payload example after translation:

```json
{
  "aps": { "alert": { "title": "...", "body": "..." }, "sound": "default", "mutable-content": 1 },
  "messageId": "msg-123", "senderName": "...", "emailSubject": "...", "Keywords": "..."
}
```

### Responses

- `200 {"ok":true}` on delivery
- `403` when the token is claimed by a different active key (token pinning)
- `410 {"stale":true}` when the token is no longer registered (Go server removes the device)
- `401` for a bad or expired key
- `429` when the per-key or daily budget limit is exceeded
- `413` when the body exceeds 16 KiB
- `400` for a malformed body
- `502 {"error":"push delivery failed"}` for upstream errors (deliberately coarse; upstream text stays in operator logs)
- Every error body has a `requestId` that matches the `X-Request-Id` header.

Body limits before reaching FCM/APNs:

| Field | Limit | Over limit |
|---|---|---|
| body total | 16 KiB | 413 |
| token | 512 chars | 400 |
| title | 256 chars | clipped |
| body | 1024 chars | clipped |
| data | 16 entries, keys 64 chars, values 1024 chars | 400 or clipped |
| unknown fields | — | ignored |

Titles and bodies are clipped rather than refused. The Go backend treats a dropped notification as worse than a long subject line.

## Token pinning

The first key that delivers to a device token claims it. Later sends to that token must come from the same key, or the worker rejects with `403`. This stops an open-relay gap that self-registration would otherwise leave.

- A claim releases only if the owning key is revoked, disabled, or expired, and only while no delivery ever succeeded under it.
- A claim younger than 60 seconds is never taken over (KV convergence).
- The `RELAY_COORDINATOR` Durable Object holds ownership, not KV, so check-then-write is atomic. All requests for one token route to one instance.

Deleting the key record also releases its claims for re-claiming.

## Self-registration

Off by default. The shipped `wrangler.toml.example` sets `REGISTRATION_ENABLED = "false"`. Set it to `"true"` and redeploy to open `/register`. With registration closed, the relay issues no keys.

Once open, the Go backend self-registers on first start when `PUSH_RELAY_URL` (or `APNS_RELAY_URL`) is set and no key exists. It calls `POST /register` with `{"label":"..."}` and persists the key under `SECRET_DIR`.

One active key per IP. Re-registering from the same IP mints a new key and invalidates the previous one. Servers behind the same public IP share one slot (latest wins). Self-registered keys never expire and are tagged `"source":"self"`.

## Rate limits and budget

- **Per-minute** limit on `/send`, enforced by native `PUSH_RATE_LIMITER` binding: `simple = { limit = 10, period = 60 }`, fixed 60s window, no KV writes. `RATE_LIMIT_PER_MINUTE` in `[vars]` is display-only and must match `simple.limit`. Exceeding returns `429` with `{"window":"minute"}` and `Retry-After`.
- **Rolling hour/day limits were removed** (they used KV read-modify-write and capped free tier at ~1000 pushes/day; an accepted send now does zero KV writes).
- **Daily ceiling** `RELAY_DAILY_BUDGET` in `[vars]`: aggregate across all keys per UTC day, counted by the `RELAY_COORDINATOR`. Unset means unmetered. `0` means closed. Exceeding returns `429` with `{"window":"day"}` and `Retry-After` to midnight. Not surfaced on `/health`.
- `/register` has its own per-IP limiter `REGISTER_RATE_LIMITER`, bucketed on IPv6 /64.

Both fail closed. A missing binding refuses the request. `/register` also returns `503` with no usable `CF-Connecting-IP`. `/send` and `/register` return `503` without the Durable Object binding.

## Key management

There is no admin API and no `ADMIN_SECRET`. Manage keys through KV with Wrangler. Records live in the `API_KEYS` namespace under three prefixes: `key:<sha256>`, `keyid:<id>`, `ipkey:<bucket>`.

```sh
NS=<your API_KEYS namespace id>

npx wrangler kv key list --namespace-id $NS --prefix "key:"
npx wrangler kv key get  --namespace-id $NS "key:<hash>"

HASH=$(npx wrangler kv key get --namespace-id $NS "keyid:<id>")
npx wrangler kv key delete --namespace-id $NS "key:$HASH"
npx wrangler kv key delete --namespace-id $NS "keyid:<id>"
npx wrangler kv key delete --namespace-id $NS "ipkey:<registeredIp>"
```

Send counts and last-seen are in Analytics Engine (`kypost_push_usage`), not in KV.

## Setup (maintainer)

Install, log in, create KV namespaces, paste IDs into `wrangler.toml` (gitignored, template is `wrangler.toml.example`), set secrets, deploy:

```sh
cd worker         # or worker-apns
npm install
npx wrangler login
cp wrangler.toml.example wrangler.toml
npx wrangler kv namespace create API_KEYS
npx wrangler kv namespace create OAUTH_CACHE        # FCM
npx wrangler kv namespace create APNS_TOKEN_CACHE   # APNs
npx wrangler secret put FCM_CLIENT_EMAIL
npx wrangler secret put FCM_PRIVATE_KEY
npx wrangler secret put FCM_PROJECT_ID
# APNs instead:
npx wrangler secret put APNS_AUTH_KEY
npx wrangler secret put APNS_KEY_ID
npx wrangler secret put APNS_TEAM_ID
npx wrangler secret put APNS_TOPIC
npx wrangler secret put APNS_ENVIRONMENT   # production or sandbox; unset means production
npx wrangler deploy
```

The `[[migrations]]` block creates the `RELAY_COORDINATOR` Durable Object on first deploy.

## APNs notes

- APNs requires HTTP/2. Workers `fetch()` negotiates it via ALPN.
- The provider token (JWT from `.p8`) caches for ~29 minutes (Apple allows ~60). The worker refreshes it and clears cache on invalid token.
- Rotate the `.p8` key yearly. Apple sends renewal notices.

## Observability

- Each request gets a UUID `requestId` in `X-Request-Id` and error bodies. One JSON log line per request. Tail with `npx wrangler tail`.
- `GET /health` returns `{ ok, configured, rateLimits: { perMinute }, registrationEnabled }` with no auth. `configured` is false until all secrets are set.

## APNs environment split

Duplicate `wrangler.toml` to `wrangler.prod.toml`, set per-env namespace IDs and `APNS_ENVIRONMENT`, then `npx wrangler deploy --env dev` and `prod`. Point the backend at the right `APNS_RELAY_URL`.
