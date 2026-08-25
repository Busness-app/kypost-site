# Linux Client

## What it is

KyPost for Linux is a relay-only email client for KDE Plasma and Plasma Mobile, built with Qt6/Kirigami. It does not use IMAP or SMTP. The relay backend carries all mail, contact, and push traffic. One codebase targets two surfaces from one Flatpak:

- **Linux Desktop** — KDE Plasma, 3-column sidebar, list, detail.
- **KDE Mobile** — Plasma Mobile, bottom-tab push navigation.

It is a sibling to the Android and SwiftUI apps. All three use the same Go relay.

## Features

- **Inbox, message detail, HTML composer** — reply, reply-all, forward, send, with attachments and drafts. A sandboxed `WebEngineView` renders the body with JavaScript and remote images disabled.
- **Server-side folders** — standard mailboxes and subfolders. Create, rename, delete.
- **Contacts** — synced list and detail. Create and edit offline and queue changes. Handles group membership and duplicates.
- **PGP** — exchange public keys through QR codes. Scan or show a key with the camera, confirm the fingerprint out of band. Webmail can seal the account key to a temporary ECDH device key; KyPost imports it into the user's GnuPG keyring and clears the transient key bytes. Once enrolled, end-to-end encrypted mail is **decrypted and signed on this device** through the user's own `gpg-agent` (GPGME), so KyPost never sees the OpenPGP passphrase and hardware tokens and smartcards work unchanged. Sending signs and encrypts locally, gives each blind recipient their own ciphertext, keeps the real subject inside the ciphertext, and refuses to send at all if any recipient has no usable key — there is no silent downgrade. Attachments can be attached to an encrypted message. Mail this device holds no key for is still explained and routed to webmail.
- **Compose autocomplete** — type name or address, select a synced contact.
- **Push over UnifiedPush** — two tiers with fallback: system distributor, then 90-second polling. Mail still arrives with no distributor. Only your distributor push server sees a notification.
- **Security** — an optional PIN lock with a lockout, a configurable background-lock grace period, and a configurable erase-after-N-failures threshold (including "never", which declines only the erase; the rate limit always stays). You can encrypt the pairing credential behind that PIN (AES-256-GCM with Argon2; Qt exposes neither, see `core/security/CredentialCipher.h`). The local database is **encrypted at rest** with SQLCipher, and an existing plaintext profile is converted on the next launch. The client pins the relay's TLS chain on first use, anchored to the **issuer** rather than the leaf, so a routine renewal is not reported as impersonation. Hostile Location Protection writes nothing to disk and refuses to turn on at all if it cannot first erase what is already there.
- **15 themes** — copied byte for byte from the shared design system.
- **Device pairing** — paste a link or use a `kypost://` deep link.
- **Localized** — every user string is wrapped for translation (`po/`).

## Installing

KyPost has its own signed Flatpak remote, and it is live for both `x86_64` and
`aarch64`:

```sh
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak remote-add --if-not-exists kypost https://busness-app.github.io/KyPost-for-Linux/kypost.flatpakrepo
flatpak install kypost com.kysecurity.mail
```

`flatpak update` installs new versions. Flathub supplies the `org.kde.Platform//6.11` runtime. KyPost is not on Flathub and will not be; Flathub bans applications that use AI and the KyPost backend uses AI. A tagged release also attaches a single-file `.flatpak` bundle per architecture — `v0.2.0` carries `kypost-x86_64.flatpak` and `kypost-aarch64.flatpak` — but a bundle gives you no automatic updates. Prefer the remote unless you need an offline install. See `docs/DISTRIBUTION.md`.

## Building

KyPost needs Qt6. It dropped Qt5 and Ubuntu Touch. See `AGENTS.md` for reasons and review conditions. Use one out-of-tree build dir:

```sh
cmake -B build -S . -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build build
ctest --test-dir build
```

Dependencies (Arch names): `qt6-base`, `qt6-declarative`, `qt6-webengine`, `qt6-multimedia`, `kirigami` (KF6), `knotifications` (KF6), `kstatusnotifieritem` (KF6), `kdbusaddons` (KF6), `ki18n` (KF6), `qtkeychain-qt6`, `kunifiedpush`, `zxing-cpp`, `openssl`, `argon2`, `gpgme`. For Ubuntu and KDE neon equivalents, see `.github/workflows/ci.yml`.

`openssl` supplies AES-256-GCM and `argon2` supplies the memory-hard key derivation for the credential seal. See `core/security/CredentialCipher.h`. `gpgme` is the C API, not the `gpgmepp` C++ wrapper, and it is what delegates OpenPGP custody to the user's `gpg-agent`.

### Encryption at rest needs SQLCipher

The command above builds a working client whose database is **not** encrypted —
configure reports `SQLCipher: not configured (KYPOST_SQLCIPHER_ROOT unset)`.
SQLCipher has to carry the SONAME `libsqlite3.so.0` and be built with
`SQLITE_ENABLE_COLUMN_METADATA`, which distro packages generally do not do, so
the repo builds it the same way CI and the Flatpak manifest do:

```sh
./scripts/build-sqlcipher.sh /tmp/sqlcipher
cmake -B build -S . -DCMAKE_BUILD_TYPE=RelWithDebInfo -DKYPOST_SQLCIPHER_ROOT=/tmp/sqlcipher
```

### Flatpak

```sh
flatpak-builder --user --force-clean --install-deps-from=flathub \
  build-flatpak packaging/flatpak/com.kysecurity.mail.yaml
flatpak-builder --run build-flatpak packaging/flatpak/com.kysecurity.mail.yaml kypost
```

This manifest is the packaging target for desktop and mobile. `packaging/click/` is an empty placeholder until UBports releases a Qt6/KF6 track.

CI builds the manifest for each PR. For each push to `main`, CI publishes a signed OSTree repo to `gh-pages` (` .github/workflows/flatpak.yml`). The `flatpak remote-add` command above uses that repo.

## Architecture

As noted in [Architecture](../architecture.md). The `core/` boundary allows only Qt Core, Network, Sql. See `AGENTS.md` Section 5.

Authoritative design source: `Linux_QT_Client_Plan.md` (decisions, wire contracts, push state machine, risks and gaps). `docs/PARITY.md` is the authoritative Android-parity matrix. `TESTING.md` is the manual checklist. `AGENTS.md` summarizes rules that break most easily. `tests/guards.tsv` lists the security guards proven load-bearing, and `scripts/verify-guards.sh` checks them.

