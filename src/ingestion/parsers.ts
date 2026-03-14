/**
 * Document parsers for various company data sources.
 * Each parser normalizes content into a standard { title, content, metadata } shape.
 */

export interface ParsedDocument {
  source: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

// ── Raw text / pitch deck / general docs ──────────────────────────
export function parseRawText(input: {
  title: string;
  content: string;
  source: string;
}): ParsedDocument {
  return {
    source: input.source,
    title: input.title,
    content: input.content,
    metadata: {},
  };
}

// ── Notion page ───────────────────────────────────────────────────
export function parseNotionPage(page: {
  title: string;
  blocks: Array<{ type: string; text: string }>;
  url?: string;
}): ParsedDocument {
  const content = page.blocks.map((b) => b.text).join("\n\n");
  return {
    source: "notion",
    title: page.title,
    content,
    metadata: { url: page.url, blockCount: page.blocks.length },
  };
}

// ── GitHub repo summary ───────────────────────────────────────────
export function parseGitHubRepo(repo: {
  name: string;
  description: string | null;
  languages: Record<string, number>;
  readme: string;
  stars: number;
  openIssues: number;
  recentCommits: string[];
}): ParsedDocument {
  const langSummary = Object.entries(repo.languages)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, bytes]) => `${lang}: ${bytes} bytes`)
    .join(", ");

  const content = [
    `Repository: ${repo.name}`,
    `Description: ${repo.description ?? "N/A"}`,
    `Languages: ${langSummary}`,
    `Stars: ${repo.stars} | Open Issues: ${repo.openIssues}`,
    `\nREADME:\n${repo.readme}`,
    `\nRecent commits:\n${repo.recentCommits.join("\n")}`,
  ].join("\n");

  return {
    source: "github",
    title: `GitHub: ${repo.name}`,
    content,
    metadata: { stars: repo.stars, languages: repo.languages },
  };
}

// ── Slack channel summary ─────────────────────────────────────────
export function parseSlackChannel(channel: {
  name: string;
  messages: Array<{ user: string; text: string; ts: string }>;
}): ParsedDocument {
  const content = channel.messages
    .map((m) => `[${m.user}]: ${m.text}`)
    .join("\n");

  return {
    source: "slack",
    title: `Slack: #${channel.name}`,
    content,
    metadata: { messageCount: channel.messages.length },
  };
}

// ── Website scrape ────────────────────────────────────────────────
export function parseWebsite(site: {
  url: string;
  title: string;
  bodyText: string;
}): ParsedDocument {
  return {
    source: "website",
    title: site.title,
    content: site.bodyText,
    metadata: { url: site.url },
  };
}

// ── Chunk large documents for embedding ───────────────────────────
export function chunkText(text: string, maxChunkSize = 2000, overlap = 200): string[] {
  if (!text || text.length <= maxChunkSize) return [text || ""];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    chunks.push(text.slice(start, end));
    const next = end - overlap;
    start = next <= start ? end : next; // always advance
    if (start >= text.length) break;
  }
  return chunks;
}
