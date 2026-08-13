# Android Client

Source: `kypost-android/README.md`.

## What it is

KyPost for Android is an Android email client backed by a self-hosted KyPost relay. It shows keyword-based inbox tabs and syncs contacts in both directions. Native-push pairing authenticates relay access and contact sync. It gets notifications through native pairing and FCM or direct pull. The current Android application id is `org.kysecurity.mail`; the package rename is a breaking change, so existing `com.urlxl.mail` installs must reinstall and pair again.

## Features

- **Mail**: The paired relay proxies mail. The app stores no mail credentials on the device.
- **Keyword tabs**: Tabs come from server tab and label fields. Tune them in the Keywords screen.
- **Compose**: To, Cc, and Bcc complete from local contacts. An address-book picker adds recipients.
- **Contacts**: Two-way sync against the relay. Open it from the Inbox overflow menu.
- **PGP key signing**: One screen shows your own PGP public-key QR code and scans another person QR code. It saves the key onto an existing contact.
- **MFA push approval**: Push notifications approve or deny logins. An in-app screen handles approval when OEM background limits block the notification.
- **Themes**: Shares presets with the web app. Default is Patina Ky. Choose in the Themes screen.
- **Push notifications**: System notifications plus in-app history for new mail. Each user selects a delivery mode (`push` or `pull`).

## Push pairing

Deep link or QR code:

```
kypost://native-pair?sub=<subscriberId>&hash=<subscriberHash>&srv=<serverUrl>&reg=<registrationUrl>&pt=<pairingToken>
```

Required params: `sub`, `hash`, `srv`, `pt`. Optional: `reg`.

Storage: Keystore-backed `EncryptedSharedPreferences` holds subscriber id, hash, server URL, registration URL, pairing token, last device id. Plaintext DataStore holds notification history and sync status.

Registration: The app calls `reg` from the QR code. If `reg` is absent, it uses `{srv}/api/notifications/native/register`. It sends the FCM token. It marks the device as paired only after success (`ok:true` or `synced:true`). A scan alone does not pair it. It repeats the call on token refresh.

FCM data keys: `messageId`, `senderName`, `emailSubject`, `Keywords`.

## Pull mode (FCM bypass)

The registration response also returns `deliveryMode` (`push` or `pull`) and `pullEndpoint`. If `pullEndpoint` is absent, the app uses `{srv}/api/notifications/native/pull`.

In `pull` mode the app polls:

```
GET {pullEndpoint}?sub=&hash=&after=<cursor>
```

Only those query params authenticate the call. `hash` is the URL-encoded subscriber HMAC. No session or Bearer token. FCM stays registered but is not the source of truth.

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

1. Web app shows a QR code with the deep link (`sub`, `hash`, `srv`, `pt`, optional `reg`).
2. In Push Notifications, tap Scan QR Code or open `kypost://native-pair` directly.
3. The app validates `sub`, `hash`, `srv`, `pt` and resolves the registration endpoint.
4. It calls the native registration endpoint with the FCM token. Success marks the device as paired.
5. On each token refresh, it repeats the registration with stored pairing.

## Troubleshooting 

- Scheme and host must be exactly `kypost://native-pair`.
- Required params `sub`, `hash`, `srv`, `pt` must exist.
- Device must reach the resolved registration endpoint.
- Firebase config must match `org.kysecurity.mail`.
- `400` means malformed or missing field. `401` means bad or expired `pt`; scan a new QR code. `503` means backend has no `PAIRING_SECRET` and retry will not help.
- On Android 13+, grant notification permission or no system notification appears.

## Build and test

```sh
./gradlew testDebugUnitTest
./gradlew assembleDebug
./gradlew connectedDebugAndroidTest   # needs device or emulator; covers EncryptedSharedPreferences store
```

Test coverage:

- Deep-link parser (`NativePairingDeepLinkParserTest`)
- Pairing validation (`PairingValidatorTest`)
- Registration endpoint resolution (`NativeRegistrationEndpointResolverTest`)
- Payload parsing (`messageId`, `senderName`, `emailSubject`, `Keywords`)
- Registration request mapping (`NativeRegistrationRequestMapperTest`)
- Secure pairing store round-trip and encryption (`SecurePairingStoreTest`, instrumented)
