# K-Tix Assist — Authentication System

PHP + MySQL storage · Real SMTP email · Face ID (1:1) · Strict ID validation

## Local Laragon setup

1. Put this folder under `C:\laragon\www`.
2. Start Apache and MySQL in Laragon.
3. Open `http://localhost/`.

On its first request, the app creates the `ktix_assist` database and `users` table using Laragon's default local MySQL account (`root`, no password). Existing users in the previous JSON store are imported once. To use different settings, set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in the PHP environment.

Passwords are stored as PHP password hashes, never as plaintext. The users table also stores account IDs, email, roles, verification/reset state, identity-document details, and face-profile data required by the app. Keep this database private; use a restricted database account and HTTPS before deployment.

## Deployment notes

- Do not deploy with Laragon's default MySQL `root` account.
- Use a persistent MySQL service and set the database environment variables above.
- Use HTTPS so camera access works in the browser.
- Configure SMTP with the `SMTP_USER` and `SMTP_PASS` environment variables.

## Project structure

```text
/
├── api/
│   ├── api.php              # Main API
│   ├── index.php            # Login page
│   ├── dashboard-*.php
│   └── includes/
│       ├── config.php       # MySQL, APP_ROOT, paths, SMTP
│       └── mailer.php
├── css/  js/  lib/  data/  uploads/
└── vercel.json
```
