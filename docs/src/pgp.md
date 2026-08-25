# PGP & Encryption

## Scope

KyPost supports OpenPGP for mail encryption and signing, key discovery over WKD,
Autocrypt and keyservers, and QR-based public-key exchange. Your private key is
protected in the browser, and it can be enrolled onto the native clients so they
can read encrypted mail without the server.

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

### On a native client, after device enrollment

A paired device holds no private key until you deliberately enrol it. Enrollment
moves the key from the browser to that one device, sealed so that nothing in
between — including the server — can read it.

1. The device generates a P-256 key pair — held in Android's Keystore or
   Apple's Secure Enclave, and transient on Linux — and publishes the public
   half with `POST /api/pgp/device/enrollment-key`, authenticated by its
   pairing credential.
2. Both screens display the same **short authentication string**: 14 Crockford
   base32 characters (70 bits), derived from the device's public key and its
   device id, in a 120-second bucket. The device derives it from the key in its
   own keystore; the browser derives it from the key the server handed over.
3. **The browser refuses to seal if they differ.** The server stores and serves
   the device public key, so the server is the party that could substitute one
   and then open everything sealed to it. The check gates the seal; verifying on
   the device afterwards would be too late.
4. On a match the browser performs ECDH against that key and seals the private
   key into a `kypost-device-envelope/v2` envelope. The device fetches it with
   `GET /api/pgp/device/envelope` and reports the outcome to
   `POST /api/pgp/device/enrollment-state`. On Linux the unwrapped key is
   imported into the user's GnuPG keyring and the transient key bytes are
   cleared.

The wire format, the code length, and the AAD layout are normative and shared by
the web, Android and Qt clients. Changing any of them is a wire break and moves
the version tag.

What each client does once enrolled:

| Client | Read encrypted mail | Encrypt and sign on device | Key custody |
|---|---|---|---|
| Web | Yes | Yes | Wrapped under your password, unwrapped in the page |
| Android | Yes | Yes | Sealed envelope under a Keystore key that requires a secure lock screen |
| macOS & iOS | Yes | Not yet — the crypto seam is linked, the send path still uses the relay | Sealed envelope in the Secure Enclave, released on user presence |
| Linux | Yes | Yes | Imported into your own GnuPG keyring; `gpg-agent` holds it |

Enrollment is reversible and losable by design:

- On Android the envelope is accepted only while Hostile Location Protection is
  **off**, and turning HLP on destroys it. A security wipe destroys it too, and
  if it cannot, the wipe reports itself incomplete and the app fails closed.
- On Apple devices, enabling Hostile Location Protection or resetting a stranded
  app lock destroys the key, and neither brings it back.
- On Linux the key lives in your GnuPG keyring, so KyPost never sees the OpenPGP
  passphrase and hardware tokens and smartcards work unchanged.

### Shared facts

- PGP/MIME does not encrypt outer subject lines. When possible, KyPost puts the subject inside the encrypted part using the LAMPS protected-headers convention, but the outer header stays.
- Mobile push is generic by default for that reason. Encrypted mail is excluded from push payloads entirely, whatever the Content Preview setting, because native push travels through a relay and on to FCM or APNs in cleartext at every hop.
- A recipient without a key can get a one-time pickup link. It stays until the recipient reads it or it expires. It is not end-to-end — nothing sent to a person with no key can be. Opt-in, not automatic: an encrypted send to a keyless recipient fails with 409 unless `allowPickupFallback` is set, so plaintext never reaches the server as a side effect. See [Pickup links](#pickup-links) for what the server can and cannot read.

## Key discovery

The server finds recipient keys through a ladder, and pins what it finds on
first use:

1. **Web Key Directory** for the recipient's own domain.
2. **Keyservers** — `GET /api/pgp/keyserver/lookup` queries `keys.openpgp.org`.
3. **Autocrypt headers** harvested from DKIM-authenticated mail.

Each rung is switchable under `GET|PUT /api/pgp/discovery/settings`, and a
discovered key can be rejected per address
(`GET /api/pgp/discovery/suppressions`,
`DELETE /api/pgp/discovery/suppressions/{email}`,
`POST /api/pgp/discovery/suppress-contact`). Scanning a fingerprint in person
stays available regardless.

## Signature trust

A signature verdict is decided **on the reading device**, from keys that device
already holds. The relay ships a `verified` flag with the message; no client
reads it. Fingerprints are computed locally from the key's own bytes, and the
address binding comes from the server's address book rather than from the key's
own — forgeable — User IDs.

There are six states, not a verified/unverified pair, because identity and
continuity are different claims and most keys arrive by Autocrypt harvest:

| State | Meaning |
|---|---|
| `none` | Unsigned, or no opinion expressed |
| `verifiedConfirmed` | Bound key that you confirmed out of band, by fingerprint or QR. **The only state that claims identity.** |
| `verifiedSeenBefore` | Bound key still matching its TOFU pin, never confirmed. Claims continuity: same key as last time. |
| `signerUnknown` | No key bound to this sender. Not an accusation — a new correspondent, a rotated key and a forged `From` are locally indistinguishable. |
| `keyChanged` | A key *is* bound to this sender and no longer matches its pin. The one alarm worth raising. |
| `invalid` | Signed, but it does not verify against the bound key. |

A subkey counts only if the primary key vouches for it with a valid binding
signature and asserts the sign-data key flag; a revoked or expired primary drops
the whole ring. The web client verifies detached signatures in the browser and
serves the verbatim signed bytes to do it, so RFC 3156 signed-only mail is
checked against what actually arrived.

## Publishing your key (WKD)

An admin verifies a domain by DNS (`GET|POST /api/pgp/wkd/domains`,
`POST /api/pgp/wkd/domains/{domain}/verify`), and the server then serves
`/.well-known/openpgpkey/` for it. Anyone in Thunderbird, GnuPG or ProtonMail
can then encrypt to your users unprompted. Publication is opt-out per user and
only ever covers addresses the user actually sends from.

## Sending

- `POST /api/mail/send` with optional `attachments: [{name, mimeType, dataBase64}]` (25 MB total), optional `encrypt` and `sign`. If `encrypt` is true and a recipient lacks a usable key, call fails with 409. Set `allowPickupFallback` to allow the pickup-link fallback instead.
- `POST /api/mail/draft` uses the same shape without PGP flags; clients save a draft on the server when the browser must take over.
- `POST /api/pgp/recipients/check` — check key status for a set of recipients before you send (contacts-only preflight on Mac).
- `GET /api/pgp/keyserver/lookup` — queries `keys.openpgp.org`.

Where a client encrypts on the device, the plaintext body never reaches the
relay for that path, each blind recipient gets their own ciphertext, and a
recipient with no usable key stops the send rather than downgrading it.

## QR key exchange

- Server: `GET /api/pgp/qr/token` makes a pickup token and URL that expire in 2 minutes. `GET /api/pgp/qr/key?t=` gets the scanned public key and fingerprint (token is credential).
- Android: one screen shows your own PGP public-key QR code and scans another person QR code, saves the key onto an existing contact.
- macOS: My QR Code makes a pickup link that expires in 2 minutes. Scan to add contact key reads another person link, shows fingerprint for out-of-band confirmation, saves to a contact. iOS uses camera and pasted link fallback. macOS needs a pasted link (no VisionKit).
- iOS: same as Android plus paste fallback.
- Linux: exchange through QR, scan or show with camera, confirm fingerprint out of band.

## Client limits

- A client that has not been enrolled holds no private key, and hands encrypted mail off to webmail rather than showing ciphertext. On Android the handoff opens the user's own browser or the installed webmail PWA, never a Custom Tab: a Custom Tab renders inside KyPost's task, where the app's `FLAG_SECURE` does not cover the browser's window.
- Messages the server decrypted say so, and say plainly that the server read the mail.

## Pickup links

Single-use links at `GET /pickup/{id}?t=<token>`. There are two paths, and they
do not offer the same protection.

**Browser-sealed** (`POST /api/pgp/pickup`). The sending browser encrypts the
message and posts an opaque blob. The returned URL carries the record id and its
fetch token but **not** the decryption key — the caller appends that as a URL
fragment, and browsers never transmit fragments, so the key never reaches the
server on the fetch. The server does see the key once, when it relays the
notification email, because it holds the SMTP credentials. That key is never
written to disk: `mailcache` drops Sent bodies outright and redacts pickup-link
fragments from every body it stores. So an attacker who later obtains the
volume, a backup, or the box gets ciphertext; only a server compromised at the
moment of sending sees the key.

**Relay-sealed.** Where the relay does the OpenPGP work — a server-custody
account sending from a native client — it stores the message's plaintext for up
to 7 days along with the named recipients. The server can read it.

One residue neither path reaches: the copy in the sender's own Sent folder on
their upstream IMAP provider keeps the full link.

For docs on the flow, see `docs/WKD_Publishing.md`, `docs/E2E_PGP.md`, and
`docs/WEBMAIL_HANDOFF.md` in the server repo.
