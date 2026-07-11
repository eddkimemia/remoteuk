# RemoteMedicalJobs — Global Remote Healthcare Jobs & Career Accelerator

Worldwide job board + optional paid Career Accelerator. After payment, **course access is emailed** and unlocked in a private portal.

## Stack

- Node.js + Express
- SQLite (`database.sqlite`)
- Paystack payments
- Nodemailer (SMTP) for course + contact emails
- Vanilla HTML/CSS/JS frontend

## Quick start

```bash
npm install
cp .env.example .env
# Edit .env — for local mock payments leave PAYSTACK_SECRET_KEY empty
npm start
```

Open http://localhost:3000

## Environment

See `.env.example`:

| Variable | Purpose |
|----------|---------|
| `PAYSTACK_SECRET_KEY` | Live/test Paystack secret (empty = mock checkout in development) |
| `PAYSTACK_CURRENCY` | Default `USD` |
| `PUBLIC_BASE_URL` | Public URL for callbacks + course links (set in production) |
| `SMTP_*` | SMTP for real email delivery |
| `CONTACT_NOTIFY_EMAIL` | Inbox for contact form notifications |
| `NODE_ENV` | `production` refuses mock payments without Paystack key |

Without SMTP, emails are written to `emails-outbox/` (gitignored) so you can still test delivery.

## Products (server-side prices)

| ID | Price | Delivery |
|----|-------|----------|
| `standard` | **$27** | 8 modules + templates, email + portal |
| `pro` | **$47** | Standard + interview bank + LinkedIn kit |

Client-sent `amount` is **ignored**.

## Main flows

1. **Free apply** → `POST /api/applications` → optional course upsell → Paystack → email + `course-access.html?token=…`
2. **Direct course** → `course.html` / `landing.html` → Paystack → same fulfilment
3. **Contact** → `POST /api/contact` → stored + auto-reply email

## API (high level)

- `GET /api/health`
- `GET /api/products`
- `POST /api/payment/initialize` — body includes `product_id`, profile fields
- `GET /api/payment/verify` — Paystack return URL
- `POST /api/payment/webhook` — signed in live mode
- `GET /api/course/access?token=`
- `POST /api/course/resend`
- `POST /api/applications`
- `POST /api/contact`

## Tests

```bash
npm test
```

Uses an ephemeral port and mock Paystack mode.

## Production checklist

1. Set `NODE_ENV=production`, `PAYSTACK_SECRET_KEY`, `PUBLIC_BASE_URL` (https)
2. Configure SMTP so buyers receive course links
3. Set Paystack webhook to `https://your-domain/api/payment/webhook`
4. Restrict `CORS_ORIGINS` if needed
5. Back up `database.sqlite` regularly

## License

ISC · © RemoteMedicalJobs
