import OpenAI from "openai";
import { getOpenAIClient } from "./openai";
import type { EscalationRole } from "./db-types";

export const INTENTS = [
  "RSVP",
  "VENUE",
  "TIME",
  "DRESS_CODE",
  "PARKING",
  "PLUS_ONE",
  "SCHEDULE",
  "CONTACT",
  "EMERGENCY",
  "OTHER",
] as const;
export type IntentType = (typeof INTENTS)[number];

export const SUGGESTED_ACTIONS = ["ANSWER", "CLARIFY", "ESCALATE"] as const;
export type SuggestedAction = (typeof SUGGESTED_ACTIONS)[number];

export interface IntentClassification {
  intent: IntentType;
  confidence: number;
  suggested_action: SuggestedAction;
  escalation_target?: EscalationRole;
}

const intentSchema = {
  type: "object" as const,
  properties: {
    intent: { type: "string", enum: INTENTS },
    confidence: { type: "number" },
    suggested_action: { type: "string", enum: SUGGESTED_ACTIONS },
    escalation_target: { type: "string", enum: ["RSVP", "LOGISTICS", "SECURITY", "HOST"] },
  },
  required: ["intent", "confidence", "suggested_action"],
  additionalProperties: false,
};

export async function classifyIntent(
  message: string,
  eventContext: string
): Promise<IntentClassification> {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You classify the guest's message for an event support system. Event context: ${eventContext}. Respond with JSON only: intent (one of ${INTENTS.join(", ")}), confidence (0-1), suggested_action (ANSWER, CLARIFY, ESCALATE), and escalation_target only if suggested_action is ESCALATE (one of RSVP, LOGISTICS, SECURITY, HOST). EMERGENCY intent must have suggested_action ESCALATE and escalation_target SECURITY.`,
      },
      { role: "user", content: message },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("No intent response");
  const parsed = JSON.parse(raw) as IntentClassification;
  if (!INTENTS.includes(parsed.intent)) parsed.intent = "OTHER";
  if (!SUGGESTED_ACTIONS.includes(parsed.suggested_action))
    parsed.suggested_action = "ANSWER";
  return parsed;
}

export interface ResponseGeneration {
  final_reply: string;
  needs_escalation: boolean;
  escalation_summary?: string;
}

export async function generateResponse(
  message: string,
  intent: IntentClassification,
  retrievedContext: string
): Promise<ResponseGeneration> {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an event concierge. Answer ONLY using the provided context. Do not invent information. If the context does not contain an answer, set needs_escalation to true and write a short escalation_summary. Tone: respectful, slightly formal, warm. No emoji overload. Context:\n${retrievedContext}`,
      },
      {
        role: "user",
        content: `Guest said: "${message}". Intent: ${intent.intent}. Provide JSON only: { "final_reply": "...", "needs_escalation": boolean, "escalation_summary": "..." (only if needs_escalation) }`,
      },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("No response");
  return JSON.parse(raw) as ResponseGeneration;
}

export async function summarizeForEscalation(
  message: string,
  intent: IntentType,
  role: EscalationRole
): Promise<string> {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Summarize in 1-2 sentences for the ${role} delegate: what the guest asked and what action might be needed. Be concise.`,
      },
      { role: "user", content: `Intent: ${intent}. Message: "${message}"` },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || message.slice(0, 200);
}
