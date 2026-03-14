import { db, schema } from "../db/index.js";
import { env } from "../config/env.js";
import { searchGitHubUsers } from "./github.js";
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
}

// ── Step 1: Generate search queries ───────────────────────────────

function buildSearchQueries(roleToHire: string, companyContext: string): string[] {
  // Extract keywords from the role title
  const roleLower = roleToHire.toLowerCase();

  // Build role-specific keyword variants
  const roleKeywords = roleToHire.replace(/[^\w\s]/g, "");

  // Extract industry/domain hints from company context
  const contextLower = companyContext.toLowerCase();
  const domainHints: string[] = [];
  const domains = ["saas", "fintech", "healthtech", "edtech", "devtools", "ai", "ml", "e-commerce", "marketplace", "b2b", "b2c", "infrastructure", "cloud", "mobile", "web3", "crypto", "biotech"];
  for (const d of domains) {
    if (contextLower.includes(d)) domainHints.push(d);
  }
  const domainSuffix = domainHints.length > 0 ? ` ${domainHints[0]}` : "";

  // Build queries targeting LinkedIn profiles via Google
  const queries: string[] = [
    `site:linkedin.com/in "${roleKeywords}" startup`,
    `site:linkedin.com/in "${roleKeywords}"${domainSuffix}`,
  ];

  // Add seniority-variant query
  if (!roleLower.includes("senior") && !roleLower.includes("lead") && !roleLower.includes("staff")) {
    queries.push(`site:linkedin.com/in "senior ${roleKeywords}" startup`);
  }

  // Add a tech-specific query for engineering roles
  const techKeywords = ["kubernetes", "react", "python", "typescript", "golang", "rust", "node.js", "aws", "gcp", "distributed systems", "machine learning"];
  for (const tech of techKeywords) {
    if (contextLower.includes(tech)) {
      queries.push(`site:linkedin.com/in "${roleKeywords}" ${tech}`);
      break; // one tech query is enough
    }
  }

  return queries.slice(0, 4); // cap at 4 queries to control API usage
}

// ── Step 2: SerpAPI search ────────────────────────────────────────

async function serpApiSearch(query: string): Promise<SerpApiOrganicResult[]> {
  if (!env.SERPAPI_API_KEY) {
    console.warn("[discovery] SERPAPI_API_KEY not set, skipping search");
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    api_key: env.SERPAPI_API_KEY,
    engine: "google",
    num: "10",
  });

  const url = `https://serpapi.com/search.json?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[discovery] SerpAPI error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as SerpApiResponse;
    return data.organic_results ?? [];
  } catch (err) {
    console.error("[discovery] SerpAPI fetch failed:", err);
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
  // Only process linkedin.com/in/ URLs
  if (!result.link.includes("linkedin.com/in/")) return null;

  // Extract name from title — LinkedIn titles are typically "FirstName LastName - Title | LinkedIn"
  const titleParts = result.title.split(" - ");
  const name = (titleParts[0] ?? "").replace(/ \| LinkedIn$/i, "").trim();
  if (!name || name.length < 2) return null;

  // Extract professional title from the title or snippet
  let title = "";
  if (titleParts.length > 1) {
    title = titleParts[1].replace(/ \| LinkedIn$/i, "").trim();
  }
  // Fallback: try to extract from snippet
  if (!title && result.snippet) {
    // Snippets often contain the current role
    const snippetTitle = result.snippet.split(/[.·|]/).find((s) =>
      /engineer|designer|manager|developer|lead|director|founder|cto|ceo|vp|head of/i.test(s)
    );
    if (snippetTitle) title = snippetTitle.trim();
  }

  return {
    name,
    title,
    linkedinUrl: result.link.split("?")[0], // strip tracking params
    snippet: result.snippet ?? "",
  };
}

// ── Step 4: GitHub enrichment ─────────────────────────────────────

interface GitHubEnrichment {
  githubUrl: string;
  repos: number;
  followers: number;
}

async function tryGitHubEnrichment(name: string): Promise<GitHubEnrichment | null> {
  if (!env.GITHUB_TOKEN) return null;

  try {
    // Search GitHub for users matching the candidate name
    const users = await searchGitHubUsers(name, 1);
    if (users.length === 0) return null;

    const user = users[0];
    return {
      githubUrl: user.html_url,
      repos: user.public_repos,
      followers: user.followers,
    };
  } catch {
    // GitHub enrichment is best-effort — don't fail the pipeline
    return null;
  }
}

// ── Step 5: Scoring ───────────────────────────────────────────────

function scoreCandidate(
  raw: RawCandidate,
  github: GitHubEnrichment | null,
  roleToHire: string,
): { score: number; reasoning: string } {
  const roleLower = roleToHire.toLowerCase();
  const titleLower = raw.title.toLowerCase();
  const snippetLower = raw.snippet.toLowerCase();
  const combined = `${titleLower} ${snippetLower}`;

  let score = 0;
  const reasons: string[] = [];

  // Role relevance (0-4 points): does their title/snippet match the target role?
  const roleWords = roleLower.split(/\s+/).filter((w) => w.length > 2);
  let roleMatchCount = 0;
  for (const word of roleWords) {
    if (combined.includes(word)) roleMatchCount++;
  }
  const roleRelevance = Math.min(4, Math.round((roleMatchCount / Math.max(roleWords.length, 1)) * 4));
  score += roleRelevance;
  if (roleRelevance >= 3) reasons.push("Strong role-title match");
  else if (roleRelevance >= 1) reasons.push("Partial role-title match");

  // GitHub signal (0-2 points)
  if (github) {
    let ghScore = 0;
    if (github.repos >= 5) ghScore++;
    if (github.followers >= 10) ghScore++;
    score += ghScore;
    if (ghScore > 0) reasons.push(`GitHub presence (${github.repos} repos, ${github.followers} followers)`);
  }

  // Seniority signal (0-2 points): do they show senior-level experience?
  const seniorKeywords = ["senior", "staff", "principal", "lead", "head of", "director", "vp", "architect", "founding"];
  const hasSeniority = seniorKeywords.some((kw) => combined.includes(kw));
  if (hasSeniority) {
    score += 2;
    reasons.push("Senior-level experience indicated");
  }

  // Startup signal (0-2 points): startup experience mentioned?
  const startupKeywords = ["startup", "co-founder", "founder", "early-stage", "series a", "series b", "seed", "yc", "y combinator", "techstars", "founding engineer", "first hire"];
  const hasStartup = startupKeywords.some((kw) => combined.includes(kw));
  if (hasStartup) {
    score += 2;
    reasons.push("Startup experience detected");
  }

  // Normalize to 0-10
  const normalizedScore = Math.min(10, Math.round((score / 10) * 10 * 10) / 10);

  const reasoning = reasons.length > 0
    ? reasons.join(". ") + "."
    : "Profile found via LinkedIn search; limited signal available from public data.";

  return { score: normalizedScore, reasoning };
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

/**
 * Discover real candidates for a recommended role using SerpAPI LinkedIn search
 * and optional GitHub enrichment. Returns top 10 scored candidates.
 */
export async function discoverCandidates(
  recommendationId: string,
  roleToHire: string,
  companyContext: string,
  ctx: WorkspaceContext,
): Promise<CandidateProfile[]> {
  // 1. Build search queries
  const queries = buildSearchQueries(roleToHire, companyContext);
  console.log(`[discovery] Running ${queries.length} SerpAPI queries for: ${roleToHire}`);

  // 2. Execute searches in parallel
  const allResults = await Promise.all(queries.map(serpApiSearch));
  const flatResults = allResults.flat();

  // 3. Parse LinkedIn results
  const rawCandidates: RawCandidate[] = [];
  for (const result of flatResults) {
    const parsed = parseLinkedInResult(result);
    if (parsed) rawCandidates.push(parsed);
  }

  // 4. Dedup by LinkedIn URL
  const unique = dedup(rawCandidates);
  console.log(`[discovery] Found ${unique.length} unique LinkedIn profiles`);

  if (unique.length === 0) {
    console.warn("[discovery] No candidates found from SerpAPI. Check API key and queries.");
    return [];
  }

  // 5. GitHub enrichment (parallel, best-effort, cap at 15 to limit API calls)
  const toEnrich = unique.slice(0, 15);
  const enrichments = await Promise.all(
    toEnrich.map((c) => tryGitHubEnrichment(c.name)),
  );

  // 6. Score and rank
  const scored: Array<CandidateProfile & { _raw: RawCandidate }> = toEnrich.map((raw, i) => {
    const github = enrichments[i];
    const { score, reasoning } = scoreCandidate(raw, github, roleToHire);
    return {
      name: raw.name,
      title: raw.title || undefined,
      linkedinUrl: raw.linkedinUrl,
      githubUrl: github?.githubUrl ?? undefined,
      score,
      reasoning,
      _raw: raw,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const top10 = scored.slice(0, 10);

  // 7. Persist to database
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

  console.log(`[discovery] Saved top ${top10.length} candidates (best score: ${top10[0]?.score ?? 0})`);

  // Return clean profiles without internal _raw field
  return top10.map(({ _raw, ...profile }) => profile);
}
