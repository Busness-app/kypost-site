# Server — Overview

The server is a self-hosted IMAP web client. It offers OpenPGP public-key discovery and publishing for email encryption, and sealed private-key protection. In client-protected mode the server cannot read a user's PGP-encrypted mail. It adds local-AI keyword labels, a web UI, and a relay API for native clients.

## What the server does

- Single-container Docker runtime. `supervisord` manages the processes.
- Multi-user with two roles. Admins manage users and system settings. Each user connects his own IMAP mailbox.
- IMAP inbox reader with folder management and drag-and-drop moves.
- Keyword labels for unread mail. Each account has its own label list, copied from instance defaults at creation.
- Filter Rules: GUI condition and action builder plus raw Sieve editor. A run-now panel applies rules on demand.
- Compose with SMTP send and IMAP draft save.
- PGP mail encryption. Generate or import a browser-protected key, discover recipient keys over WKD, keyservers and Autocrypt, check them before you send, and seal the key to a paired device so native clients can read encrypted mail. See [PGP & Encryption](../pgp.md).
- Web Key Directory publishing at `/.well-known/openpgpkey/` for DNS-verified domains, so correspondents find your users' keys without a keyserver.
- Send-as aliases, each verified by a DKIM-signed challenge from the alias's own domain before it can be used.
- Contacts address book with groups, dedupe, bulk delete, CSV and vCard import and export, and photos.
- CardDAV server (`/dav`, `/.well-known/carddav`) and optional CardDAV client to sync an external address book.
- Multi-factor authentication: TOTP, one-time recovery codes, push-approval sign-in with number matching.
- Single Sign-On against any standard OpenID Connect provider, with directory replication. KySignOn is a one-click preset; Authentik and Keycloak have their admin-group claims mapped. Authorization code + PKCE, ID tokens verified against the issuer's JWKS, accounts claimed by the provider's `sub` and never by username or email. Admin-configured under Admin → Server → SSO; **requires `SERVER_BASE_URL`**.
- CAPTCHA on login: self-hosted proof-of-work by default, also Turnstile or Friendly Captcha, or `CAPTCHA_PROVIDER=none`.
- Browser push for each user, for all mail or keyword matches only, plus native push pairing.
- Settings panels: Appearance, Mail (IMAP/SMTP, send-as, contact sync, filters), Security, Notifications and Status, Email Labels (per-user prompt tuning), and Admin (runtime, diagnostics, label rules).
- 15 theme presets, shared byte for byte with every native client. See [Theming](../theming.md).

## Quick facts

- Ports: `5866` for web UI and API, `11434` for Ollama (not exposed by default).
- Languages: Go for the API and poller, React and Vite for the frontend, Ollama for classification.
- Container: one image (backend, frontend, Ollama runtime), one compose file, `supervisord.conf` inside.
