# Development & Testing

## Server

From `kypost-server/README.md`:

Backend:

```bash
cd backend
go build -buildvcs=false ./...
go test ./...
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

Structure: `backend/` (Go API, poller, adapters, config, state, health), `frontend/` (React and Vite), `scripts/` (bootstrap and test helpers), `Dockerfile` (single image with backend, frontend, Ollama), `docker-compose.yml`, `supervisord.conf`.

## Android

From `kypost-android/README.md`:

```sh
./gradlew testDebugUnitTest
./gradlew assembleDebug
./gradlew connectedDebugAndroidTest   # needs device or emulator
```

Instrumented tests need a connected device or emulator **with a secure lock
screen set** — the Keystore-backed enrollment vault refuses to create a key
without one by design, so on a bare emulator the vault suites fail as though the
code were broken. CI sets a PIN first.

`:app:assembleRelease` fails without signing material, deliberately: AGP does not
fall back to the debug keystore. Add a gitignored `keystore.properties` at the
repository root. Never build a release for distribution from a workstation —
`release.yml` on a `v*` tag reads the real key from a protected environment,
checks the tag against `versionName`, and refuses to publish unless `apksigner`
reports the expected signer.

Coverage includes: `NativePairingDeepLinkParserTest`, `PairingValidatorTest`, `NativeRegistrationEndpointResolverTest`, payload parser, `NativeRegistrationRequestMapperTest`, `SecurePairingStoreTest`.

## macOS & iOS

From `kypost-for-Mac/README.md`:

- SwiftData, URLSession, WebKit, and one external dependency: GopenPGP, as a SHA-256-pinned binary XCFramework built by `.github/workflows/gopenpgp-xcframework.yml` from the upstream tag in `Dependencies/gopenpgp.env`.
- Xcode 26, deployment target macOS and iOS 26.5.
- CI runs the tests when signing material is available and compiles when it is not.
- Tests use Swift Testing (`@Test`, `#expect`) in `KyPost Tests/`. UI stubs in `KyPost UITests/`. Network tests run against stubbed `HTTPClient`. No backend needed.

```sh
xcodebuild test -project "KyPost.xcodeproj" -scheme "KyPost"
```

Or run with ⌘U in Xcode.

## Linux

From `kypost-Linux/README.md`:

```sh
./scripts/build-sqlcipher.sh /tmp/sqlcipher     # encryption at rest needs this
cmake -B build -S . -DCMAKE_BUILD_TYPE=RelWithDebInfo -DKYPOST_SQLCIPHER_ROOT=/tmp/sqlcipher
cmake --build build
ctest --test-dir build
```

Without `KYPOST_SQLCIPHER_ROOT`, configure reports encrypted databases as
unavailable and the build produces a client whose database is not encrypted. It
says so rather than pretending.

CI: builds the Flatpak manifest for each PR under a private D-Bus session; for
each push to `main` it publishes a signed OSTree repo to the `gh-pages` branch,
which is what the `kypost` remote serves. Tagged `v*` builds additionally attach
`kypost-x86_64.flatpak` and `kypost-aarch64.flatpak` to the GitHub release.

Flatpak:

```sh
flatpak-builder --user --force-clean --install-deps-from=flathub \
  build-flatpak packaging/flatpak/com.kysecurity.mail.yaml
flatpak-builder --run build-flatpak packaging/flatpak/com.kysecurity.mail.yaml kypost
```

Tests use QtTest with stubbed `HttpClient` and `FakeRelayServer`, driven by
`ctest`, plus a QML suite. `tests/guards.tsv` lists the security guards proven
load-bearing and `scripts/verify-guards.sh` checks them mechanically. See
`TESTING.md` for the manual checklist, `docs/PARITY.md` for the authoritative
Android-parity matrix, and `AGENTS.md` for rules.

