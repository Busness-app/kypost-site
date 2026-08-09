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
   Edit the .env to match your configureation.  How this is configured has large security implications, so any changes need to be deliberate.
   The defaults listed are designed to be sensable, but will need to be changed for your needs.  Please check the .env.example for a full list.

   `TZ=America/New_York` sets your local time zone, update as needed.
   `SERVER_BASE_URL=` sets the address your server is located at.
   `KYPOST_BIND=127.0.0.1` Set this if you are using kypost-net to talk to a proxy for SSH like Cloudfared or NGX
   `CAPTCHA_PROVIDER=pow` Set this to NONE to turn off CAPTCHA.  **This default requres TLS**

3. Build and start the container:

   ```bash
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

- Create the model cache directory once before first run:

  ```bash
  mkdir -p share/ollama/models
  ```

- Verify the client IP handling. Sign in and fetch `GET /api/status`. The README says `clientIp` must be your own public address and `proxyHeadersTrusted` must be `true` (or `false` for direct TLS in KyPost). If `clientIp` is a loopback or bridge address, every user shares one lockout key.

