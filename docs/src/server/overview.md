# Server — Overview

The server is a self-hosted IMAP web client.  It offers GPG public keys for email encryption, and sealed private key protection.  The server CANNOT read any PGP encypted emails. It adds local-AI keyword labels, a web UI, and a relay API for native clients.

## What the server does

- Single-container Docker runtime. `supervisord` manages the processes.
- Multi-user with two roles. Admins manage users and system settings. Each user connects his own IMAP mailbox.
- IMAP inbox reader with folder management and drag-and-drop moves.
- Keyword labels for unread mail. Each account has its own label list, copied from instance defaults at creation.
- Filter Rules: GUI condition and action builder plus raw Sieve editor. A run-now panel applies rules on demand.
- Compose with SMTP send and IMAP draft save.
- PGP mail encryption. Generate or import a browser-protected key, search `keys.openpgp.org`, and check recipient keys before you send.
- Contacts address book with groups, dedupe, bulk delete, CSV and vCard import and export, and photos.
- CardDAV server (`/dav`, `/.well-known/carddav`) and optional CardDAV client to sync an external address book.
- Multi-factor authentication: TOTP, one-time recovery codes, push-approval sign-in.
- CAPTCHA on login: self-hosted proof-of-work by default, also Turnstile or Friendly Captcha, or `CAPTCHA_PROVIDER=none`.
- Browser push for each user, for all mail or keyword matches only, plus native push pairing.
- Settings panels: Appearance, Mail (IMAP/SMTP, send-as, contact sync, filters), Security, Notifications and Status, Email Labels (per-user prompt tuning), and Admin (runtime, diagnostics, label rules).
- Theme presets. The README says "a dozen".

## Quick facts

- Ports: `5866` for web UI and API, `11434` for Ollama (not exposed by default).
- Languages: Go for the API and poller, React and Vite for the frontend, Ollama for classification.
- Container: one image (backend, frontend, Ollama runtime), one compose file, `supervisord.conf` inside.
