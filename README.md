# AI Diff Explainer

AI Diff Explainer is a Next.js 15 App Router app that turns a GitHub pull request into a 3-bullet, plain-English changelog for non-technical stakeholders.

## What It Does

- Accepts a GitHub PR URL in the dashboard.
- Fetches PR metadata, commit messages, changed files, and linked issues using GitHub API.
- Uses OpenAI to generate a concise stakeholder summary.
- Gates analysis behind a Stripe-hosted checkout paywall.
- Unlocks paid access via checkout email and an HTTP-only cookie.

## Stack

- Next.js 15 + App Router + TypeScript
- Tailwind CSS v4
- OpenAI SDK
- Octokit GitHub API client
- React Hook Form + Zod
- File-backed JSON persistence in `data/store.json`

## Environment Variables

Copy `.env.example` to `.env.local` and set values:

- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)
- `GITHUB_TOKEN` (recommended for private repos / higher API limits)
- `NEXT_PUBLIC_SITE_URL`

## Stripe Webhook

Set your Stripe webhook endpoint to:

- `POST /api/webhooks/lemonsqueezy`

Required event types:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

The webhook stores paid customer emails in `data/store.json` so users can unlock dashboard access.

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```

## Health Check

- `GET /api/health` returns `{ "status": "ok" }`
