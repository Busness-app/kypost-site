# Architecture

This chapter describes the structure of KyPost.

## System shape

KyPost uses a relay model. The server talks to IMAP and SMTP. Clients talk only to the server. No client uses IMAP or SMTP directly. One Go relay serves Android, macOS, iOS, and Linux clients.

```
IMAP/SMTP <---> kypost-server (Go) <---> clients (Android / macOS / iOS / Linux)
                      |
                      +---> Ollama (local LLM)
                      +---> Cloudflare Workers (FCM relay, APNs relay)
                      +---> Keyservers / WKD (key discovery and publishing)
                      +---> OpenID Connect provider (optional SSO)
```

Clients hold no mail credentials and no PGP private key until they are
deliberately enrolled; see [PGP & Encryption](./pgp.md). Each paired device
authenticates with its own server-minted secret, revocable one device at a time.

## Server processes

There are four processes in one container. `supervisord` manages them:

- API server: `kypost-server --mode server`
- Polling daemon: `kypost-server --mode daemon`
- Ollama service: `ollama serve`
- One-shot startup pull: `ollama pull <configured model>`

The image sets `OLLAMA_MODELS=/kypost/ollama-models`.

## Classification flow

The server polls unread mail and applies IMAP keywords. The there are seven steps:

1. Fetch unread messages from IMAP (`INBOX` by default).
2. Redact sensitive patterns.
3. Build the prompt from sender, subject, body, and tuning context.
4. Call Ollama `/api/generate`.
5. Match the output against the allowed labels.
6. Apply the IMAP keywords.
7. Save the checkpoint and the decision history.

Warning: Labels are a hint, not a security boundary. A sender can influence the keyword on their own message. The allowlist is enforced after the model answers, so a message cannot get a label you did not configure, and it cannot move, delete, or mark other mail. Do not use a label to grant trust or to auto-archive.

## Client architectures

### Android

One Gradle module (`app/`), package `org.kysecurity.mail`, Views and XML layouts
rather than Compose. Dependencies are wired by hand through `SingletonGraph.kt`.

| Package | Contents |
|---|---|
| (root) | Activities — inbox, email detail, compose, settings, themes, keywords — plus `AppNavigation`, `AppTheme`, `SingletonGraph` |
| `data/` | Room over SQLCipher: `AppDatabase`, DAOs and entities for mail and contacts, `DataRuntime` |
| `mail/` | `MailRepository`, `MailSource`, cursor store and checkpointing |
| `contacts/` | Contact list, detail, edit, address-book sheet, cursor store |
| `pgp/` | `ClientEncryptedSender`, device enrollment (activity, view model, envelope, code), `SignerBinding`, `PgpFingerprint`, `WebmailTab` |
| `push/` | FCM service, UnifiedPush service and registrar, pull notifications, pairing, MFA approval |
| `security/` | `AppLockManager`, `LockoutPolicy`, `PinPolicy`, `SecurityWipe`, `DatabaseKey`, `CredentialCipher`, `SpkiPinner`, Hostile Location settings, attachment ledger |
| `ui/` | `SplitInitializer` — activity embedding for master-detail above 800dp |

Large-screen layouts come from resource qualifiers (`res/layout-w600dp/`) and
`res/xml/split_config.xml`, not from a separate codebase.

### macOS and iOS

One codebase in `KyPost/` builds for both platforms:

| Layer | Contents |
|---|---|
| `App/` | Entry point, scenes, app delegate, DI graph (`SingletonGraph`), polling scheduler, notification dispatcher |
| `Data/` | Relay clients (`RelayMailSource`, sync, push, registration), SwiftData DAOs and entities, Keychain and settings stores |
| `Domain/` | Models, repositories (mail, keywords, contacts, push), use cases (send, pairing, MFA) |
| `Presentation/` | Shared SwiftUI screens and view models, macOS-specific root and preferences views |
| `Style/` | Theme palettes and manager (contract with web `theme.ts` and Android `AppTheme.kt`) |

Platforms split at the root view. iOS uses `MainTabView` (tab layout). macOS uses `MacRootView` (`NavigationSplitView`) plus a per-email `WindowGroup`.

### Linux

One codebase targets two surfaces from one Flatpak:

- Linux Desktop — KDE Plasma, 3-column layout
- KDE Mobile — Plasma Mobile, bottom-tab layout

Structure:

```
core/       libkypostcore: models, SQLite DAOs, stores, relay networking, domain
            repositories, theme data. QtCore/QtNetwork/QtSql only.
app/        main.cpp, push/ (KUnifiedPush + KNotifications), platform/ (SecureStore),
            pgp/, contacts/, mail/, pairing/, qml/ (MobileRoot, DesktopRoot, pages)
tests/      QtTest, stubbed HttpClient/FakeRelayServer; ctest-driven, plus the QML
            suite and tests/guards.tsv, the security guards proven load-bearing
packaging/  flatpak/ (manifest, desktop file, D-Bus service, AppStream), click/ (deferred)
po/         gettext catalogs
scripts/    build-sqlcipher.sh, verify-guards.sh, verify-version.sh
docs/       PARITY.md (authoritative Android-parity matrix), DISTRIBUTION.md,
            THREADING.md, SETUP.md, RENAME_NOTES.md
```


## Dependencies

- **Server**: Docker and Docker Compose required. Go 1.26+ and Node 20+ optional for local dev. Frontend uses React and Vite.
- **Android**: Firebase project with `google-services.json`, FCM enabled. Bouncy Castle for OpenPGP, SQLCipher for the mail database, the UnifiedPush connector, and `play-services-code-scanner` for the pairing QR.
- **macOS/iOS**: Xcode 26, deployment target macOS and iOS 26.5, SwiftData, URLSession, WebKit. One external dependency: GopenPGP, as a SHA-256-pinned binary XCFramework.
- **Linux**: Qt6 (`qt6-base`, `qt6-declarative`, `qt6-webengine`, `qt6-multimedia`, `kirigami` KF6, `knotifications` KF6, `kstatusnotifieritem` KF6, `kdbusaddons` KF6, `ki18n` KF6, `qtkeychain-qt6`, `kunifiedpush`, `zxing-cpp`, `openssl`, `argon2`, `gpgme`), CMake, and SQLCipher built from source by `scripts/build-sqlcipher.sh`.
