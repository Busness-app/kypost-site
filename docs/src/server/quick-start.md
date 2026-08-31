# Server — Quick Start

## Requirements

- Docker and Docker Compose.
- Optional for local dev outside Docker: Go 1.26+, Node 20+, npm.

## Steps

1. Clone the repository.

2. Copy the environment file and set `KYPOST_BIND`:

   ```bash
   cp .env.example .env
   ```
   Edit `.env` to match your configuration. These choices have significant security implications, so make changes deliberately.
   The supplied values are sensible starting points, but you must adapt them to your deployment. Read `.env.example` for the complete list and its security notes.

   `TZ=America/New_York` sets your local time zone, update as needed.
   `SERVER_BASE_URL=` sets the address your server is located at.
   `KYPOST_BIND=127.0.0.1` publishes the server only on loopback. Use it when an HTTPS proxy such as cloudflared or nginx reaches KyPost on the same host. A proxy running as a container on `kypost-net` can instead connect directly to `http://KyPost-Server:5866` without publishing the port.
   `CAPTCHA_PROVIDER=pow` enables the self-hosted proof-of-work CAPTCHA. Set it to `none` to disable CAPTCHA. **The default requires TLS except on localhost.**

3. Create the model cache directory, then build and start the container:

   ```bash
   mkdir -p share/ollama/models
   docker compose up --build -d
   ```

4. Open the web UI at `http://localhost:5866`.

   **Warning, the server serves plain HTTP by default.** The session cookie gets the `Secure` flag only when the request came over TLS. `http://` on `localhost` for one machine is acceptable. For network access, put TLS in front.

5. Sign in as `admin`. On first start the server writes a generated password to `first-run-password.txt` in the config volume, mode `600`. Read it, then delete the file:

   ```bash
   docker compose exec kypost-server cat /kypost/config/first-run-password.txt
   docker compose exec kypost-server rm /kypost/config/first-run-password.txt
   ```

   To set your own password, pass `BOOTSTRAP_ADMIN_PASS` on first run. You can also pass `BOOTSTRAP_ADMIN_USER`. The password does not appear in container logs.

6. Change the password when the UI asks you to. Until you do, the account can reach only the password-change screen.

7. In Config, save IMAP and SMTP settings. Then run IMAP Test.

8. In Tuning, change labels and prompt. Then save.

## After setup

- Verify the client IP handling. Sign in and fetch `GET /api/status`. The README says `clientIp` must be your own public address and `proxyHeadersTrusted` must be `true` (or `false` for direct TLS in KyPost). If `clientIp` is a loopback or bridge address, every user shares one lockout key.
