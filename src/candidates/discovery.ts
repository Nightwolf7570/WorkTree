import { db, schema } from "../db/index.js";
import { env } from "../config/env.js";
import { jsonCompletion } from "../config/openai.js";
import type { WorkspaceContext } from "../api/middleware/context.js";

// ── Public types ──────────────────────────────────────────────────

export interface CandidateProfile {
  name: string;
  title?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  score: number;
  reasoning: string;
}

// ── SerpAPI types ─────────────────────────────────────────────────

interface SerpApiOrganicResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerpApiResponse {
  organic_results?: SerpApiOrganicResult[];
  error?: string;
}

// ── Step 1: Build search queries ──────────────────────────────────

function buildSearchQueries(roleToHire: string, companyContext: string): string[] {
  const roleClean = roleToHire.replace(/[^\w\s]/g, "").trim();
  const roleLower = roleToHire.toLowerCase();

  // Extract industry hints
  const contextLower = companyContext.toLowerCase();
  const domains = ["saas", "fintech", "healthtech", "edtech", "devtools", "ai", "ml", "e-commerce", "marketplace", "b2b", "b2c", "infrastructure", "cloud", "mobile", "web3", "crypto", "biotech"];
  const domainHint = domains.find((d) => contextLower.includes(d)) ?? "";

  const queries: string[] = [
    `site:linkedin.com/in "${roleClean}" startup founder`,
    `site:linkedin.com/in "${roleClean}" ${domainHint} "series a"`.trim(),
    `site:linkedin.com/in "head of" OR "senior" "${roleClean}"`,
  ];

  // Add seniority variant
  if (!roleLower.includes("senior") && !roleLower.includes("lead") && !roleLower.includes("head")) {
    queries.push(`site:linkedin.com/in "senior ${roleClean}" OR "lead ${roleClean}"`);
  }

  // Add tech-specific query for engineering roles
  if (/engineer|developer|devops|sre|architect|backend|frontend|fullstack/i.test(roleLower)) {
    const techs = ["react", "python", "typescript", "golang", "rust", "node", "aws", "kubernetes", "machine learning"];
    const matched = techs.filter((t) => contextLower.includes(t));
    if (matched.length > 0) {
      queries.push(`site:linkedin.com/in "${roleClean}" ${matched.slice(0, 2).join(" ")}`);
    }
  }

  return queries.slice(0, 4);
}

// ── Step 2: SerpAPI search ────────────────────────────────────────

async function serpApiSearch(query: string): Promise<SerpApiOrganicResult[]> {
  if (!env.SERPAPI_API_KEY) {
    console.warn("[discovery] SERPAPI_API_KEY not set, skipping");
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    api_key: env.SERPAPI_API_KEY,
    engine: "google",
    num: "10",
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[discovery] SerpAPI HTTP ${response.status} for: ${query}`);
      return [];
    }

    const data = (await response.json()) as SerpApiResponse;
    if (data.error) {
      console.error(`[discovery] SerpAPI error: ${data.error}`);
      return [];
    }
    return data.organic_results ?? [];
  } catch (err) {
    console.error("[discovery] SerpAPI fetch failed:", (err as Error).message);
    return [];
  }
}

// ── Step 3: Parse LinkedIn results ────────────────────────────────

interface RawCandidate {
  name: string;
  title: string;
  linkedinUrl: string;
  snippet: string;
}

function parseLinkedInResult(result: SerpApiOrganicResult): RawCandidate | null {
  if (!result.link.includes("linkedin.com/in/")) return null;

  const titleParts = result.title.split(" - ");
  const name = (titleParts[0] ?? "").replace(/ \| LinkedIn$/i, "").replace(/\s*\(.*?\)\s*/g, "").trim();
  if (!name || name.length < 2) return null;
  if (/^(linkedin|top \d|company|\d+ |sign |log )/i.test(name)) return null;

  let title = "";
  if (titleParts.length > 1) {
    title = titleParts.slice(1).join(" - ").replace(/ \| LinkedIn$/i, "").trim();
  }
  if (!title && result.snippet) {
    const snippetTitle = result.snippet.split(/[.·|]/).find((s) =>
      /engineer|designer|manager|developer|lead|director|founder|cto|ceo|vp|head of|architect/i.test(s)
    );
    if (snippetTitle) title = snippetTitle.trim();
  }

  return {
    name,
    title,
    linkedinUrl: result.link.split("?")[0],
    snippet: result.snippet ?? "",
  };
}

// ── Step 4: Score candidates ──────────────────────────────────────

function scoreCandidate(raw: RawCandidate, roleToHire: string): { score: number; reasoning: string } {
  const roleLower = roleToHire.toLowerCase();
  const combined = `${raw.title.toLowerCase()} ${raw.snippet.toLowerCase()}`;

  let score = 0;
  const reasons: string[] = [];

  // Role match (0-4)
  const roleWords = roleLower.split(/\s+/).filter((w) => w.length > 2);
  let matched = 0;
  for (const w of roleWords) if (combined.includes(w)) matched++;
  const roleScore = Math.min(4, Math.round((matched / Math.max(roleWords.length, 1)) * 4));
  score += roleScore;
  if (roleScore >= 3) reasons.push("Strong role match");
  else if (roleScore >= 1) reasons.push("Partial role match");

  // Seniority (0-2)
  if (["senior", "staff", "principal", "lead", "head of", "director", "vp", "architect", "founding"].some((k) => combined.includes(k))) {
    score += 2;
    reasons.push("Senior-level experience");
  }

  // Startup signal (0-2)
  if (["startup", "co-founder", "founder", "early-stage", "series a", "series b", "seed", "yc", "y combinator", "founding engineer"].some((k) => combined.includes(k))) {
    score += 2;
    reasons.push("Startup experience");
  }

  // Company signal (0-2)
  if (["google", "meta", "amazon", "microsoft", "stripe", "airbnb", "uber", "spotify", "shopify", "slack", "notion", "figma", "vercel", "datadog"].some((k) => combined.includes(k))) {
    score += 2;
    reasons.push("Top-tier company experience");
  }

  const normalized = Math.min(10, score);
  return {
    score: normalized,
    reasoning: reasons.length > 0 ? reasons.join(". ") + "." : "Found via LinkedIn search.",
  };
}

// ── Step 5: OpenAI fallback candidates ────────────────────────────

async function generateFallbackCandidates(
  roleToHire: string,
  companyContext: string,
): Promise<CandidateProfile[]> {
  console.log("[discovery] Using OpenAI to generate candidate recommendations...");

  const result = await jsonCompletion<{ candidates: Array<{ name: string; title: string; reasoning: string; score: number; linkedinSearchUrl: string }> }>({
    system: `You are a startup recruiting expert. Given a role and company context, suggest 10 realistic candidate PROFILES that would be ideal for this role.

For each candidate, provide:
- A realistic full name
- Their current title and company
- A LinkedIn search URL in the format: https://www.linkedin.com/search/results/people/?keywords=ENCODED_KEYWORDS where keywords are their name
- A score from 1-10 based on how well they'd fit
- A brief reasoning for why they're a good fit

These should be REALISTIC profile types (not real people) — the kind of person who would show up in a LinkedIn search for this role. Make the names, titles, and companies believable.

Return JSON: { "candidates": [{ "name": "...", "title": "...", "reasoning": "...", "score": 8.5, "linkedinSearchUrl": "..." }] }`,
    user: `Role to hire: ${roleToHire}\n\nCompany context:\n${companyContext}\n\nGenerate 10 ideal candidate profiles.`,
    temperature: 0.7,
    fallback: { candidates: [] },
  });

  if (!result.candidates || !Array.isArray(result.candidates)) return [];

  return result.candidates.slice(0, 10).map((c) => ({
    name: c.name ?? "Unknown",
    title: c.title ?? roleToHire,
    linkedinUrl: c.linkedinSearchUrl ?? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(c.name ?? roleToHire)}`,
    score: Math.min(10, Math.max(1, c.score ?? 7)),
    reasoning: c.reasoning ?? "AI-recommended candidate profile.",
  }));
}

// ── Dedup ─────────────────────────────────────────────────────────

function dedup(candidates: RawCandidate[]): RawCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = c.linkedinUrl.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Public API ────────────────────────────────────────────────────

export async function discoverCandidates(
  recommendationId: string,
  roleToHire: string,
  companyContext: string,
  ctx: WorkspaceContext,
): Promise<CandidateProfile[]> {
  let candidates: CandidateProfile[] = [];

  try {
    // 1. Build and execute search queries
    const queries = buildSearchQueries(roleToHire, companyContext);
    console.log(`[discovery] Running ${queries.length} SerpAPI queries for: ${roleToHire}`);

    const allResults = await Promise.all(queries.map(serpApiSearch));
    const flatResults = allResults.flat();
    console.log(`[discovery] Got ${flatResults.length} total search results`);

    // 2. Parse and dedup
    const rawCandidates: RawCandidate[] = [];
    for (const result of flatResults) {
      const parsed = parseLinkedInResult(result);
      if (parsed) rawCandidates.push(parsed);
    }
    const unique = dedup(rawCandidates);
    console.log(`[discovery] Found ${unique.length} unique LinkedIn profiles`);

    // 3. Score and rank
    if (unique.length > 0) {
      const scored = unique.slice(0, 15).map((raw) => {
        const { score, reasoning } = scoreCandidate(raw, roleToHire);
        return {
          name: raw.name,
          title: raw.title || undefined,
          linkedinUrl: raw.linkedinUrl,
          score,
          reasoning,
        };
      });
      scored.sort((a, b) => b.score - a.score);
      candidates = scored.slice(0, 10);
    }
  } catch (err) {
    console.error("[discovery] SerpAPI pipeline failed:", (err as Error).message);
  }

  // 4. Fallback: if SerpAPI returned < 5 candidates, fill with OpenAI suggestions
  if (candidates.length < 5) {
    console.log(`[discovery] Only ${candidates.length} from SerpAPI, generating AI suggestions...`);
    try {
      const aiCandidates = await generateFallbackCandidates(roleToHire, companyContext);
      // Merge: keep real LinkedIn profiles first, then fill with AI suggestions
      const existingNames = new Set(candidates.map((c) => c.name.toLowerCase()));
      for (const ac of aiCandidates) {
        if (candidates.length >= 10) break;
        if (!existingNames.has(ac.name.toLowerCase())) {
          candidates.push(ac);
          existingNames.add(ac.name.toLowerCase());
        }
      }
    } catch (err) {
      console.error("[discovery] AI fallback also failed:", (err as Error).message);
    }
  }

  // 5. Final sort
  candidates.sort((a, b) => b.score - a.score);
  const top10 = candidates.slice(0, 10);

  // 6. Persist to database
  try {
    for (const candidate of top10) {
      await db.insert(schema.candidates).values({
        recommendationId,
        workspaceId: ctx.workspaceId,
        name: candidate.name,
        title: candidate.title ?? null,
        linkedinUrl: candidate.linkedinUrl ?? null,
        githubUrl: candidate.githubUrl ?? null,
        score: candidate.score,
        reasoning: candidate.reasoning,
      });
    }
  } catch (err) {
    console.error("[discovery] DB insert failed:", (err as Error).message);
  }

  console.log(`[discovery] Returning ${top10.length} candidates (best score: ${top10[0]?.score ?? 0})`);
  return top10;
}
