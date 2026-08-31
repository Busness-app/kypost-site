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

Push notifications are generic by default because subject lines are not
encrypted in ordinary PGP/MIME. Sender and subject reach FCM or APNs only if the
user turns previews on.

**Encrypted mail is excluded from push payloads entirely**, whatever the Content
Preview setting, because native push travels through a relay and on to FCM or
APNs in cleartext at every hop. Under Hostile Location Protection on Android,
notifications carry no sender and no subject whether or not the app is locked.

Native push providers handle the payload sent to them and can observe delivery
metadata such as device tokens and timing. Web Push is different: its payload
is encrypted to the browser's subscription keys.

## Client specifics

### Android (from `kypost-android/README.md`)

- Transports: **FCM**, a **UnifiedPush** distributor you choose, or **App Pull**, which polls your own server and involves neither Google nor a distributor.
- Delivery modes: `push` or `pull`, per user on the web Notifications page. `pull` means the server sends nothing to FCM and the app polls directly.
- FCM path: data payload keys `messageId`, `senderName`, `emailSubject`, `Keywords`; system notifications plus in-app history; `POST_NOTIFICATIONS` permission on Android 13+.
- Pull path: `GET {pullEndpoint}?after=<cursor>`. The cursor is the **only** query parameter; authentication is the `X-Kypost-Device-Id` and `X-Kypost-Device-Secret` headers, never a query parameter, because credentials in a URL end up in access logs and browser history. `seq` dedup, `lastCursor` durable per subscriber and advanced only after delivery; respects `deliveryMode` from register and pull responses on each foreground; background WorkManager at 15 minutes plus foreground pull; optional foreground service for near real-time with a persistent notification (not the default); backs off on `400`, `401`, `503`, network errors.
- Storage: `deliveryMode` and `pullEndpoint` stored; if `pullEndpoint` absent, derived as `{srv}/api/notifications/native/pull`.

### macOS & iOS (from `kypost-for-Mac/README.md`)

- APNs for new mail and MFA challenges. Polling fallback runs at 90 s in the foreground, background refresh on iOS.
- If Security → Require unlock for notifications and MFA is on, background checks wait until you open and unlock the app. On iPhone this covers all background delivery. On Mac it applies while the screen is locked.

### Linux (from `kypost-Linux/README.md`)

- UnifiedPush with two tiers and fallback: distributor first, then 90-second polling. Only the distributor push server sees a notification. Mail still arrives with no distributor installed.

## Server API for native push

- `POST /api/notifications/native/register` (pairing token auth; returns a `deviceId` and a `deviceSecret`, and invalidates the previous secret)
- `GET|DELETE /api/notifications/native/devices` (per-device revocation)
- `POST /api/notifications/native/unpair`

Everything after registration authenticates with the `X-Kypost-Device-Id` and
`X-Kypost-Device-Secret` headers. See [Pairing](./pairing.md).

## Relay protection

- Per-minute limiter (10/min), per-IP register limiter, optional aggregate daily budget `RELAY_DAILY_BUDGET`. See [Push Relays](./server/push-relays.md).
- Token pinning: first key to deliver to a token claims it; revoked keys release claims after ~60 s; Durable Object enforces it.

## What the READMEs do not say

- Exact browser push enrollment steps beyond `GET /api/notifications/vapid-public-key` and `POST|DELETE /api/notifications/subscriptions`.
- No mention of sound, badge counts, or notification grouping.
