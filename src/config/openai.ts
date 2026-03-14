import OpenAI from "openai";
import { env } from "./env.js";

// ── Single shared client ──────────────────────────────────────────
let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return _client;
}

// ── Model constants ───────────────────────────────────────────────
export const CHAT_MODEL = "gpt-4o-mini" as const;
export const EMBEDDING_MODEL = "text-embedding-3-small" as const;
export const EMBEDDING_MAX_CHARS = 32_000; // safe char limit for embedding input

// ── Structured JSON completion ────────────────────────────────────
/**
 * Send a system+user prompt to the chat model and parse the response as JSON.
 * Returns a typed result with safe fallback on parse failure.
 */
export async function jsonCompletion<T>(opts: {
  system: string;
  user: string;
  temperature?: number;
  fallback: T;
}): Promise<T> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: opts.temperature ?? 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.warn("[openai] Empty response from model, using fallback");
    return opts.fallback;
  }

  try {
    return JSON.parse(content) as T;
  } catch (err) {
    console.error("[openai] Failed to parse JSON response:", content.slice(0, 200));
    return opts.fallback;
  }
}

// ── Embedding helpers ─────────────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, EMBEDDING_MAX_CHARS),
  });
  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getOpenAIClient();
  const truncated = texts.map((t) => t.slice(0, EMBEDDING_MAX_CHARS));
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncated,
  });
  return response.data.map((d) => d.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
