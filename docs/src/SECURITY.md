# Security Policy

## Supported versions

Security fixes are made against the latest KyPost release. Upgrade to the
current release before reporting a problem that may already have been fixed.

## Reporting a vulnerability

Report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/Busness-app/KyPost-Server/security/advisories).
Do not open a public issue containing vulnerability details.

Include the affected version, impact, reproduction steps, and any suggested
mitigation. Reports are acknowledged within two business days. Disclosure and
credit are coordinated with the reporter after a tested fix is available.

## Security model and deployment

Read the [Security Model](./security.md) before deploying KyPost. It documents
the trust boundaries for PGP key custody, native push, device pairing, local
AI classification, client storage, TLS termination, and trusted proxy headers.

The server repository contains the authoritative operational guidance:

- [Server security policy](https://github.com/Busness-app/KyPost-Server/blob/main/SECURITY.md)
- [Reverse proxy networking](https://github.com/Busness-app/KyPost-Server/blob/main/docs/Reverse_Proxy_Networking.md)
- [Environment configuration](https://github.com/Busness-app/KyPost-Server/blob/main/.env.example)

## Contact

- **Vulnerability reports:** [GitHub Security Advisories](https://github.com/Busness-app/KyPost-Server/security/advisories)
- **Maintainer:** [Yoshiofthewire](https://github.com/Yoshiofthewire)
