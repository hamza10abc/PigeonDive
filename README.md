# PigeonDive

Write an email, send it, and watch it travel: sent, delivered, opened, clicked.
A small self-hosted email sender that delivers through [Resend](https://resend.com).

```
PigeonDive/
  docker-compose.yml   postgres + migrate + api + web
  .env.example         the whole configuration (4 values)
  PigeonDive-API/      NestJS + Prisma + Postgres
  PigeonDive-Web/      React + Vite + Tailwind, served by Caddy
```

## Run it

```bash
cp .env.example .env      # set SEED_PASSWORD (and SEED_USERNAME if you like)
docker compose up -d --build
```

Open `http://localhost:8080` and sign in with the username and password you put in `.env`.

That file has four values:

| Value | Required | Default | What it is |
|---|---|---|---|
| `SEED_USERNAME` | yes | `admin` in the example | The login created the first time PigeonDive starts |
| `SEED_PASSWORD` | yes | none | Its password. Change it later under Settings |
| `FRONTEND_PORT` | no | `8080` | Where you open the app |
| `BACKEND_PORT` | no | `3000` | Where the API is published (the app itself never needs it) |

The login is created once. Editing these two values later does not change an existing account;
use Settings, or reset the database volume.

## Set it up in the app

Everything else lives in **Settings**, with a short guided checklist on the first page until it's done:

1. **Connect Resend.** Paste an API key from the Resend dashboard.
2. **Choose your sending domain.** PigeonDive asks Resend for your domains; pick a verified one.
   People then see addresses like `hello@your-domain`.
3. **Turn on tracking (optional).** In Resend, add a webhook pointing at the address shown on the
   Settings page, tick the email events, and paste its signing secret. Without this you can still
   send; Activity just won't update.

Resend has to reach the webhook address from the internet. For a real deployment put PigeonDive behind
your own HTTPS reverse proxy. For trying it at home, a tunnel (Cloudflare Tunnel, ngrok) works.

## What tracking can tell you

| Signal | How far to trust it |
|---|---|
| Sent, delivered, bounced, spam report, failed | Reliable. Reported by Resend's servers |
| Clicked | Mostly. Mail scanners click links within seconds of delivery; those are marked "probably a mail scanner" and not counted |
| Opened | A hint only. Apple Mail loads images in advance and Gmail proxies them |
| Plain-text emails | Delivery events only |
| Replies, unsubscribes | Not tracked |

Resend's rules forbid cold or unsolicited email. Use PigeonDive for notifications and mail people have asked for.

## Security notes (read before exposing it)

This is built for simple, trusted use, not hardened:

- **No CORS.** It is not configured anywhere. The web container forwards `/api` to the API, so the
  browser only talks to one origin. The API port is also published directly and accepts any caller
  that has a valid login token; there is no origin restriction.
- **No HTTPS or rate limiting built in.** Plain HTTP on the frontend port. Add TLS with a reverse proxy.
- **Secrets live in the database.** Your Resend key and webhook secret are stored unencrypted in
  Postgres (the key is never sent back to the browser, only a hint like `re_…a1b2`).
- **One account.** There is a single login. Anyone who has it can send mail from your domain.
- The Postgres container is not published to the host.

## Developing

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres   # DB on localhost:5434
cd PigeonDive-API && cp .env.example .env && pnpm install
pnpm prisma:migrate && pnpm prisma:seed && pnpm dev       # API on :3000
pnpm test
cd ../PigeonDive-Web && pnpm install
API_PROXY=http://localhost:3000 pnpm dev                  # app on :5174, /api proxied
```

## Not built yet

Template variables (`{{name}}`), scheduled and bulk sending, a drag-and-drop template builder.
