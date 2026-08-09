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
- **PGP** — exchange public keys through QR codes. Scan or show a key with the camera, confirm fingerprint out of band. Marks encrypted mail it cannot read and links to webmail. Never holds a private key.
- **Compose autocomplete** — type name or address, select a synced contact.
- **Push over UnifiedPush** — two tiers with fallback: system distributor, then 90-second polling. Mail still arrives with no distributor. Only your distributor push server sees a notification.
- **Security** — optional PIN lock with lockout and wipe after repeated failures. Can encrypt the pairing credential behind that PIN (AES-256-GCM with Argon2; Qt exposes neither, see `core/security/CredentialCipher.h`). TOFU certificate pinning on first use. Hostile Location Protection writes nothing to disk.
- **15 themes** — copied byte for byte from the shared design system.
- **Device pairing** — paste a link or use a `kypost://` deep link.
- **Localized** — every user string is wrapped for translation (`po/`).

## Installing

KyPost uses its own signed Flatpak remote:

```sh
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak remote-add --if-not-exists kypost https://yoshiofthewire.github.io/KyPost-for-Linux/kypost.flatpakrepo
flatpak install kypost com.urlxl.mail
```

`flatpak update` installs new versions. Flathub supplies the `org.kde.Platform` runtime. KyPost is not on Flathub and will not be; Flathub bans AI use and the backend uses AI. Each release also attaches a single `.flatpak` bundle, but a bundle gives no auto-updates. See `docs/DISTRIBUTION.md`.

## Building

KyPost needs Qt6. It dropped Qt5 and Ubuntu Touch. See `AGENTS.md` for reasons and review conditions. Use one out-of-tree build dir:

```sh
cmake -B build -S .
cmake --build build
ctest --test-dir build
```

Dependencies (Arch names): `qt6-base`, `qt6-declarative`, `qt6-webengine`, `kirigami` (KF6), `knotifications` (KF6), `kdbusaddons` (KF6), `ki18n` (KF6), `qtkeychain-qt6`, `kunifiedpush`, `zxing-cpp`, `openssl`, `argon2`. For Ubuntu and KDE neon equivalents, see `.github/workflows/ci.yml`.

`openssl` supplies AES-256-GCM and `argon2` supplies the memory-hard key derivation for the credential seal. See `core/security/CredentialCipher.h`.

### Flatpak

```sh
flatpak-builder --user --force-clean --install-deps-from=flathub \
  build-flatpak packaging/flatpak/com.urlxl.mail.yaml
flatpak-builder --run build-flatpak packaging/flatpak/com.urlxl.mail.yaml kypost
```

This manifest is the packaging target for desktop and mobile. `packaging/click/` is an empty placeholder until UBports releases a Qt6/KF6 track.

CI builds the manifest for each PR. For each push to `main`, CI publishes a signed OSTree repo to `gh-pages` (` .github/workflows/flatpak.yml`). The `flatpak remote-add` command above uses that repo.

## Architecture

As noted in [Architecture](../architecture.md). The `core/` boundary allows only Qt Core, Network, Sql. See `AGENTS.md` Section 5.

Authoritative design source: `Linux_QT_Client_Plan.md` (decisions, wire contracts, push state machine, risks and gaps). `TESTING.md` is the manual checklist. `AGENTS.md` summarizes rules that break most easily.

