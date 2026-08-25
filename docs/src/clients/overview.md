# Clients — Overview

The ecosystem has three native clients. Each talks only to the relay. No client uses IMAP or SMTP. One device pairing with a QR code or deep link creates the relay credential. After that, the relay handles mail, keyword tabs, push, and contact sync.

## Which client for which platform

- **Android** — `kypost-android`, package `org.kysecurity.mail`, FCM or UnifiedPush + pull fallback. The package rename is breaking for existing installs.
- **macOS & iOS** — `kypost-for-Mac`, bundle `com.urlxl.mail`, SwiftUI shared codebase, APNs + polling.
- **Linux** — `kypost-Linux`, app id `com.kysecurity.mail`, KDE Plasma and Plasma Mobile, Qt6/Kirigami Flatpak, UnifiedPush + polling.

## Common traits

All clients share:

- Relay-only access. No mail credentials on the device.
- A per-device credential minted at registration (`deviceId` + `deviceSecret`), revocable one device at a time, that cannot sign in to webmail.
- Keyword-based inbox tabs that come from server fields. The user tunes them on each client.
- Compose with contact autocomplete and an address-book picker.
- Two-way contact sync against the relay.
- PGP public-key exchange through QR codes with fingerprint confirmation out of band.
- Optional **device enrollment**, after which the client reads end-to-end encrypted mail without the server. Until then, encrypted mail hands off to webmail rather than showing ciphertext. See [PGP & Encryption](../pgp.md).
- Signature verdicts decided locally from keys the device holds, in six states. The relay's own `verified` flag is not read.
- Certificate pinning at first pairing. Android can additionally receive the pin in the pairing QR, closing the trust-on-first-use window.
- Hostile Location Protection or equivalent keep-no-data-on-device option.
- The same theme system. 15 themes that match byte for byte. Default is Patina Ky.
- Deep-link scheme `kypost://`

## Differences the READMEs highlight

| Area | Android | macOS/iOS | Linux |
|---|---|---|---|
| UI | Native Android screens | iOS tab layout (`MainTabView`), macOS `NavigationSplitView` + pop-out `WindowGroup` | Plasma desktop 3-column, Plasma Mobile bottom-tab, QML `MobileRoot` / `DesktopRoot` |
| Mail rendering | Not detailed | WebKit with JS off, remote content blocked | WebEngineView with JS and remote images disabled |
| Push | FCM native + pull `GET` polling, per-user `push`/`pull` mode on web | APNs + 90s foreground polling + iOS background refresh | UnifiedPush distributor + 90s polling |
| Lock | PIN or biometric, escalating delays, wipe-on-repeat, common PINs rejected | Require Unlock (Face ID/Touch ID/passcode), Hostile Location erases cache | PIN lock with configurable lockout, grace period and erase threshold; credential seal with AES-256-GCM + Argon2 |
| On-device PGP | Reads and writes once enrolled | Reads once enrolled; sending still goes through the relay | Reads and writes through the user's own `gpg-agent` |
| Cached mail at rest | SQLCipher, key in the Keystore | SwiftData store with backup exclusion | SQLCipher, converted in place on upgrade |
| Layout | Phone, plus a navigation rail and wide layouts at 600dp and master-detail via activity embedding at 800dp | iOS tab layout, macOS three-pane + pop-out readers | Plasma desktop 3-column, Plasma Mobile bottom-tab |
| QR camera | Scan or show QR on one screen (Play Services code scanner) | iOS scans with camera + pasted link fallback; macOS pasted link only | Camera scan and show |
| Language | Kotlin (`org.kysecurity.mail`) | Swift, SwiftUI, SwiftData, URLSession, WebKit; GopenPGP as its one external dependency | C++/QML, Qt6/Kirigami, SQLite/SQLCipher, GPGME |

## Bundle and naming

- The Mac README says the app name is KyPost everywhere (Dock, Home Screen, About, permission prompts, project and scheme, deep link). Bundle IDs and Keychain group stay `com.urlxl.mail` on purpose. Renaming them is a separate high-risk step. See `Brand_Refresh_KyPost.md`.
- Android app ID is `org.kysecurity.mail`. Existing installs of `com.urlxl.mail` must reinstall, pair again, and re-enrol any device-held PGP identity.
- Linux app ID is `com.kysecurity.mail`, renamed from `com.urlxl.mail`. See `docs/RENAME_NOTES.md` in that repo.

## Pairing

All clients pair from the web app. See [Pairing](../pairing.md) for the deep-link format and validation.
