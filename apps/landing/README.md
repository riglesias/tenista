# Tenista Landing

Landing page and auth flow pages for [tenista.app](https://www.tenista.app).

## Stack

- Next.js 15 (App Router)
- Tailwind CSS v4
- Supabase Auth (password reset, email confirmation)

## Development

```bash
# From monorepo root
pnpm dev:landing

# Or directly
cd apps/landing && pnpm dev
```

## Pages

- `/` — Landing page
- `/terms` — Terms of service
- `/forgot-password` — Password reset request
- `/reset-password` — Password reset form (accessed via email link)
- `/email-confirmed` — Email confirmation callback
- `/auth/confirm` — OTP verification route
- `/api/auth/callback` — Auth code exchange route

## Deployment

Deployed to Vercel as `tenista-landing` with root directory `apps/landing`.
