import { db, schema } from "../db/index.js";
import { generateEmbedding } from "./embeddings.js";
import { chunkText, type ParsedDocument } from "./parsers.js";
import type { WorkspaceContext } from "../api/middleware/context.js";

/**
 * Ingest a parsed document: store it in the DB with its embedding.
 * Large documents are chunked; each chunk becomes a separate row.
 */
export async function ingestDocument(
  companyId: string,
  doc: ParsedDocument,
  ctx: WorkspaceContext,
): Promise<string[]> {
  const chunks = chunkText(doc.content);
  const ids: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);

    const title = chunks.length > 1 ? `${doc.title} (part ${i + 1})` : doc.title;

    const [row] = await db
      .insert(schema.documents)
      .values({
        companyId,
        workspaceId: ctx.workspaceId,
        source: doc.source,
        title,
        content: chunk,
        metadata: { ...doc.metadata, chunkIndex: i, totalChunks: chunks.length },
        embeddingVector: embedding,
      })
      .returning({ id: schema.documents.id });

    ids.push(row.id);
  }

  return ids;
}

/**
 * Ingest multiple documents for a company in sequence.
 */
export async function ingestDocuments(
  companyId: string,
  docs: ParsedDocument[],
  ctx: WorkspaceContext,
): Promise<string[]> {
  const allIds: string[] = [];
  for (const doc of docs) {
    const ids = await ingestDocument(companyId, doc, ctx);
    allIds.push(...ids);
  }
  return allIds;
}
