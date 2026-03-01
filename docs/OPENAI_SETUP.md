# OpenAI setup (models, embeddings, structured outputs)

OpenAI is used for: intent classification (structured JSON), response generation (constrained to retrieved context), summarization for escalations, and optional embeddings for knowledge retrieval (pgvector).

## 1. Create an OpenAI account and API key

1. Go to [https://platform.openai.com](https://platform.openai.com) and sign up or sign in.
2. Billing must be set up (add payment method under **Billing**) for API access.
3. Go to **API keys** (or **Settings → API keys** — verify in console UI).
4. Create a new secret key. Copy it; it is shown only once.

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Secret API key from OpenAI | `sk-...` |

## 2. Environment variable

Add to `.env.local` and to Vercel:

- `OPENAI_API_KEY=sk-...` (server-only; never expose in client)

## 3. Models used in the app

- **Intent classification**: A model that supports JSON mode or structured outputs (e.g. `gpt-4o-mini` or `gpt-4o`). The app requests a structured JSON with `intent`, `confidence`, `suggested_action`, `escalation_target`.
- **Response generation**: Same or similar model; given retrieved context (event facts, FAQs, policies), generate a reply that only uses that context; output includes `final_reply`, `needs_escalation`, `escalation_summary`.
- **Summarization**: For escalation summaries (e.g. “Guest asked about plus-one; policy says 0; escalate to RSVP”). Short summary generation.
- **Embeddings** (optional, behind feature flag): `text-embedding-3-small` or `text-embedding-ada-002` for knowledge_items; stored in pgvector for similarity search.

Exact model names are in the app code (e.g. `OPENAI_MODEL_INTENT`, `OPENAI_MODEL_CHAT`, `OPENAI_MODEL_EMBEDDING`). You can override with env vars if you add them.

## 4. Structured outputs

- Intent classification: the app expects a JSON object with enum-like fields (e.g. intent: RSVP | VENUE | TIME | …). Use OpenAI’s structured output (response_format or JSON mode) so the response is valid JSON and matches the schema.
- Response generation: the app may use a small schema for `final_reply`, `needs_escalation`, `escalation_summary`. Implement with JSON mode or structured output so the bot never hallucinates beyond the provided context.

## 5. Rate limits and costs

- Check **Usage** in the OpenAI dashboard to monitor tokens and cost.
- For production, consider rate limiting per event or per guest to avoid runaway usage.
- Embeddings: if enabled, embedding calls are made when saving knowledge_items or when running retrieval; batch where possible.

## 6. Checklist

- [ ] OpenAI account created and billing set up
- [ ] API key created and `OPENAI_API_KEY` set (server env only)
- [ ] Model names in code reviewed (or overridden via env)
- [ ] Structured output / JSON mode used for intent and response schemas
