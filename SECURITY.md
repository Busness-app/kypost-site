# Security Policy — this repository

This repository is **only the website** at [kypost.org](https://www.kypost.org):
static pages, the privacy policy, and the rendered product documentation. It
holds no user data and no credentials.

Do not confuse it with the product's security policy. The page this site renders
at `docs/src/SECURITY.md` describes **KyPost the mail server** and directs
vulnerabilities there — that is correct, and unchanged.

## Which repository does your finding belong to?

| Finding | Report to |
| --- | --- |
| The site itself — XSS in a page, a supply-chain problem in the build, a leak in what the site publishes | **here** |
| The mail server, its API, PGP handling, pairing, or deployment | [KyPost-Server](https://github.com/Busness-app/KyPost-Server/security/advisories) |
| A client app | [Android](https://github.com/Busness-app/KyPost-for-Android/security/advisories), [Apple](https://github.com/Busness-app/KyPost-for-Mac/security/advisories), [Linux](https://github.com/Busness-app/KyPost-for-Linux/security/advisories) |

If you are unsure, file it here and it will be moved. A misfiled report is better
than an unfiled one.

## Reporting

Report privately through
[Security Advisories](https://github.com/Busness-app/kypost-site/security/advisories/new)
rather than opening a public issue. Private vulnerability reporting is enabled on
this repository, so that form works for anyone.

We follow the same commitments as the server repository: acknowledge receipt
within **2 business days**, then provide a timeline and severity assessment.
Public disclosure timelines are by severity — critical 30 days, high 60, moderate
90 — as set out in
[the server's SECURITY.md](https://github.com/Busness-app/KyPost-Server/blob/main/SECURITY.md).

## Contact

- **Vulnerability reports:** [GitHub Security Advisories](https://github.com/Busness-app/kypost-site/security/advisories/new)
- **Maintainer:** [Yoshiofthewire](https://github.com/Yoshiofthewire)
