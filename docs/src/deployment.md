# Deployment & Operations

## Quick start snapshot

See [Server Quick Start](./server/quick-start.md) for the eight steps with `KYPOST_BIND`.

## Runtime checks (server README)

```bash
docker compose ps
docker compose logs -f kypost-server
docker exec -it kypost-server ps aux
docker exec -it kypost-server ls -la /kypost/config /kypost/state
docker volume ls | grep kypost
```

Persistence:

- `docker compose up --build` keeps volumes.
- `docker compose down -v` removes volumes and stored data.

## Reverse proxy networking

The server README devotes a long note to this. Summary:

- `KYPOST_BIND` decides which interface publishes 5866 and has no default.
- For a proxy on the same host, use `127.0.0.1`. For a proxy elsewhere, use the LAN IP or `0.0.0.0` to publish everywhere.
- Better still, run the proxy as a container on `kypost-net` (the Compose network) and point it at `http://KyPost-Server:5866`. That DNS name stays valid across rebuilds and ignores published ports.
- To detect a mistake, fetch `GET /api/status` after sign-in. `clientIp` must be your public address and `proxyHeadersTrusted` must be `true` (or `false` for direct TLS termination in KyPost). If `clientIp` is a gateway like `172.x.0.1`, every user shares one lockout bucket and the cookie is not marked `Secure`.
- Behind different hosts, combine direct TLS in KyPost (`TLS_CERT_FILE` + `TLS_KEY_FILE`) with a proxy. Use a self-signed cert and make the proxy skip verification (`noTLSVerify: true` on cloudflared, `proxy_ssl_verify off` on nginx).

Full snippet and error recovery are in `docs/Reverse_Proxy_Networking.md`.

## Updating (server)

The server checks GitHub releases hourly. It emails the primary admin once and shows the update in Configuration → Application.

Apply the current `stable` image with health-gated rollback:

```bash
./scripts/update-host.sh
```

That script resolves `stable` to a digest, verifies the attestation with `gh attestation verify`, preserves that digest for rollback. It needs Docker Compose v2, Buildx, `gh`. To pin a release, set `KYPOST_VERSION=0.2.0` in `.env`.

For a locally built image with no published digest, the updater refuses it. Use `git pull --ff-only && docker compose up --build -d` instead. See `CHANGELOG.md` for the upgrade/rollback matrix. Back up first.

Automatic updates are opt-in and need systemd:

```bash
./scripts/install-auto-update.sh
```

It installs a daily timer at 03:15 local time plus up to one hour jitter, enables lingering for the Docker user. Disable with `systemctl --user disable --now kypost-update.timer`. Without systemd, schedule `./scripts/update-host.sh --auto` with `KYPOST_AUTO_UPDATE=true`.

## Linux distribution

From `kypost-Linux/README.md`:

- Own signed Flatpak remote at `https://busness-app.github.io/KyPost-for-Linux/kypost.flatpakrepo`, app id `com.kysecurity.mail`, plus Flathub for the `org.kde.Platform//6.11` runtime. Each release also attaches a `.flatpak` bundle (no auto-updates). See `docs/DISTRIBUTION.md`.
- The remote is live. `kypost.flatpakrepo` points at `https://busness-app.github.io/KyPost-for-Linux/repo/`, whose summary is GPG-signed and carries `app/com.kysecurity.mail/x86_64/master` and `app/com.kysecurity.mail/aarch64/master`.
- The OSTree repo republishes on every push to `main`, so `flatpak update` tracks the branch. The `.flatpak` bundles are a separate thing: they attach only to a `v*` tagged release. The first is `v0.2.0`.
- `scripts/verify-version.sh` keeps `CMakeLists.txt`, the AppStream `<release>` entry, and the git tag from drifting apart, and CI gates a `v*` build on all three agreeing. A binary reporting the previous version, or a stale AppStream entry that stops Discover offering the update, is the failure it exists to prevent.
- CI builds aarch64 artifacts as well as x86-64, and gates the release on the version matching the tag.

## Push relay deployment

Maintainer runs Cloudflare Workers. See [Push Relays](./server/push-relays.md) for setup, secrets, and redeploy. Self-hosters need no Firebase or Apple account.

## What the READMEs do not say

- No managed hosting guide.
- No Kubernetes manifest or systemd unit beyond the auto-update timer.
- No log rotation config.
