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
architecture/    Generated — the interactive architecture map (see below)
```

## The architecture map

`/architecture/` is the only part of this repo that isn't hand-written. It is
built by [KyData](https://github.com/Yoshiofthewire/KyData) from a JSON
description of the KyPost repos, and it is committed here because the site has
no build step.

**Don't edit it by hand — a rebuild will overwrite it.** To regenerate after
the architecture changes:

```sh
cd ../KyData
node src/build.js data/kypost.json --out ../kypost-site/architecture --assets ../assets
```

`--assets ../assets` points the page at the fonts and logo this site already
ships, rather than shipping a second 2 MB copy of them. The map is otherwise
self-contained: one HTML file with its script, styles, and data inlined.

`architecture/graph.json` is the same data the page is drawn from, published
alongside it so it can be read without scraping the HTML.

The page covers the ecosystem overview, cross-platform reach, the privacy
model (client-held PGP keys, WKD/Autocrypt key discovery, sealed pickup
links, protected subjects, generic push), the device-level security
hardening shipped across the clients, the shared 15-theme customization
system (with a scroll-driven preview built from real app screenshots), and
the current status of each project.

## License

AGPL / GPL-3.0
