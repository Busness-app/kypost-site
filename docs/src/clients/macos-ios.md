# macOS & iOS Client

## What it is

A native SwiftUI mail client for macOS and iOS. It connects only to the KyPost mail relay. No direct IMAP or SMTP. One QR code or deep-link pairing registers the device. The relay then handles mail, keyword tabs, push, and contact sync.

Name is KyPost everywhere (Dock, Home Screen, About, permission prompts, Xcode project, scheme, folders, deep link `kypost://`). Bundle IDs and Keychain group stay `com.urlxl.mail` on purpose. See `Brand_Refresh_KyPost.md`.

## Features

- **Inbox with keyword tabs** — relay sorts mail into tabs and labels. Set tab visibility in settings.
- **Server folders** — Inbox and subfolders, Drafts, Junk, Sent, Trash, Archive with subfolders. macOS shows them in the sidebar. iOS in the folder menu on the Inbox screen.
- **HTML rendering** — themed WebKit reader on both platforms. Links open in the default browser. Plain text renders natively.
- **macOS extras** — three-pane split view, pop-out email windows (double-click or right-click), preview pane toggle, drag-and-drop onto sidebar folders to move, menu-bar commands (⌘N compose, ⌘R refresh, ⌘⇧S contact sync), native Preferences window (⌘,).
- **Compose and send** through the relay.
- **Push** — APNs for new mail and MFA challenges. Polling fallback also runs (90 s foreground, background refresh on iOS).
- **MFA approval** — approve login challenges from a notification tap.
- **Contact sync** — two-way sync with the relay. Local edits win first, reconciliation keeps data safe. Contacts carry groups, photo, IM and social handles, websites, relations, extra dates, phonetic names, department, custom fields, pronouns, PGP public key.
- **PGP QR exchange** — My QR Code makes a pickup link that expires in 2 minutes. Scan to add contact key reads another person link, shows fingerprint for out-of-band confirmation, and saves the key to a contact. iOS scans with camera and accepts a pasted link. macOS accepts only a pasted link (no VisionKit).
- **Encryption state on each message** — a message the server decrypted says so (the server read your mail). A message only your browser can open says so and links to webmail. This app holds no PGP private key by design. See `docs/E2E_PGP.md` in the server repo.
- **Encrypted and signed send** — for an account whose key the server holds, Encrypt and Sign flags travel with the message and the relay does OpenPGP work. If a recipient lacks a usable key, the relay refuses first and asks you. If you confirm, it mails a one-time pickup link and stores the plaintext on your server for up to 7 days with named recipients. An account whose key only the browser can unwrap cannot encrypt from this app. The app saves the draft on the server and hands off to webmail.
- **Themes** — 15 palettes that match web and Android exactly. Default is Patina Ky.

### Security (Settings → Security)

- **Require Unlock to Open** — gates the app with Face ID, Touch ID, or device passcode (`LAContext`). OS controls rate-limit and lockout. No app PIN. iOS locks when you background the app. macOS locks when the screen locks, not when you switch apps.
- **Hostile Location Protection** — keeps no mail, contacts, or attachments on device. All data stays in memory and reloads from the server. The app erases the local cache when you turn it on. Limits: attachment preview writes a file to the app sandboxed temp dir while open (Quick Look needs a file) and deletes on dismissal; erase is a plain delete, not a forensic overwrite.
- **Require unlock for notifications and MFA** — moves the relay credential behind user presence. Background mail checks and MFA waits until you open and unlock the app. On iPhone this covers all background delivery. On Mac it applies while the screen is locked.
- **Always on**: TOFU certificate pinning (pins key at first pairing, never re-pins silently; refuses a certificate it cannot hash; re-pair in Settings → Connection if cert changes), sender HTML with JS off and remote content blocked, navigation out of message denied by default, PGP fingerprints computed locally from key bytes, local store with backup exclusion, screen-capture protection (macOS excludes windows from recordings and sharing; iOS covers content during recording or mirroring; neither blocks a plain screenshot).

## Requirements

- Xcode 26, deployment target macOS and iOS 26.5.
- A running relay backend (live deployment behind Cloudflare at `mail.urlxl.com`).
- For push: an APNs key on the backend.
- No external Swift packages. SwiftData, URLSession, WebKit.

## Getting started

1. Open `KyPost.xcodeproj` in Xcode.
2. Select the KyPost scheme and your destination (My Mac or iOS device/simulator).
3. Build and run.
4. Pair the device. In the web frontend, open Notifications → Pair Desktop App. On iOS scan the mobile QR code. The `kypost://native-pair?...` deep link registers the device and stores credentials in the Keychain.

Until you pair, the inbox shows a prompt that points to Settings → Connection.

## Architecture

One codebase in `KyPost/` from layers described in [Architecture](../architecture.md). Platforms split at the root view.

## Wire contracts

The README says the Android repo defines relay endpoints and payload shapes. See `Mobile_Mail_Relay.md` and `Mobile_Contact_Sync.md`. The primary list:

- `GET /api/inbox` — `{tabs, byTab, cursor, delta, removed}`
- `GET /api/inbox/folders?parent=` — full paths like `INBOX/Receipts`
- `POST /api/inbox/actions` — bulk read, archive, spam, delete, move
- `POST /api/mail/send` — comma-joined recipients
- `POST /api/mail/draft` — same shape as send, without PGP flags
- `GET /api/pgp/bootstrap` — `hasIdentity`, `protection`
- `POST /api/pgp/recipients/check` — contacts-only preflight (never `/resolve`)
- `GET/POST /api/contacts/sync` — cursor-based
- `GET /api/pgp/qr/token` — make pickup token and URL that expire in 2 minutes (pairing-auth `sub` and `hash`)
- `GET /api/pgp/qr/key?t=` — get scanned key and fingerprint (token is credential)
- `POST /api/notifications/native/register` — APNs registration

The README warns: before you change any endpoint, read the Android implementation. Do not guess.

## Testing

Unit tests use Swift Testing (`@Test` and `#expect`) in `KyPost Tests/`. UI stubs in `KyPost UITests/`. Run with ⌘U or:

```sh
xcodebuild test -project "KyPost.xcodeproj" -scheme "KyPost"
```

Network tests run against a stubbed `HTTPClient`. No backend is needed.

## Known gaps (v2 candidates)

- Attachments (compose and viewing)
- Mail cursor and delta sync. Every refresh gets a full folder snapshot.
- Read, archive, delete from the reader. Move-by-drag works on macOS.
- Draft saving from compose. PGP webmail handoff saves a draft, but no Save Draft button and no auto-save.
- Server-side search. Search runs against local cache.
- QR scanning with camera on macOS (must paste; camera works on iOS).

