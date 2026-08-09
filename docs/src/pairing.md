# Pairing & Device Registration

All clients pair from the web app. The server creates the link. The client registers its push token.

## Deep link format

```
kypost://native-pair?sub=<subscriberId>&hash=<subscriberHash>&srv=<serverUrl>&reg=<registrationUrl>&pt=<pairingToken>
```

- Required: `sub`, `hash`, `srv`, `pt`
- Optional: `reg`

- `sub` — subscriber id
- `hash` — subscriber hash (URL-encoded HMAC)
- `srv` — server URL (origin the client must use)
- `reg` — registration URL (if absent, derive `{srv}/api/notifications/native/register`)
- `pt` — signed pairing token

**Warning**: set `SERVER_BASE_URL` in `.env` so `srv` and `reg` point to the correct public backend URL. That URL should be `https://` because each pairing token, pickup link, and QR key-exchange URL carries a Bearer token in the query string.

## Server behavior 

- Security → Devices renders a QR code link with `sub`, `hash`, `srv`, `reg`, `pt`.
- `pt` is valid for 90 seconds. The UI shows a 4px countdown bar under the QR code. It shrinks over 90 seconds and changes from green to red. It is red for the last 15 seconds.
- Pairing secret is generated on first start at `/kypost/private/pairing.key`. Set `PAIRING_SECRET` only if replicas must share one. Value must be 32 bytes or longer or the three features stay disabled.

Native registration:

- `POST /api/notifications/native/register` validates the pairing token, stores device metadata and token.
- `GET /api/notifications/native/devices` lists paired native devices.
- `DELETE /api/notifications/native/devices` removes one device by `deviceId`.
- `POST /api/notifications/native/unpair` revokes all devices for the user.

A `PAIRING_SECRET` shorter than 32 bytes disables pairing, pickup links, and PGP QR exchange. The reason is logged. Bytes matter, not characters, because the value is the HMAC key verbatim.

## Client behavior

### Android

- Stores pairing material (sub, hash, srv, reg, pairing token, last device id) in Keystore-backed `EncryptedSharedPreferences`. Notification history and sync status stay in plaintext DataStore.
- Calls the registration endpoint with the FCM token (`reg` or derived). Marks paired only on success (`ok:true` or `synced:true`). A scan alone does not pair it. Repeats on token refresh.
- Validates required params and resolves endpoint before the call.

### macOS & iOS

- Deep link `kypost://native-pair?...` registers the device and stores credentials in the Keychain.
- Until you pair, the inbox shows a prompt that points to Settings → Connection.
- TOFU certificate pinning at first pairing; re-pair in Settings → Connection if the cert changes.

### Linux

- Paste a link or use the `kypost://` deep link.
- Can encrypt the pairing credential behind the PIN (AES-256-GCM + Argon2).
- TOFU pinning on first use.

## Troubleshooting (Android list, applies broadly)

- Use exactly `kypost://native-pair`.
- Provide `sub`, `hash`, `srv`, `pt`.
- Device must reach the resolved registration endpoint.
- Firebase config must match `com.urlxl.mail` (Android).
- `400` malformed, `401` bad/expired `pt` (scan new QR), `503` backend has no `PAIRING_SECRET`.
- On Android 13+, grant notification permission.

