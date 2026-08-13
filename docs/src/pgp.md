# PGP & Encryption

## Scope

KyPost supports OpenPGP for mail encryption and signing, plus QR-based public-key exchange. Your private key is protected in the browser. Native clients do not hold a PGP private key.

## Where your PGP private key lives

### Browser-protected (end-to-end)

- Browser generates or imports the key.
- Browser wraps the key with a key derived from your account password: PBKDF2-HMAC-SHA256 with 600,000 iterations and AES-256-GCM. Browser uploads only the wrapped blob and public half.
- Server stores the blob and cannot open it, provided two facts hold:
  1. Your password never reaches the server. Browser stretches it with a per-account login salt from `GET /api/auth/login-params` and splits the result into an auth half (sent) and a wrapping half (never leaves the page).
  2. The two halves use different salts. Wrapping uses a random salt in the envelope. Auth uses the account login salt.
- What this does not defend against: the server ships the JavaScript that does the derivation. A malicious server build can modify the bundle to collect the password. You get protection against over-retention, logs, heap dumps, backups, and data at rest.
- Costs:
  - A password reset destroys the key. You must import or generate a new one. Security page offers a browser-generated encrypted recovery backup. Keep the file and the separately shown recovery secret offline. Server never gets plaintext key or secret.
  - You unlock the key once per browser session. Browser holds it in page memory only, never in localStorage or sessionStorage. Reload needs password again.
  - KyPost does not auto-add verified send-as addresses to your key. The browser must re-sign the key.
- Both modes share: ordinary PGP/MIME does not encrypt subject lines; push is generic by default; recipient without key can get a one-time pickup link.

### Shared facts

- PGP/MIME does not encrypt outer subject lines. When possible, KyPost puts the subject inside the encrypted part, but the outer header stays.
- Mobile push is generic by default for that reason.
- A recipient without a key can get a one-time pickup link. KyPost stores that message on your server and encrypts it with the server own key. It stays until the recipient reads it or it expires. Not end-to-end. Opt-in, not automatic. An encrypted send to a keyless recipient fails with 409 unless `allowPickupFallback` is set. Plaintext never reaches the server as a side effect.

## Sending

- `POST /api/mail/send` with optional `attachments: [{name, mimeType, dataBase64}]` (25 MB total), optional `encrypt` and `sign`. If `encrypt` is true and a recipient lacks a usable key, call fails with 409. Set `allowPickupFallback` to allow the pickup-link fallback instead.
- `POST /api/mail/draft` uses the same shape without PGP flags; clients save a draft on the server when the browser must take over.
- `POST /api/pgp/recipients/check` — check key status for a set of recipients before you send (contacts-only preflight on Mac).
- `GET /api/pgp/keyserver/lookup` — queries `keys.openpgp.org`.

## QR key exchange

- Server: `GET /api/pgp/qr/token` makes a pickup token and URL that expire in 2 minutes (pairing-auth `sub` and `hash`). `GET /api/pgp/qr/key?t=` gets the scanned public key and fingerprint (token is credential). Mac README notes the 2-minute expiry.
- Android: one screen shows your own PGP public-key QR code and scans another person QR code, saves the key onto an existing contact.
- macOS: My QR Code makes a pickup link that expires in 2 minutes. Scan to add contact key reads another person link, shows fingerprint for out-of-band confirmation, saves to a contact. iOS uses camera and pasted link fallback. macOS needs a pasted link (no VisionKit).
- iOS: same as Android plus paste fallback.
- Linux: exchange through QR, scan or show with camera, confirm fingerprint out of band.

## Client limits

- No client holds a PGP private key by design (Android, Mac, Linux all state this).
- Messages the server decrypted say so, and the server read the mail. Messages only the browser can open say so and link to webmail. Clients link out rather than show ciphertext.

## Pickup links

- Single-use links at `GET /pickup/{id}?t=<token>`.
- Stored encrypted with the server own key, not end-to-end.
- For docs on the flow, see `docs/WKD_Publishing.md`, `docs/E2E_PGP.md`, and `docs/WEBMAIL_HANDOFF.md` in the server repo.
