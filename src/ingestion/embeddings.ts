// Re-export from the single shared OpenAI client.
// All embedding logic lives in config/openai.ts — this file exists
// so existing imports from the ingestion layer keep working.
export {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
} from "../config/openai.js";
