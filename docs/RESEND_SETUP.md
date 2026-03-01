# Resend setup (email)

Resend is used for email delivery (e.g. invite or broadcast fallback when WhatsApp/SMS are not preferred or available).

## 1. Create a Resend account

1. Go to [https://resend.com](https://resend.com) and sign up.
2. Verify your email and complete account setup.

## 2. Add and verify a domain (production)

1. In Resend dashboard go to **Domains** (or **Domains & Records** — verify in console UI).
2. Click **Add Domain** and enter your sending domain (e.g. `events.yourdomain.com` or your root domain).
3. Add the DNS records Resend shows (SPF, DKIM, etc.) at your DNS provider.
4. Wait for verification status to show as verified.

For development you can often use Resend’s default sending domain (e.g. `onboarding@resend.dev` or the domain shown in the dashboard — verify in console UI); sending may be limited to a single recipient until your domain is verified.

## 3. Create an API key

1. In Resend go to **API Keys** (or **Integrations → API Keys** — verify in console UI).
2. Click **Create API Key**.
3. Give it a name (e.g. "Culture App") and copy the key. You won’t see it again.

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | API key from Resend | `re_...` |

## 4. From address

Emails must be sent from a verified domain or Resend’s default domain.

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_FROM_EMAIL` | Sender email address | `events@yourdomain.com` or `onboarding@resend.dev` for testing |
| `RESEND_FROM_NAME` | Optional sender display name | `Event Invites` |

## 5. Environment variables summary

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Resend API key | Yes |
| `RESEND_FROM_EMAIL` | From email (verified domain or Resend default) | Yes |
| `RESEND_FROM_NAME` | From display name | Optional |

## 6. Usage in the app

The app uses Resend to send transactional emails (e.g. invite or broadcast fallback). Ensure your templates or inline content comply with Resend’s API (e.g. `to`, `subject`, `html` or `react`). No additional Resend-specific webhooks are required for this MVP.

## Checklist

- [ ] Resend account created
- [ ] API key created and `RESEND_API_KEY` set
- [ ] `RESEND_FROM_EMAIL` set (and domain verified for production)
- [ ] Optional: `RESEND_FROM_NAME` set
