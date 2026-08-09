# Contacts & CardDAV

## CardDAV Support

KyPost has a first-class contacts store and two sync surfaces: the native relay sync and CardDAV.

## Address book (server)

- Contacts address book with groups, dedupe, bulk delete, CSV and vCard import and export, photo support.
- CardDAV server at `/dav` and `/.well-known/carddav` to sync to phones and desktop apps (per-user DAV password authenticates).
- Optional CardDAV client that syncs against an external address book.

Data lives per user in SQLite `state.db` alongside mailbox state, plus notification prefs in `config.yaml`. Photos are handled by `POST|GET|DELETE /api/contacts/{id}/photo`.

Endpoints:

- `GET|POST /api/contacts`, `GET|PUT|DELETE /api/contacts/{id}`
- `POST /api/contacts/dedupe`, `GET /api/contacts/search`, `POST /api/contacts/bulk-delete`
- `GET /api/contacts/export` and `POST /api/contacts/import`
- `GET|POST|DELETE /api/contacts/dav-password`
- `GET|POST|DELETE /api/contacts/carddav-client/config` and `POST /api/contacts/carddav-client/sync`
- `POST|GET|DELETE /api/contacts/{id}/photo`, `POST /api/contacts/{id}/self`
- Groups: `GET|POST /api/groups`, `PUT|DELETE /api/groups/{id}`

## Relay sync for native clients

Mobile two-way sync uses cursor-based endpoints:

- `GET|POST /api/contacts/sync` — pairing token authenticates the call.
- `GET /api/contacts/sync` with cursor on Android; server README frames it as mobile sync.

Android:

- Two-way sync against the relay, opened from the Inbox overflow menu.
- Compose completes To, Cc, Bcc from local contacts; an address-book picker adds recipients.

Mac:

- Two-way sync, local edits win first, reconciliation keeps data safe.
- Contacts carry an extended schema: groups, photo, IM and social handles, websites, relations, extra dates, phonetic names, department, custom fields, pronouns, PGP public key.

Linux:

- Synced list and detail views. Create and edit offline and queue changes. Handles group membership and duplicates.
- Compose autocomplete from synced contacts.

## CardDAV server details

- Per-user DAV password, set via `GET|POST|DELETE /api/contacts/dav-password`.
- Standard discovery at `/.well-known/carddav` and `/dav/...`.

## CardDAV client details

- Config at `GET|POST|DELETE /api/contacts/carddav-client/config`.
- Manual sync via `POST /api/contacts/carddav-client/sync`.