# Ecosystem Overview

## What KyPost is

KyPost is a self-hosted email system. A Go relay server (`kypost-server`) talks to the user's IMAP/SMTP mailbox, applies keyword labels with a local Ollama model, and exposes a web UI plus a relay API. Native clients on Android, macOS/iOS, and Linux contain no mail credentials and no direct IMAP/SMTP — they talk only to the relay.

## Single-hosted, multi-client

One backend serves all clients:

- **Server** — multi-user (admin/user), per-user IMAP/SMTP, per-user label lists copied from instance defaults at account creation, per-user tuning prompts and notification preferences, and OpenID Connect single sign-on with directory replication.
- **Android** — keyword tabs, two-way contact sync, native-push pairing with FCM or UnifiedPush, optional pull mode, large-screen and foldable layouts.
- **macOS & iOS** — SwiftUI shared codebase, three-pane on macOS, tab layout on iOS, WebKit reader, APNs + 90s polling fallback.
- **Linux** — Qt6/Kirigami, one Flatpak for KDE Plasma desktop (3-column) and Plasma Mobile (bottom-tab push navigation).

All three clients share the same Go relay backend and the same 15-theme palette.

## Core capabilities 

| Area | Server | Android | macOS/iOS | Linux |
|---|---|---|---|---|
| Mail reading | IMAP inbox, folder mgmt, drag-drop move | Relay-proxied, no credentials on device | Server folders incl. subfolders, HTML via WebKit | Inbox/detail/composer, WebEngineView, server folders create/rename/delete |
| Compose | Send via SMTP, draft save, attachments 25 MB | To/Cc/Bcc autocomplete from contacts, picker | Compose and send through relay | Reply/reply-all/forward, attachments, drafts, HTML composer |
| Keyword tabs/labels | Polls unread, local LLM classifies, IMAP keywords, per-user allowlist | Tabs from server tab/label fields, tune in Keywords screen | Relay sorts into tabs/labels, visibility in settings | Tabs from the same server fields |
| Filter rules | GUI + raw Sieve, run-now panel | — | — | — |
| Contacts | Address book + groups, dedupe, CSV/vCard, photos, CardDAV server + client | Two-way sync via relay | Two-way sync, extended schema, reconciliation, groups/photos/IM/social/etc. | Synced list/detail, offline queued edits, groups, dedupe |
| PGP | Browser-protected key, WKD/keyserver/Autocrypt discovery and WKD publishing, recipient check, browser-sealed pickup links, in-browser signature verification | QR key exchange; on-device encrypt, sign and decrypt once enrolled | QR pickup link 2 min expiry, fingerprint confirmation, on-device decrypt once enrolled; server-custody accounts can use relay-side encrypt/sign, while browser-protected accounts hand sending off to webmail | QR exchange, camera scan/show, on-device encrypt, sign and decrypt through the user's own `gpg-agent` |
| Device enrollment | Seals the key to a device after a 14-character code matches | Keystore-backed, blocked while Hostile Location Protection is on | Secure Enclave, released on user presence | Imported into the user's GnuPG keyring |
| Cached mail at rest | Encrypted secrets on disk; no decrypted bodies cached | SQLCipher, key in the Keystore | SwiftData store with backup exclusion | SQLCipher, converted in place on upgrade |
| Sign-in | Password + MFA, or OpenID Connect SSO | Per-device credential, no webmail sign-in | Per-device credential | Per-device credential |
| Push | Browser push + native pairing, central Cloudflare relays for FCM/APNs | FCM, UnifiedPush, or App Pull polling; delivery mode push/pull | APNs + 90s polling + background refresh | UnifiedPush 2 tiers + 90s polling |
| MFA | TOTP, recovery codes, push-approval | Push approval via notification + in-app fallback | Approve from notification tap | N/A |

## Privacy model

Covered in full by [PGP & Encryption](./pgp.md) and the [Security Model](./security.md):
client-held PGP keys, device enrollment onto phones and desktops, WKD/Autocrypt
key discovery, the six-state signature trust model, browser-sealed pickup links,
protected subjects, generic push notifications by default, and device-level
hardening. The 15-theme system is in [Theming](./theming.md).

## Repository links


- KyPost Server — `https://github.com/Busness-app/KyPost-Server`
- KyPost for Android — `https://github.com/Busness-app/KyPost-for-Android`
- KyPost for Mac & iOS — `https://github.com/Busness-app/KyPost-for-Mac`
- KyPost for Linux — `https://github.com/Busness-app/KyPost-for-Linux`

## Workspace trust note

These assume self-hosting on hardware you control.
