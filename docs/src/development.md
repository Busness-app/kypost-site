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

Instrumented tests cover the `EncryptedSharedPreferences` pairing store.

Coverage includes: `NativePairingDeepLinkParserTest`, `PairingValidatorTest`, `NativeRegistrationEndpointResolverTest`, payload parser, `NativeRegistrationRequestMapperTest`, `SecurePairingStoreTest`.

## macOS & iOS

From `kypost-for-Mac/README.md`:

- No external Swift packages. SwiftData, URLSession, WebKit.
- Xcode 26, deployment target macOS and iOS 26.5.
- Tests use Swift Testing (`@Test`, `#expect`) in `KyPost Tests/`. UI stubs in `KyPost UITests/`. Network tests run against stubbed `HTTPClient`. No backend needed.

```sh
xcodebuild test -project "KyPost.xcodeproj" -scheme "KyPost"
```

Or run with ⌘U in Xcode.

## Linux

From `kypost-Linux/README.md`:

```sh
cmake -B build -S .
cmake --build build
ctest --test-dir build
```

CI: builds the Flatpak manifest for each PR; for each push to `main`, publishes a signed OSTree repo to `gh-pages`.

Flatpak:

```sh
flatpak-builder --user --force-clean --install-deps-from=flathub \
  build-flatpak packaging/flatpak/com.urlxl.mail.yaml
flatpak-builder --run build-flatpak packaging/flatpak/com.urlxl.mail.yaml kypost
```

Tests use QtTest with stubbed `HttpClient` and `FakeRelayServer`, driven by `ctest`. See `TESTING.md` for the manual checklist and `AGENTS.md` for rules.

