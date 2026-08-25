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

## Single Sign-On (server)

- Any standard OpenID Connect provider. Authorization code with PKCE; ID tokens are verified against the issuer's JWKS.
- Accounts are claimed by the provider's `sub` and never by username or email, so a provider that lets someone re-register a name cannot hand them an existing KyPost account.
- KySignOn ships as a one-click preset. Authentik and Keycloak have their admin-group claims mapped.
- Admin-configured under Admin → Server → SSO. **Requires `SERVER_BASE_URL`** — the redirect URI is taken from the configured base URL, never from the request's `Host` header.
- Directory replication keeps the account list in step with the provider.

## Pairing credentials (per device)

- Registration exchanges the one-time pairing token for a `deviceId` and a server-minted `deviceSecret`, sent on every later request as `X-Kypost-Device-Id` and `X-Kypost-Device-Secret`. There is no account-wide subscriber HMAC any more.
- The secret authorises push delivery, pull, contact sync, MFA response, and device enrollment. It is **not** the account password and cannot sign in to webmail.
- Each successful registration mints a new secret and invalidates the previous one.
- Revocation is per device, from the server's Security page. Losing one device does not disturb the others.
- Android wraps the secret locally under a key derived from the app-lock PIN, peppered with a Keystore-held value.

## Certificate pinning

- **Android**: the server's leaf SPKI is captured at pairing and enforced on every later connection. Where the server terminates TLS itself, the pin also travels in the pairing QR as `pin`, so the *first* registration call — the one that discloses the pairing token and the push credentials — is pinned rather than trusted on faith. A malformed pin fails closed instead of dropping back to TOFU.
- **macOS & iOS**: TOFU pinning at first pairing, never re-pinned silently. Re-pair in Settings → Connection.
- **Linux**: TOFU on first use, anchored to the certificate's **issuer** rather than the leaf, so a routine renewal is not reported as impersonation. A certificate change can be recovered from without destroying the pairing.
- After pinning, every client fails closed and refuses a certificate it cannot hash.
- Linux also allows encrypting the pairing credential behind a PIN.

## Encryption at rest on the clients

- **Android**: `kypost_mail.db` — every cached message body, the whole contact book, and contacts' PGP keys — is encrypted with SQLCipher. The passphrase is 32 random bytes in a Keystore-backed `EncryptedSharedPreferences` file, deliberately **not** derived from the app-lock PIN, because the database has to open in processes where no PIN has been entered (an FCM delivery, a background sync). Existing installs convert in place on first launch, and the conversion never deletes the original before the replacement is verified.
- **Linux**: the profile database is encrypted with SQLCipher; an existing plaintext profile is converted on the next launch. A build without `KYPOST_SQLCIPHER_ROOT` configured reports encrypted databases as unavailable rather than pretending.
- **What this protects against**: reading the file offline — root, an unlocked bootloader, a forensic image, a stolen backup.
- **What it does not**: a live, rooted, running device. Code running as the app's own UID can ask the keystore to use the key exactly as the app does. Hostile Location Protection is the answer to that, and it is stronger: there is no file at all.

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

- PIN lock with lockout, a **configurable** background-lock grace period, and a **configurable** erase-after-N-failures threshold — including "never", which declines only the erase; the rate limit always stays.
- An interrupted wipe is finished on the next launch, and says so when it cannot.
- Credential seal with AES-256-GCM + Argon2 (see `core/security/CredentialCipher.h`). `openssl` supplies the cipher and `argon2` the memory-hard derivation, because Qt exposes neither.
- WebEngineView with JS and remote images disabled.
- Hostile Location Protection writes nothing to disk, and refuses to turn on at all if it cannot first erase what is already there.
- OpenPGP custody is delegated to the user's own `gpg-agent` through GPGME's C API, so KyPost never sees the OpenPGP passphrase and hardware tokens and smartcards work unchanged.

### Android

- **App lock** — a PIN or biometric gate. The first two wrong attempts are free, because typos happen; attempt three onward adds a growing delay. After `WIPE_THRESHOLD` consecutive failures local data is wiped. Common PINs are rejected at set time, because an attacker gets a bounded number of guesses. A PIN that cannot be *checked* — a Keystore pepper gone or unusable — is deliberately distinct from a wrong PIN and does not count toward the threshold.
- **The wipe fails closed.** It reports each step it could not complete rather than claiming a clean erasure, and resumes at the next launch. After three failed resumes it stops retrying but does not forget: every launch from then on blocks the app behind "manual recovery required" rather than showing a first-run screen over data still on disk. Every Keystore alias the app mints is destroyed and the deletion verified — a surviving alias is a durable record that the app was installed.
- **Hostile Location Protection** — the Room database is in-memory only, push history is volatile, device contact sync is blocked, keyword settings are not persisted, attachments are viewed with no disk write, and notifications carry no sender or subject whether or not the app is locked. The flag is a value plus an HMAC under a non-exportable Keystore key, so tampering fails towards *enabled*, and it is written with `commit()` after the on-disk database is deleted so a process death cannot leave protection off while the user believes it is on.
- **Known limitation**: turning the mode on cannot retract notifications the OS already recorded in Notification History. Clear that from Android's own settings if it matters.
- **Known limitation**: attachments saved to the shared Downloads collection while protection is off live outside the app sandbox. `DownloadedAttachmentLedger` records those MediaStore rows — synchronously, *before* the file is written — so the wipe can remove them. Files the user has since moved or copied elsewhere are beyond the app's reach.
- Keystore-backed `EncryptedSharedPreferences` for pairing material; SQLCipher for cached mail (see above).
- **Third-party components stated rather than discovered**: pairing QR scanning uses Google Play Services (`play-services-code-scanner`). Pair by entering the URL instead if you do not want that in the path. Push delivery is FCM, a UnifiedPush distributor you choose, or App Pull, which polls your own server and involves neither.

## Push privacy

- Subject lines are not encrypted in ordinary PGP/MIME. The outer header is visible. Push notifications are generic by default.
- Encrypted mail is excluded from push payloads by the server whatever the Content Preview setting, because native push travels through a relay and on to FCM or APNs in cleartext at every hop.
- Notification content is opaque to the push transport. What the transport learns is timing.

## Push relay protection

See [Push Relays](./server/push-relays.md): token pinning, per-minute and per-IP rate limits, optional daily budget, Durable Object coordination, fail-closed behavior.
