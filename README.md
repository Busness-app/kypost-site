# KyPost Site

The landing page for the KyPost email ecosystem — a self-hosted mail server
paired with native, relay-only clients for Android, iOS, macOS, and Linux.

This repo is just the marketing site. The actual products live in their own
repos:

- [KyPost Server](https://github.com/Yoshiofthewire/KyPost-Server) — self-hosted IMAP/SMTP web client with local-AI keyword labeling
- [KyPost for Android](https://github.com/Yoshiofthewire/KyPost-for-Android)
- [KyPost for Mac & iOS](https://github.com/Yoshiofthewire/KyPost-for-Mac)
- [KyPost for Linux](https://github.com/Yoshiofthewire/KyPost-for-Linux)

## What's here

A single-page static site, no build step, no framework:

```
index.html       All page sections
css/styles.css   Layout, typography, @font-face, theme-wipe demo styling
js/main.js       Mobile nav toggle, scroll-spy nav highlighting, theme-wipe scroll mechanic
assets/          Logos, mascot art, self-hosted fonts (Space Grotesk, IBM Plex Mono),
                 and real KyPost web app screenshots used in the theme demo
```

The page covers the ecosystem overview, cross-platform reach, the privacy
model (client-held PGP keys, WKD/Autocrypt key discovery, sealed pickup
links, protected subjects, generic push), the device-level security
hardening shipped across the clients, the shared 15-theme customization
system (with a scroll-driven preview built from real app screenshots), and
the current status of each project.

## License

AGPL / GPL-3.0
