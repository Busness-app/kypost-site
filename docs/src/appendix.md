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
| Android | No min Android API level; no background-restriction tuning beyond backoff |
| macOS & iOS | No TestFlight steps; known gaps are v2 candidates listed in README |
| Linux | No Plasma Mobile device list |
| Pairing | No signing algorithm beyond HMAC with `PAIRING_SECRET` |
| Push Notifications | No sound/badge/grouping config |
| Contacts | No dedupe algorithm; no CardDAV sync interval |
| PGP | No token lifetime beyond 2 min QR and up to 7-day pickup storage |
| Security | No formal threat model file |
| Theming | No 15 theme names beyond Patina Ky; no custom-theme guide |
| Development | No style guide copy beyond `AGENTS.md`/`STYLE_GUIDE.md` pointers |
| Deployment | No Kubernetes or non-systemd log rotation guide |
| Licensing | No CLA/DCO; no third-party inventory beyond fonts |

## Other gaps named as future work

- **Mac known gaps (v2 candidates)**: attachments, mail cursor/delta, read/archive/delete from reader, draft save button, server-side search, QR camera on macOS.
- **Linux**: `packaging/click/` is deferred until UBports releases a Qt6/KF6 track.

## Placeholders for future data

The book keeps the chapter list above even where the gap table says no data.
