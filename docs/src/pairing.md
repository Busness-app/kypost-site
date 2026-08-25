# Pairing & Device Registration

All clients pair from the web app. The server creates the link. The client registers its push token.

## Deep link format

```
kypost://native-pair?sub=<subscriberId>&srv=<serverUrl>&reg=<registrationUrl>&pt=<pairingToken>&pin=<tlsPin>
```

- Required: `sub`, `srv`, `pt`
- Optional: `reg`, `pin`

- `sub` — subscriber id
- `srv` — server URL (origin the client must use)
- `reg` — registration URL (if absent, derive `{srv}/api/notifications/native/register`)
- `pt` — signed pairing token, valid for 90 seconds
- `pin` — the server's leaf SPKI pin, present only when the server terminates TLS itself. It lets the client pin the registration call *before* it discloses the pairing token and its push credentials, instead of sending them inside a trust-on-first-use window. Absent means TOFU. It is percent-encoded, and a malformed pin fails closed rather than dropping back to TOFU.

`hash` is **legacy**. Older servers emitted a `subscriberHash` here; the current
clients ignore it and the server no longer accepts an account-wide subscriber
HMAC as authentication. A link that still carries it comes from an outdated
server.

`srv` and any `reg` must both be `https` and the **same origin**. Clients refuse
the link otherwise, because `reg` is where the device secret is minted while the
confirmation dialog shows the user `srv`.

**Warning**: set `SERVER_BASE_URL` in `.env` so `srv` and `reg` point to the correct public backend URL, and so SSO's redirect URI does not come from the request's `Host` header. That URL must be `https://` because each pairing token, pickup link, and QR key-exchange URL carries a Bearer token in the query string.

## Server behavior 

- Security → Devices renders a QR code link with `sub`, `srv`, `reg`, `pt`, and — when KyPost terminates TLS itself — `pin`. The panel re-mints a token on every call.
- `pt` is valid for 90 seconds. The UI shows a 4px countdown bar under the QR code. It shrinks over 90 seconds and changes from green to red. It is red for the last 15 seconds.
- Pairing secret is generated on first start at `/kypost/private/pairing.key`. Set `PAIRING_SECRET` only if replicas must share one. Value must be 32 bytes or longer or the three features stay disabled.

Native registration:

- `POST /api/notifications/native/register` validates the pairing token, stores device metadata and token, and mints a `deviceId` plus a `deviceSecret` returned exactly once. Each later registration mints a **new** secret and invalidates the previous one.
- Every later request authenticates with `X-Kypost-Device-Id` and `X-Kypost-Device-Secret` headers — never a query parameter, because credentials in a URL end up in access logs and browser history.
- `GET /api/notifications/native/devices` lists paired native devices.
- `DELETE /api/notifications/native/devices` removes one device by `deviceId`. Revocation is per device.
- `POST /api/notifications/native/unpair` revokes all devices for the user.

A `PAIRING_SECRET` shorter than 32 bytes disables pairing, pickup links, and PGP QR exchange. The reason is logged. Bytes matter, not characters, because the value is the HMAC key verbatim.

## Client behavior

### Android

- The current application id is `org.kysecurity.mail`. The rename from `com.urlxl.mail` is breaking: existing installs must reinstall, pair again, and re-enroll any device-held PGP identity.
- Stores pairing material (subscriber id, server URL, registration URL, pairing token, device id, device secret) in a Keystore-backed `EncryptedSharedPreferences` file. Notification history and sync status stay in plaintext DataStore.
- Validates the required params, checks that `srv` and any `reg` are `https` and the same origin, resolves the registration endpoint, then shows a confirmation dialog **naming the server host** before it calls anything.
- Calls the registration endpoint with the FCM token (`reg` or derived). Marks paired only on success (`ok:true` or `synced:true`). A scan alone does not pair it. Repeats on token refresh, storing the new `deviceId` and `deviceSecret` each time.
- The wipe's server-side deregistration goes over the **pinned** connection using a pin captured before the wipe deletes it. With no pin it is refused rather than downgraded, so the credential is never handed to an unpinned connection at the moment the device is most likely to be on a hostile network. The cost is that the relay may keep the device listed until it is revoked by hand.

### macOS & iOS

- Deep link `kypost://native-pair?...` registers the device and stores credentials in the Keychain.
- Until you pair, the inbox shows a prompt that points to Settings → Connection.
- TOFU certificate pinning at first pairing; re-pair in Settings → Connection if the cert changes.
- Bundle IDs and the Keychain access group stay `com.urlxl.mail` on purpose; only the user-facing name and the deep-link scheme are KyPost.

### Linux

- The application id is `com.kysecurity.mail`. The rename from `com.urlxl.mail` is recorded in `docs/RENAME_NOTES.md` in that repo.
- Paste a link or use the `kypost://` deep link.
- Can encrypt the pairing credential behind the PIN (AES-256-GCM + Argon2).
- TOFU pinning on first use, anchored to the certificate's issuer, so a renewal is not mistaken for impersonation. A certificate change is recovered from without destroying the pairing.
- "Secret store unreadable" is reported as itself, not as "never paired".

## Troubleshooting (Android list, applies broadly)

- Use exactly `kypost://native-pair`.
- Provide `sub`, `srv`, `pt`. A link still carrying `hash` comes from an outdated server; it is ignored.
- `srv` and `reg` must both be `https` and the same origin.
- Device must reach the resolved registration endpoint.
- Firebase config must match `org.kysecurity.mail` (Android).
- `400` malformed, `401` bad/expired `pt` (scan new QR), `503` backend has no `PAIRING_SECRET`.
- On Android 13+, grant notification permission.
