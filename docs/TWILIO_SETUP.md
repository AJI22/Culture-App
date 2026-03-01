# Twilio setup (WhatsApp + SMS + webhooks)

Twilio is used for WhatsApp and SMS delivery and for receiving inbound messages and status callbacks.

## 1. Create a Twilio account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio) and sign up.
2. Verify your phone number and complete account setup.
3. Note your **Account SID** and **Auth Token** from the Twilio Console dashboard (home page). These are required for API calls.

## 2. WhatsApp setup

WhatsApp messaging is done via Twilio’s WhatsApp sandbox or a WhatsApp Business API (approved) number.

### Option A: WhatsApp Sandbox (testing)

1. In Twilio Console go to **Messaging → Try it out → Send a WhatsApp message** (or **Messaging → WhatsApp → Sandbox**).
2. Join the sandbox by sending the required message (e.g. "join &lt;code&gt;") to the sandbox number from your phone.
3. Note the **Sandbox WhatsApp number** (e.g. `whatsapp:+14155238886`). You will send outbound messages from this number in development.
4. In the sandbox you may see a **Messaging Service SID** or use the number directly; for API, use the number in E.164 as `from` (e.g. `whatsapp:+14155238886`).

### Option B: WhatsApp Business API (production)

1. Go to **Messaging → WhatsApp → Senders** (or equivalent in your console; exact name may vary — verify in console UI).
2. Request a WhatsApp Business API sender; approval and template approval are required.
3. Create and submit **message templates** for any outbound messages that initiate a conversation (e.g. invite, broadcast). Twilio/WhatsApp must approve templates before you can send.
4. Note the approved **WhatsApp sender number** (E.164). Use it as `from` in API calls (e.g. `whatsapp:+1234567890`).

### Environment variables for WhatsApp

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_WHATSAPP_FROM` | WhatsApp number in E.164 with `whatsapp:` prefix for API | `whatsapp:+14155238886` (sandbox) or `whatsapp:+1234567890` (production) |

Use the same number for both sending and receiving; webhooks are configured per number or per Messaging Service.

## 3. SMS setup

1. In Twilio Console go to **Phone Numbers → Manage → Buy a number** (or use a trial number).
2. Get a number with **SMS** capability.
3. Note the number in E.164 (e.g. `+1234567890`).

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_SMS_FROM` | SMS sender number (E.164) | `+1234567890` |

## 4. Webhook URLs (required)

Your app exposes two endpoints that Twilio must call:

| Purpose | Method | URL (example) | Env / config name (verify in console UI) |
|---------|--------|----------------|------------------------------------------|
| Inbound WhatsApp (and optionally SMS) messages | POST | `https://your-domain.com/api/webhooks/twilio/whatsapp/inbound` | "Webhook URL" or "Inbound webhook" for WhatsApp / Messaging |
| Status callback (delivery status) | POST | `https://your-domain.com/api/webhooks/twilio/status` | "Status callback URL" when sending messages; or global status callback |

### Where to set webhooks in Twilio

- **WhatsApp Sandbox**: **Messaging → WhatsApp → Sandbox** → look for **"When a message comes in"** (or similar) → set to your inbound URL. (Exact label may be "Webhook URL" — verify in console UI.)
- **WhatsApp Sender (production)**: In the WhatsApp sender / number configuration, set the inbound webhook to the same inbound URL.
- **SMS**: If you receive SMS on the same or another number, set the number’s "A message comes in" webhook to your inbound URL, or use a Messaging Service and set the inbound webhook there.
- **Status callback**: When sending messages via the API, you pass `statusCallback: 'https://your-domain.com/api/webhooks/twilio/status'` so Twilio can report delivery status. Optionally, some products allow a default status callback URL in the console — verify in console UI.

Use your real deployment URL (e.g. Vercel) for production; for local testing use a tunnel (ngrok, etc.) and set that URL in the sandbox/number config.

## 5. Environment variables summary

| Variable | Description | Required |
|----------|-------------|----------|
| `TWILIO_ACCOUNT_SID` | Account SID from Twilio Console | Yes |
| `TWILIO_AUTH_TOKEN` | Auth Token from Twilio Console | Yes |
| `TWILIO_WHATSAPP_FROM` | WhatsApp sender (e.g. `whatsapp:+14155238886`) | Yes for WhatsApp |
| `TWILIO_SMS_FROM` | SMS sender (E.164) | Yes for SMS fallback |

## 6. Approvals and templates (WhatsApp production)

- **Sender approval**: Required for WhatsApp Business API senders.
- **Templates**: Any message that starts a 24-hour conversation window must use an approved template. Template format and approval are in Twilio/WhatsApp documentation. Document your template names and variables in your code (e.g. `invite_template`, `broadcast_template`) and ensure they match the names in the Twilio console.

## Checklist

- [ ] Twilio account created; Account SID and Auth Token noted
- [ ] WhatsApp: Sandbox joined (dev) or Business sender approved (prod)
- [ ] SMS number purchased or trial number with SMS
- [ ] All four env vars set: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_SMS_FROM`
- [ ] Inbound webhook URL set in Twilio to `/api/webhooks/twilio/whatsapp/inbound`
- [ ] Status callback URL used when sending messages: `/api/webhooks/twilio/status`
- [ ] (Production) WhatsApp templates created and approved
