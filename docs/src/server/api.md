# Server — API Highlights

This page lists endpoints. It does not describe request or response bodies.

## Auth

- `POST /api/auth/login`
- `GET /api/auth/login-params` — per-account salt and work factor so the client can derive the auth secret; answers the same for unknown users
- `GET /api/auth/captcha-config`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/password`

## Multi-factor authentication

- `GET /api/mfa/status`
- `POST /api/mfa/totp/setup`
- `POST /api/mfa/totp/confirm`
- `POST /api/mfa/totp/disable`
- `POST /api/mfa/recovery-codes/regenerate`
- `PUT /api/mfa/push/enabled`
- `POST /api/auth/mfa/totp` and `POST /api/auth/mfa/recovery-code` (login-time verification)
- `POST /api/auth/mfa/push/poll`, `POST /api/auth/mfa/push/finish`, `POST /api/mfa/push/respond` (push-approval sign-in)

## User management (admin only)

- `GET|POST /api/users`
- `PUT /api/users/{id}` (change role)
- `POST /api/users/{id}/reset-password`
- `POST /api/users/{id}/deactivate`
- `POST /api/users/{id}/reactivate`
- `POST /api/users/{id}/clear-mfa`

## Runtime

- `GET /api/status` — includes `clientIp` and `proxyHeadersTrusted`
- `GET /api/health`
- `POST /api/health/repair` (admin)
- `POST /api/admin/mail/poll-now` (admin)
- `GET /api/setup` (whether initial admin setup finished)
- `GET /pickup/{id}?t=<token>` (single-use mobile pickup link)

## Config and data

- `GET|PUT /api/config` (GET hides `redaction.patterns` for non-admins; PUT is admin only)
- `GET /api/labels`
- `GET /api/decisions` (caller own decisions)
- `GET|PUT /api/tuning` (caller own prompt)

## IMAP and inbox

- `GET|POST|DELETE /api/imap/config`
- `POST /api/imap/test`
- `GET /api/inbox?limit=500&mailbox=<name>`
- `POST /api/inbox/actions` (bulk read, archive, spam, delete, move)
- `GET|POST|PUT|DELETE /api/inbox/folders`
- `GET /api/mail/search`

## Mail

- `POST /api/mail/send` — optional `attachments: [{name, mimeType, dataBase64}]` (25 MB total), optional `encrypt` and `sign`; if `encrypt` is true and a recipient lacks a usable key, the call fails with 409 unless `allowPickupFallback` is set
- `POST /api/mail/draft` (same attachments shape)
- `GET /api/mail/attachments?mailbox=&messageId=` (list metadata)
- `GET /api/mail/attachment?mailbox=&messageId=&index=` (download one)

## Filter Rules (caller own rules)

- `GET|POST /api/rules`
- `PUT|DELETE /api/rules/{id}`
- `POST /api/rules/reorder`
- `GET|PUT /api/rules/{id}/sieve` (raw Sieve)
- `POST /api/rules/run` (run on demand)

## PGP

- `POST /api/pgp/identity/generate` and `POST /api/pgp/identity/import`
- `GET|DELETE /api/pgp/identity`
- `GET /api/pgp/keyserver/lookup` (keys.openpgp.org)
- `POST /api/pgp/recipients/check` (key status before send)
- `GET /api/pgp/qr/token` and `GET /api/pgp/qr/key` (QR key exchange)

## Contacts

- `GET|POST /api/contacts`
- `GET|PUT|DELETE /api/contacts/{id}`
- `POST /api/contacts/dedupe`
- `GET /api/contacts/search`
- `POST /api/contacts/bulk-delete`
- `GET /api/contacts/export` and `POST /api/contacts/import`
- `GET|POST|DELETE /api/contacts/dav-password`
- `GET|POST|DELETE /api/contacts/carddav-client/config` and `POST /api/contacts/carddav-client/sync`
- `POST|GET|DELETE /api/contacts/{id}/photo`
- `POST /api/contacts/{id}/self`
- `GET|POST /api/contacts/sync` (mobile two-way sync; pairing token authenticates)

## Groups

- `GET|POST /api/groups`
- `PUT|DELETE /api/groups/{id}`

## CardDAV server

- `/.well-known/carddav`
- `/dav/...` (per-user DAV password authenticates)

## Notifications (scoped to signed-in user)

- `GET|PUT /api/notifications/preferences`
- `GET /api/notifications/vapid-public-key`
- `POST|DELETE /api/notifications/subscriptions`
- `POST /api/notifications/test`
- `GET /api/notifications/pairing`
- `POST /api/notifications/native/register`
- `GET|DELETE /api/notifications/native/devices`
- `POST /api/notifications/native/unpair`

## Logs (admin only)

- `GET /api/logs?file=<name>.log&lines=<n>`
- `GET /api/logs/list`

## Wire contracts used by mobile clients

The Mac lists the relay endpoints that mobile clients rely on. It points to `Mobile_Mail_Relay.md` and `Mobile_Contact_Sync.md` as the reference. The list there:

- `GET /api/inbox` — `{tabs, byTab, cursor, delta, removed}`
- `GET /api/inbox/folders?parent=` — full paths like `INBOX/Receipts`
- `POST /api/inbox/actions`
- `POST /api/mail/send` — comma-joined recipients
- `POST /api/mail/draft`
- `GET /api/pgp/bootstrap` — `hasIdentity`, `protection`
- `POST /api/pgp/recipients/check` (contacts-only preflight)
- `GET/POST /api/contacts/sync` (cursor-based)
- `GET /api/pgp/qr/token` and `GET /api/pgp/qr/key?t=`
- `POST /api/notifications/native/register`

## What this page does not add

- No schema for bodies or errors beyond the notes above.
- No auth header format beyond pairing-token query params where noted.
- No rate limits or pagination details.
