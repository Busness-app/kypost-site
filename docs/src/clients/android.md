# Android Client

Source: `kypost-android/README.md`.

## What it is

KyPost for Android is an Android email client backed by a self-hosted KyPost relay. It shows keyword-based inbox tabs and syncs contacts in both directions. Native-push pairing authenticates relay access and contact sync. It gets notifications through native pairing and FCM or direct pull. The current Android application id is `org.kysecurity.mail`; the package rename is a breaking change, so existing `com.urlxl.mail` installs must reinstall and pair again.

## Features

- **Mail**: The paired relay proxies mail. The app stores no mail credentials on the device.
- **Keyword tabs**: Tabs come from server tab and label fields. Tune them in the Keywords screen.
- **Compose**: To, Cc, and Bcc complete from local contacts. An address-book picker adds recipients.
- **Contacts**: Two-way sync against the relay. Open it from the Inbox overflow menu.
- **PGP**: One screen shows your own PGP public-key QR code and scans another person's, saving that key onto an existing contact. The app encrypts outgoing mail to a recipient's key on the device — the plaintext body never reaches the relay for that path — and decrypts client-custody mail once it holds a sealed key envelope (see [Device enrollment](../pgp.md#on-a-native-client-after-device-enrollment)). Without that envelope, encrypted mail hands off to webmail in the user's own browser or the installed webmail PWA, never a Custom Tab.
- **Signature badges**: decided on the device from keys in the local contact store. The relay's `verified` flag is not read at all.
- **MFA push approval**: Push notifications approve or deny logins. An in-app screen handles approval when OEM background limits block the notification.
- **Themes**: Shares presets with the web app. Default is Patina Ky. Choose in the Themes screen.
- **Push notifications**: System notifications plus in-app history for new mail. Delivery is FCM, a UnifiedPush distributor you choose, or App Pull, which polls your own server and involves neither. Each user selects the delivery mode (`push` or `pull`) on the web Notifications page.
- **Large screens**: a navigation rail and wide inbox, contacts and compose layouts at 600dp, and inbox/contacts master-detail through activity embedding at 800dp — measured on a Fold, where 720dp wrongly split the 751dp cover screen. State survives fold and unfold: the folder, tab, scroll position, an in-progress contact edit, and the app lock.
- **Security**: an app-lock PIN or biometric with escalating delays and wipe-on-repeat, Hostile Location Protection, and a SQLCipher-encrypted mail database. See [Security Model](../security.md#android).

## Push pairing

Deep link or QR code:

```
kypost://native-pair?sub=<subscriberId>&srv=<serverUrl>&reg=<registrationUrl>&pt=<pairingToken>&pin=<tlsPin>
```

Required params: `sub`, `srv`, `pt`. Optional: `reg`, `pin`.

`srv` and any `reg` must be `https` and the **same origin**. The app refuses the link otherwise, because `reg` is where the device secret is minted while the confirmation dialog shows the user `srv`. `hash` is legacy: a link that still carries it comes from an outdated server, the app ignores it, and the server no longer accepts it.

**Authentication is per device, not per account.** Registration exchanges the one-time `pairingToken` for a `deviceId` and a `deviceSecret` minted by the server. Every later request sends them as `X-Kypost-Device-Id` and `X-Kypost-Device-Secret` headers. Revoke a single device from the server's Security page.

Storage: a Keystore-backed `EncryptedSharedPreferences` file holds the subscriber id, server URL, registration URL, pairing token, device id and device secret. Plaintext DataStore holds notification history and sync status.

Registration: The app calls `reg` from the QR code. If `reg` is absent, it uses `{srv}/api/notifications/native/register`. It sends the FCM token. It marks the device as paired only after success (`ok:true` or `synced:true`). A scan alone does not pair it. It repeats the call on token refresh, and each successful registration mints a **new** device secret that invalidates the previous one.

FCM data keys: `messageId`, `senderName`, `emailSubject`, `Keywords`.

## Pull mode (FCM bypass)

The registration response also returns `deliveryMode` (`push` or `pull`) and `pullEndpoint`. If `pullEndpoint` is absent, the app uses `{srv}/api/notifications/native/pull`.

In `pull` mode the app polls:

```
GET {pullEndpoint}?after=<cursor>
```

The cursor is the only query parameter. Authentication is the `X-Kypost-Device-Id` and `X-Kypost-Device-Secret` headers, never a query parameter — credentials in a URL end up in access logs and browser history. No session and no Bearer token. FCM stays registered but is not the source of truth.

The same dispatcher that handles an FCM data message renders each polled notification. Tap behavior is identical.

Dedup uses strictly increasing `seq`. The app keeps a durable per-subscriber `lastCursor` at `max(lastCursor, response.cursor)` only after it delivers notifications, so a crash causes a re-fetch, not a loss.

`deliveryMode` in both register and pull responses is authoritative. A change to `push` on the web stops polling. A change to `pull` starts it. The app reads it again on each foreground.

Cadence: WorkManager periodic work at the platform minimum of 15 minutes, plus immediate pull on foreground and after pairing. Near real-time needs a foreground service with a short loop and a persistent notification. That is not the default. The app backs off after `400`, `401`, `503`, and network errors.

## Firebase setup

1. Create or update the Firebase Android app for `org.kysecurity.mail`.
2. Download `google-services.json`.
3. Put it at `app/google-services.json`.
4. Enable FCM.

## Notification permission (Android 13+)

The app requests `POST_NOTIFICATIONS` at launch. If the user denies it, the app still parses payloads and saves them to in-app history. It does not show system notifications.

## Pairing steps from QR

1. Web app shows a QR code with the deep link (`sub`, `srv`, `pt`, optional `reg` and `pin`).
2. In Push Notifications, tap Scan QR Code or open `kypost://native-pair` directly. The scanner is Google's `play-services-code-scanner`; pair by entering the URL instead if you would rather keep Play Services out of that path.
3. The app validates `sub`, `srv`, `pt`, checks `srv` and any `reg` are `https` and same-origin, and resolves the registration endpoint.
4. It shows a confirmation dialog naming the server host, then calls the native registration endpoint with the FCM token. Success marks the device as paired and stores the returned `deviceId` and `deviceSecret`.
5. On each token refresh, it repeats the registration with stored pairing.

## Troubleshooting 

- Scheme and host must be exactly `kypost://native-pair`.
- Required params `sub`, `srv`, `pt` must exist, and `srv` and `reg` must be `https` and the same origin.
- Device must reach the resolved registration endpoint.
- Firebase config must match `org.kysecurity.mail`.
- `400` means malformed or missing field. `401` means bad or expired `pt`; scan a new QR code. `503` means backend has no `PAIRING_SECRET` and retry will not help.
- On Android 13+, grant notification permission or no system notification appears.

## Installing

Signed builds are attached to each [tagged
release](https://github.com/Busness-app/KyPost-for-Android/releases): an `.apk`
to sideload, an `.aab` for Play distribution, and a `.sha256` beside each one.

Verify before you install — the digest is the whole point of publishing it:

```sh
sha256sum -c kypost-<tag>.apk.sha256
```

There is no F-Droid or Play listing. The signing key is checked in CI before
publication: the workflow refuses to release unless `apksigner` reports the
expected signer, so an APK that verifies against the published digest carries
the key the project intends.

## Build and test

```sh
./gradlew testDebugUnitTest
./gradlew assembleDebug
./gradlew connectedDebugAndroidTest   # needs device or emulator
```

Instrumented tests need a connected device or emulator **with a secure lock
screen set**. The Keystore-backed enrollment vault refuses to create a key
without one by design, so on a bare emulator the vault suites fail as though the
code were broken. CI sets a PIN first.

### Release builds

`:app:assembleRelease` fails without signing material, deliberately: AGP does not
fall back to the debug keystore, so without the guard a green run would emit an
unsigned APK. Add a gitignored `keystore.properties` at the repository root with
`storeFile`, `storePassword`, `keyAlias` and `keyPassword`.

CI's `release-build` job generates a throwaway key per run, so every PR verifies
the R8 configuration and `lintVitalRelease` without the real key being reachable
from a `pull_request` trigger. Published builds come from `release.yml` on a `v*`
tag: it reads the real key from the protected `release` environment, checks the
tag against `versionName`, and refuses to publish unless `apksigner` reports the
expected signer. Never build a release for distribution from a workstation.

Test coverage:

- Deep-link parser (`NativePairingDeepLinkParserTest`)
- Pairing validation (`PairingValidatorTest`)
- Registration endpoint resolution (`NativeRegistrationEndpointResolverTest`)
- Payload parsing (`messageId`, `senderName`, `emailSubject`, `Keywords`)
- Registration request mapping (`NativeRegistrationRequestMapperTest`)
- Secure pairing store round-trip and encryption (`SecurePairingStoreTest`, instrumented)
