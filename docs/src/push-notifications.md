# Push Notifications

## Two families

The ecosystem uses two push families:

- **Browser push**: for the web app (VAPID key at `/kypost/config/notifications-vapid-private.pem`, subscription endpoints under `/api/notifications/*`).
- **Native push**: for mobile clients through the relay Workers, plus polling fallbacks on each client.

The server README says each user can choose browser notifications for all mail or for keyword matches only, and each user can pair native devices.

## Native push path

```
KyPost poller --> Go server --> Cloudflare Worker (FCM or APNs) --> FCM / APNs --> device
```

- The Go server forwards push to `PUSH_RELAY_URL` with `PUSH_RELAY_KEY` (Android/FCM) or `APNS_RELAY_URL` with `APNS_RELAY_KEY` (iOS/APNs).
- Each needs `https://` except for loopback, because the relay key travels on each request.
- Self-hosters ask the relay operator for per-server API keys. See [Push Relays](./server/push-relays.md) for self-registration.

Payload keys from the README: `messageId`, `senderName`, `emailSubject`, `Keywords` (and `token`, `title`, `body`, `data`, `platform`). The Workers translate them to FCM or APNs shapes. Both platforms handle the full payload identically client-side (APNs `worker-apns/README.md` shows the mapping).

## Generic notifications by default

The server README says push notifications are generic by default because subject lines are not encrypted in ordinary PGP/MIME. The marketing site also notes protected subjects and generic push.

## Client specifics

### Android (from `kypost-android/README.md`)

- Delivery modes: `push` or `pull`, per user on the web Notifications page. `pull` means the server sends nothing to FCM and the app polls directly.
- FCM path: data payload keys `messageId`, `senderName`, `emailSubject`, `Keywords`; system notifications plus in-app history; each user selects `push` or `pull`; `POST_NOTIFICATIONS` permission on Android 13+.
- Pull path: `GET {pullEndpoint}?sub=&hash=&after=<cursor>` with `hash` HMAC, `seq` dedup, `lastCursor` durable per subscriber, only after delivery; respects `deliveryMode` from register and pull responses on each foreground; background WorkManager at 15 minutes plus foreground pull; optional foreground service for near real-time with a persistent notification (not the default); backs off on `400`, `401`, `503`, network errors.
- Storage: `deliveryMode` and `pullEndpoint` stored; if `pullEndpoint` absent, derived as `{srv}/api/notifications/native/pull`.

### macOS & iOS (from `kypost-for-Mac/README.md`)

- APNs for new mail and MFA challenges. Polling fallback runs at 90 s in the foreground, background refresh on iOS.
- If Security → Require unlock for notifications and MFA is on, background checks wait until you open and unlock the app. On iPhone this covers all background delivery. On Mac it applies while the screen is locked.

### Linux (from `kypost-Linux/README.md`)

- UnifiedPush with two tiers and fallback: distributor first, then 90-second polling. Only the distributor push server sees a notification. Mail still arrives with no distributor installed.

## Server API for native push

- `POST /api/notifications/native/register` (pairing token auth)
- `GET|DELETE /api/notifications/native/devices`
- `POST /api/notifications/native/unpair`

## Relay protection

- Per-minute limiter (10/min), per-IP register limiter, optional aggregate daily budget `RELAY_DAILY_BUDGET`. See [Push Relays](./server/push-relays.md).
- Token pinning: first key to deliver to a token claims it; revoked keys release claims after ~60 s; Durable Object enforces it.

## What the READMEs do not say

- Exact browser push enrollment steps beyond `GET /api/notifications/vapid-public-key` and `POST|DELETE /api/notifications/subscriptions`.
- No mention of sound, badge counts, or notification grouping.
