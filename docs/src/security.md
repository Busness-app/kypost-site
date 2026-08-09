# Security Model

## Accounts and sessions (server)

- Sessions expire after 24 hours without activity and slide forward on each authenticated request. Hard cap is 7 days from issue. The server sweeps expired sessions hourly. Logout invalidates server-side session and clears cookie. Deactivation or role change takes effect on the next request.
- Roles: `admin` and `user` in `/kypost/config/users.json`. Admins manage users, roles, passwords, activation, runtime settings, updates, verified mail domains, diagnostics, logs, health repair, and label rules. Users connect their own IMAP/SMTP, read and label own mail, pair own devices, set own notification prefs, tune own prompt.
- Deactivation is soft delete. Data stays until you remove it. You cannot deactivate or demote the last active admin.
- Bootstrap `admin` password goes to `first-run-password.txt` mode 600, or `BOOTSTRAP_ADMIN_PASS`/`BOOTSTRAP_ADMIN_USER` on first run.

## IMAP credential storage

- Master keys at `/kypost/private/imap-config.key` and `/kypost/private/totp-secret.key`. Per-user encrypted IMAP credentials live in `/kypost/config/users/<userID>/`. See [Persistence](./server/persistence.md).

## TLS and proxy (server)

- By default the server serves plain HTTP. Session cookie gets `Secure` only when the request came over TLS. `KYPOST_BIND` is required; compose refuses to start without it. `http://` on localhost is acceptable. For network access, put TLS in front. Three options: terminate in KyPost (`TLS_CERT_FILE` + `TLS_KEY_FILE`), Cloudflare Tunnel, or your own reverse proxy. See [Configuration](./server/configuration.md) and [Deployment](./deployment.md).
- For proxied setups, set `TRUSTED_PROXY_CIDRS` narrowly. Behind Cloudflare, the server prefers `CF-Connecting-IP`. Verify with `GET /api/status` (`clientIp` must be your public address, `proxyHeadersTrusted` true except for direct TLS).

## CAPTCHA and lockouts (server)

- `CAPTCHA_PROVIDER`: `pow` (default, self-hosted proof-of-work), `turnstile`, `friendly`, or `none`. Works with 3-strikes/15-minute account lockout plus a looser per-IP lockout and an instance-wide rate limit.
- `pow` needs a secure context (`crypto.subtle`). On plain `http://` (not `localhost`) nobody can sign in. Difficulty adapts per client IP, decays after 15 minutes or on success, bound to the requesting address with a signed challenge, requires `POW_SECRET` on multi-replica deployments (use `openssl rand -base64 32`, must be 16 chars or longer).
- `turnstile`/`friendly` need `CAPTCHA_SITE_KEY` + `CAPTCHA_SECRET_KEY` and verify against a third-party endpoint.

## Certificate pinning

- **Android, macOS, Linux**: TOFU pinning at first pairing. After pinning, the client fails closed and refuses a certificate it cannot hash. Re-pair to change. Mac re-pairs in Settings → Connection.
- Linux also allows encrypting the pairing credential behind a PIN.

## Client hardening

### macOS & iOS

Always on:

- Sender HTML renders with JS off and remote content blocked. Navigation out of message denied by default.
- PGP fingerprints computed locally from key bytes.
- Local store has backup exclusion.
- Screen-capture protection: macOS excludes windows from recordings and sharing; iOS covers content during recording or mirroring. Neither blocks a plain screenshot.

Options:

- **Require Unlock to Open** with Face ID/Touch ID/passcode. iOS locks on background. macOS locks on screen lock.
- **Hostile Location Protection** — keeps no mail, contacts, or attachments on device; erases local cache on enable; limits are Quick Look temp file while preview is open (deleted on dismissal) and plain delete (not forensic overwrite).
- **Require unlock for notifications and MFA** — moves relay credential behind user presence; background checks wait.

### Linux

- PIN lock with lockout and wipe after repeated failures.
- Credential seal with AES-256-GCM + Argon2 (see `core/security/CredentialCipher.h`).
- WebEngineView with JS and remote images disabled.
- Hostile Location Protection writes nothing to disk.

### Android

- Keystore-backed `EncryptedSharedPreferences` for pairing material.
- No explicit PIN in README; security detail is pairing storage and permission handling.

## Push privacy

- Subject lines are not encrypted in ordinary PGP/MIME. The outer header is visible. Push notifications are generic by default.

## Push relay protection

See [Push Relays](./server/push-relays.md): token pinning, per-minute and per-IP rate limits, optional daily budget, Durable Object coordination, fail-closed behavior.
