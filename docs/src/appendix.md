# Appendix: Coverage Gaps

This appendix lists sections that exist for structure but have no data. It guards against guessing.

## Topics with no data

| Section | Gap |
|---|---|
| Ecosystem Overview | No world-level roadmap or timeline; no user counts |
| Architecture | No database schemas, no prompt text, no detailed relay auth flow |
| Server Config | No complete env var list (see `.env.example`), no default `TUNING.md` contents, no model download failure handling |
| Persistence | No managed-database or S3 backup option; file-level volumes only |
| API | No request/response schemas beyond field notes above |
| Push Relays | No cost estimate or quota beyond `RELAY_DAILY_BUDGET` |
| Clients Overview | No shared release cadence |
| Android | `minSdk` is 31; no background-restriction tuning beyond backoff |
| macOS & iOS | No TestFlight steps; known gaps are v2 candidates listed in README |
| Linux | No Plasma Mobile device list |
| Pairing | No signing algorithm beyond HMAC with `PAIRING_SECRET` |
| Push Notifications | No sound/badge/grouping config |
| Contacts | No dedupe algorithm; no CardDAV sync interval |
| PGP | No token lifetime beyond 2 min QR and up to 7-day pickup storage |
| Security | No formal threat model file |
| Theming | Names and file locations are listed; there is no custom-theme editor to document |
| Development | No style guide copy beyond `AGENTS.md`/`STYLE_GUIDE.md` pointers |
| Deployment | No Kubernetes or non-systemd log rotation guide |
| Licensing | No CLA/DCO; no third-party inventory beyond fonts |

## Other gaps named as future work

- **Mac known gaps (v2 candidates)**: attachments, read/archive/delete from reader, draft save button, server-side search, QR camera on macOS, and on-device encrypt-and-sign — reading client-protected mail has landed, writing it has not. Cursor/delta sync and folder create/rename/delete have since shipped.
- **Linux**: `packaging/click/` is deferred until UBports releases a Qt6/KF6 track. Inbox window size is an open product question — Linux sends no `limit` and gets the relay's default of 500 untruncated bodies where Android asks for 50.
- **Releases**: Linux, Android, Mac, and the server have tagged releases. Android's workflow creates its GitHub release as a **draft**, so a finished build is not necessarily public until a maintainer publishes it from the Releases page.

## Where these gaps are tracked upstream

- `kypost-Linux/docs/PARITY.md` is the authoritative Android↔Linux parity matrix, with a status and a reason per row.
- `kypost-android/SECURITY.md` states what each control protects and where it stops, including the residues a wipe cannot reach.
- `kypost-server/README.md` states the classifier's prompt-injection resistance as a measured property rather than a pending bug.

## Placeholders for future data

The book keeps the chapter list above even where the gap table says no data.
