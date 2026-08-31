# Server — Configuration

## Common environment variables

This is a practical summary, not the complete configuration contract. Use the
server repository's [`.env.example`](https://github.com/Busness-app/KyPost-Server/blob/main/.env.example)
for every supported setting, its current default, and its security notes.

- `WEB_PORT` (5866)
- `TZ` (America/New_York)
- `SECRET_DIR` (/kypost/private). Each `*_KEY_FILE` and `*_SECRET_FILE` default derives from this.
- `OLLAMA_BASE_URL` (http://127.0.0.1:11434)
- `OLLAMA_MODEL` (nemotron-3-nano:4b). See classifier note below.
- `TUNING_FILE` (/kypost/config/TUNING.md)
- `OLLAMA_MODELS_HOST_DIR` (./share/ollama/models)
- `IMAP_CONFIG_FILE` ($SECRET_DIR/imap-config.json)
- `IMAP_CONFIG_KEY_FILE` ($SECRET_DIR/imap-config.key)
- `TOTP_SECRET_KEY_FILE` ($SECRET_DIR/totp-secret.key)
- `SERVER_BASE_URL` (optional, recommended for pairing; the server embeds this public URL as `srv` in the QR code and uses it to build `reg`)
- `PAIRING_SECRET` (optional; HMAC secret for pickup links, PGP QR, pairing tokens; generated on first start at `PAIRING_SECRET_FILE`; set it only if replicas must share one; use `openssl rand -base64 32`; value must be 32 bytes or longer)
- `PAIRING_SECRET_FILE` ($SECRET_DIR/pairing.key)
- `PUSH_RELAY_URL` (optional; base URL of the FCM relay Worker; must be `https://` except for loopback)
- `PUSH_RELAY_KEY` (per-server API key; set with `PUSH_RELAY_URL` to enable Android push)
- `APNS_RELAY_URL` (optional; base URL of the APNs relay Worker; must be `https://` except for loopback)
- `APNS_RELAY_KEY` (per-server API key; set with `APNS_RELAY_URL` to enable iOS push)
- `CAPTCHA_PROVIDER` (optional; `pow`, `turnstile`, `friendly`, or `none`; works with 3-strikes/15-minute lockout)
- `CAPTCHA_SITE_KEY` and `CAPTCHA_SECRET_KEY` (required with `turnstile` or `friendly`, not with `pow`)
- `POW_MAX_NUMBER`, `POW_SECRET_FILE`, `POW_SECRET` (optional, `CAPTCHA_PROVIDER=pow` only; see `.env.example`)
- `KYPOST_BIND` (required by Compose; `.env.example` starts at `127.0.0.1`)
- `TRUSTED_PROXY_CIDRS` (optional; narrowly identifies proxies whose forwarded headers may be trusted)
- `TLS_CERT_FILE` and `TLS_KEY_FILE` (optional; required together for direct TLS termination)
- `ALLOW_INSECURE_HTTP` and `ALLOW_INSECURE_SMTP` (optional, default off; explicit security downgrade acknowledgements)
- `BOOTSTRAP_ADMIN_USER` and `BOOTSTRAP_ADMIN_PASS` (optional, first run only)

The image also sets `OLLAMA_MODELS=/kypost/ollama-models`. The classifier default appears in four places: Dockerfile, docker-compose.yml, .env.example, and backend fallback. All use `nemotron-3-nano:4b`.

## TLS options

There are three ways to get TLS. They are not equivalent.

1. **Terminate TLS in KyPost.** Set `TLS_CERT_FILE` and `TLS_KEY_FILE` to mounted paths (see `.env.example` and the commented volume in `docker-compose.yml`). The server answers "did this arrive over TLS" from the connection. `TRUSTED_PROXY_CIDRS` does not apply. Renewals apply without a restart. You must set both files or you get a startup error.

2. **Cloudflare Tunnel.** `cloudflared` gives the browser a real HTTPS origin. No TLS config of your own.

3. **Reverse proxy you run** (nginx, Caddy).

Options 2 and 3 need `TRUSTED_PROXY_CIDRS` set to the proxy address, for example `127.0.0.1/32` or a pinned address on `kypost-net` (for example `10.89.0.10/32`). Name the proxy address narrowly, not a wide range, or a peer in the range can forge `X-Forwarded-For`. Behind Cloudflare, the server reads `CF-Connecting-IP` before `X-Forwarded-For`.

For network layout and DNS details see
[`docs/Reverse_Proxy_Networking.md`](https://github.com/Busness-app/KyPost-Server/blob/main/docs/Reverse_Proxy_Networking.md).

## Choosing a classifier model

Measured on a 60-email benchmark, five repeats, zero run-to-run variance:

| Model | Unambiguous mail | Keyword traps | Prompt injection | RAM resident |
|---|---|---|---|---|
| `nemotron-3-nano:4b` (default) | 100% | 75% | 63% | 2.9 GB |
| `gemma4:e4b` | 100% | 75% | 88% | 8.8 GB |

Speed is not tabulated. It depends on CPU and host load. The same request varied from 13 to 19 seconds on one machine as background load changed. The two models were within 20% under identical conditions. The poller paces at one message every three seconds.

Use `gemma4:e4b` if the host has 12 GB or more free.

## Per-user tuning

- Each user connects his own IMAP mailbox.
- Each account has its own label list, copied from instance defaults at creation.
- Each user has his own tuning prompt and his own decisions page.
- Label rules are instance-wide (Server tab). Email Labels are per-user.
