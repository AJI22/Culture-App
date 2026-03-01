import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
export const openai = apiKey ? new OpenAI({ apiKey }) : null;

export function getOpenAIClient(): OpenAI {
  if (!openai) throw new Error("OpenAI not configured: OPENAI_API_KEY missing");
  return openai;
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

export async function getEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  const vec = res.data[0]?.embedding;
  if (!vec || vec.length !== EMBEDDING_DIM)
    throw new Error("Unexpected embedding shape");
  return vec;
}

export { EMBEDDING_MODEL, EMBEDDING_DIM };
