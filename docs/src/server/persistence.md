# Server — Persistence & Backup

## Named volumes

There are four volumes:

- `kypost_config` -> /kypost/config
- `kypost_private` -> /kypost/private
- `kypost_logs` -> /kypost/logs
- `kypost_state` -> /kypost/state

Host bind mount:

- `${OLLAMA_MODELS_HOST_DIR:-./share/ollama/models}` -> /kypost/ollama-models

Ollama models are a cache. You can re-download them.

Compose keeps volumes on `up --build`. `down -v` removes them. Check real Docker volume names with `docker volume ls | grep kypost`. The Compose project prefix applies, for example `kypost-server_kypost_config`.

## Important files

- /kypost/config/config.yaml (global system config)
- /kypost/config/users.json (user accounts and roles)
- `/kypost/config/users/<userID>/` (per-user IMAP credentials, tuning prompt, notification prefs)
- /kypost/config/TUNING.md (default tuning for new users)
- /kypost/config/notifications-vapid-private.pem (shared web-push signing key)
- /kypost/private/imap-config.key (master key for stored IMAP credentials)
- /kypost/private/totp-secret.key (master key for stored TOTP secrets)
- /kypost/state/state.db (global state: AI-credits flag)
- `/kypost/state/users/<userID>/state.db` (per-user mailbox checkpoint, processed set, decision history, push subscriptions, paired devices). SQLite runs in WAL mode, so `state.db-wal` and `state.db-shm` sit beside it.

Per-user layout:

- `/kypost/config/users/<userID>/`: encrypted IMAP credentials, `tuning.md`, `config.yaml`
- `/kypost/state/users/<userID>/`: `state.db`

## Backup

  Back up with the container stopped. A live copy of `state.db` misses data still in the WAL. The four volumes depend on each other. Archive them at different moments and the set never existed together.

Steps:

```bash
docker image inspect --format '{{index .RepoDigests 0}}' \
  "$(docker compose images -q kypost-server)" > backup-version.txt
cat backup-version.txt

docker compose down

docker run --rm \
  -v kypost-server_kypost_config:/v/config:ro \
  -v kypost-server_kypost_private:/v/private:ro \
  -v kypost-server_kypost_logs:/v/logs:ro \
  -v kypost-server_kypost_state:/v/state:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/kypost-backup.tar.gz -C /v .

docker compose up -d
```

Confirm archive:

```bash
tar tzf kypost-backup.tar.gz | grep -E 'private/|state/users/' | head
```

Store the archive and `backup-version.txt` together, encrypted or in a safe place. The archive holds keys that unwrap IMAP and TOTP secrets. It does not hold data to decrypt a user PGP private key. That half never leaves the browser.

## Restore

Restore into empty volumes, running the same version the backup came from.

```bash
docker compose down -v

docker compose create

docker run --rm \
  -v kypost-server_kypost_config:/v/config \
  -v kypost-server_kypost_private:/v/private \
  -v kypost-server_kypost_logs:/v/logs \
  -v kypost-server_kypost_state:/v/state \
  -v "$PWD":/backup \
  alpine tar xzf /backup/kypost-backup.tar.gz -C /v

printf 'services:\n  kypost-server:\n    image: %s\n' "$(cat backup-version.txt)" \
  > docker-compose.restore.yml
docker compose -f docker-compose.yml -f docker-compose.restore.yml up -d
```

Do not create volumes by hand with `docker volume create`. That makes Compose treat them as foreign and triggers first-run bootstrap. For a locally built image with no published digest, use `git pull --ff-only && docker compose up --build -d` from the commit it came from.

## Verify the restore

1. Sign in as an existing user.
2. Open an encrypted message.
3. Confirm a paired device still appears and TOTP still validates.
4. Watch one poll tick and confirm the checkpoint advances.

Do these checks before you upgrade to a newer version. A reset checkpoint re-labels and re-notifies everything.
