# Clerk setup

Clerk provides authentication for the host dashboard. Only hosts sign in; guests interact via WhatsApp and optionally a public event page.

## 1. Create a Clerk application

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com) and sign in or create an account.
2. Click **Add application** and choose a name (e.g. "Culture App").
3. Select the sign-in options you want (Email, Google, etc.). For MVP, **Email** and optionally **Google** or **Phone** are typical.
4. Leave other defaults and create the application.

## 2. Get API keys

1. In the Clerk dashboard, open your application.
2. Go to **API Keys** (in the sidebar).
3. You will see:
   - **Publishable key** (starts with `pk_`) — safe for frontend.
   - **Secret key** (starts with `sk_`) — server-only; never expose in client code.

Copy both; you will set them as environment variables.

## 3. Configure environment variables

Add to `.env.local` (local) and to Vercel → Project → Settings → Environment Variables (production):

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key from Clerk dashboard | `pk_test_...` |
| `CLERK_SECRET_KEY` | Secret key from Clerk dashboard | `sk_test_...` |

Optional (for custom sign-in/sign-up URLs):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Path for sign-in (default `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Path for sign-up (default `/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Where to redirect after sign-in (set to `/app` for dashboard) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Where to redirect after sign-up (set to `/app`) |

Recommended for this app:

- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app`

## 4. Required settings in Clerk dashboard

- **User & Authentication → Email, Phone, Username**: Enable at least one identifier (e.g. Email).
- **Paths**: Verify sign-in and sign-up paths match what you use in the app (e.g. `/sign-in`, `/sign-up`).
- **Session**: Default session lifetime is fine unless you need customisation.

## 5. Application URLs (production)

In Clerk → **Configure → Domains**:

- Add your production domain (e.g. `https://your-app.vercel.app`).
- Add `http://localhost:3000` for local development.

## 6. Using the user ID in the app

After sign-in, the host’s unique ID is available as `userId` from Clerk (e.g. `user_2abc...`). This is stored as `host_user_id` on the `events` table in Supabase. The middleware protects routes under `/app` and `/api/events` so only signed-in users can access them.

## Checklist

- [ ] Clerk application created
- [ ] Sign-in method(s) enabled (e.g. Email)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` set in env
- [ ] Optional: `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app` and same for sign-up
- [ ] Production domain added in Clerk → Domains
