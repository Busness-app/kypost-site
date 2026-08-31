# Introduction

KyPost is a self-hosted email ecosystem: a server you run yourself, paired with native apps for Android, iOS, macOS, and Linux — built around local AI sorting, end-to-end encrypted messages that decrypt only on enrolled devices, and themes that follow you everywhere.

The repositories live under the [Busness-app](https://github.com/Busness-app)
GitHub organization.

## Software covered

| Application | Description |
|---|---|
| `kypost-server` | Self-hosted IMAP web client with local Ollama keyword labeling, WKD publishing, and OIDC single sign-on |
| `kypost-android` | Android email client backed by a self-hosted KyPost relay |
| `kypost-for-Mac` | Native SwiftUI mail client for macOS and iOS, relay-only |
| `kypost-Linux` | Relay-only email client for KDE Plasma and Plasma Mobile, Qt6/Kirigami |
| `kypost-server/worker` | Cloudflare Worker relay for Android/FCM push |
| `kypost-server/worker-apns` | Cloudflare Worker relay for iOS/APNs push |

## How this book is organized

Each chapter covers one system, its installation, and its configuration.

## Conventions

- Where wording matters (security warnings, env var defaults), the text keeps the original phrasing or quotes it.
- Env vars, endpoints, and file paths appear verbatim.
