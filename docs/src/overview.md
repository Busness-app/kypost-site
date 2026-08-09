# Ecosystem Overview

## What KyPost is

KyPost is a self-hosted email system. A Go relay server (`kypost-server`) talks to the user's IMAP/SMTP mailbox, applies keyword labels with a local Ollama model, and exposes a web UI plus a relay API. Native clients on Android, macOS/iOS, and Linux contain no mail credentials and no direct IMAP/SMTP — they talk only to the relay.

## Single-hosted, multi-client

One backend serves all clients:

- **Server** — multi-user (admin/user), per-user IMAP/SMTP, per-user label lists copied from instance defaults at account creation, per-user tuning prompts and notification preferences.
- **Android** — keyword tabs, two-way contact sync, native-push pairing with FCM, optional pull mode.
- **macOS & iOS** — SwiftUI shared codebase, three-pane on macOS, tab layout on iOS, WebKit reader, APNs + 90s polling fallback.
- **Linux** — Qt6/Kirigami, one Flatpak for KDE Plasma desktop (3-column) and Plasma Mobile (bottom-tab push navigation).

All three clients share the same Go relay backend and the same 15-theme palette.

## Core capabilities 

| Area | Server | Android | macOS/iOS | Linux |
|---|---|---|---|---|
| Mail reading | IMAP inbox, folder mgmt, drag-drop move | Relay-proxied, no credentials on device | Server folders incl. subfolders, HTML via WebKit | Inbox/detail/composer, WebEngineView, server folders create/rename/delete |
| Compose | Send via SMTP, draft save, attachments 25 MB | To/Cc/Bcc autocomplete from contacts, picker | Compose and send through relay | Reply/reply-all/forward, attachments, drafts, HTML composer |
| Keyword tabs/labels | Polls unread, local LLM classifies, IMAP keywords, per-user allowlist | Tabs from server tab/label fields, tune in Keywords screen | Relay sorts into tabs/labels, visibility in settings | Not detailed in README |
| Filter rules | GUI + raw Sieve, run-now panel | — | — | — |
| Contacts | Address book + groups, dedupe, CSV/vCard, photos, CardDAV server + client | Two-way sync via relay | Two-way sync, extended schema, reconciliation, groups/photos/IM/social/etc. | Synced list/detail, offline queued edits, groups, dedupe |
| PGP | Generate/import, WKD lookup, recipient check, two protection modes, pickup links | QR show/scan own/other key onto contact | QR pickup link 2 min expiry, fingerprint confirmation, encryption state per message, relay-side encrypt/sign, pickup fallback 7 days, browser-only key handoff via draft | QR exchange, camera scan/show, fingerprint confirmation, marks unreadable encrypted mail |
| Push | Browser push + native pairing, central Cloudflare relays for FCM/APNs | FCM native, pull mode polling, delivery mode push/pull | APNs + 90s polling + background refresh | UnifiedPush 2 tiers + 90s polling |
| MFA | TOTP, recovery codes, push-approval | Push approval via notification + in-app fallback | Approve from notification tap | N/A |

## Privacy model 

The site's architecture map page covers: client-held PGP keys, WKD/Autocrypt key discovery, sealed pickup links, protected subjects, generic push notifications by default, device-level hardening, and the 15-theme system. Details are on that map and in per-repo docs, not expanded in this overview.

## Repository links


- KyPost Server — `https://github.com/Yoshiofthewire/KyPost-Server`
- KyPost for Android — `https://github.com/Yoshiofthewire/KyPost-for-Android`
- KyPost for Mac & iOS — `https://github.com/Yoshiofthewire/KyPost-for-Mac`
- KyPost for Linux — `https://github.com/Yoshiofthewire/KyPost-for-Linux`

## Workspace trust note

These assume self-hosting on hardware you control.
