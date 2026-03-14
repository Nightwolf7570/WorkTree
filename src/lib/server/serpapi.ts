import type { BackendCandidate, BackendRecommendation } from "@/types/analysis";
import { generateId } from "./store";

const SERPAPI_KEY = process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY;

interface SerpAPIResult {
  organic_results?: Array<{
    title: string;
    link: string;
    snippet?: string;
    displayed_link?: string;
  }>;
  profiles_results?: Array<{
    title: string;
    link: string;
    snippet?: string;
  }>;
}

async function searchSerpAPI(query: string): Promise<SerpAPIResult> {
  if (!SERPAPI_KEY || SERPAPI_KEY === "your-serpapi-key-here") {
    throw new Error("SerpAPI key not configured. Add SERPAPI_KEY to .env.local");
  }

  const params = new URLSearchParams({
    q: query,
    api_key: SERPAPI_KEY,
    engine: "google",
    num: "10",
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  
  if (!response.ok) {
    console.error("SerpAPI error:", response.statusText);
    return { organic_results: [] };
  }

  return response.json();
}

function extractLinkedInInfo(url: string, title: string): { name: string; currentTitle?: string } {
  // Try to extract name from LinkedIn URL or title
  // LinkedIn titles are usually "Name - Title at Company | LinkedIn"
  const titleMatch = title.match(/^([^-–]+)\s*[-–]\s*([^|]+)/);
  
  if (titleMatch) {
    return {
      name: titleMatch[1].trim(),
      currentTitle: titleMatch[2].trim(),
    };
  }
  
  // Fallback: use URL slug
  const urlMatch = url.match(/linkedin\.com\/in\/([^/?]+)/);
  if (urlMatch) {
    const slug = urlMatch[1].replace(/-/g, " ");
    return { name: slug.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") };
  }
  
  return { name: title.split(" - ")[0] || "Unknown" };
}

function extractGitHubInfo(url: string, title: string): { name: string; username: string } {
  const urlMatch = url.match(/github\.com\/([^/?]+)/);
  const username = urlMatch ? urlMatch[1] : "unknown";
  
  // GitHub titles are usually "username · GitHub" or "Name (username)"
  const nameMatch = title.match(/^([^(·]+)/);
  const name = nameMatch ? nameMatch[1].trim() : username;
  
  return { name, username };
}

function calculateScore(snippet: string, roleKeywords: string[]): number {
  if (!snippet) return 50;
  
  const lower = snippet.toLowerCase();
  let score = 50;
  
  // Boost for relevant keywords
  for (const keyword of roleKeywords) {
    if (lower.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }
  
  // Boost for seniority indicators
  if (lower.includes("senior") || lower.includes("lead") || lower.includes("staff")) {
    score += 15;
  }
  if (lower.includes("principal") || lower.includes("director")) {
    score += 10;
  }
  
  // Experience indicators
  if (/\d+\+?\s*years?/.test(lower)) {
    score += 10;
  }
  
  return Math.min(score, 95);
}

function generateReasoning(title: string, snippet: string, role: string): string {
  const parts: string[] = [];
  
  if (title) {
    parts.push(`Current position: ${title.split(" - ")[1] || title}`);
  }
  
  if (snippet) {
    // Extract key points from snippet
    const sentences = snippet.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      parts.push(sentences[0].trim());
    }
  }
  
  if (parts.length === 0) {
    parts.push(`Potential match for ${role} based on profile keywords`);
  }
  
  return parts.join(". ");
}

export async function discoverCandidates(
  recommendation: BackendRecommendation
): Promise<BackendCandidate[]> {
  const roleKeywords = recommendation.roleToHire.toLowerCase().split(/\s+/);
  const candidates: BackendCandidate[] = [];
  
  // Search LinkedIn
  const linkedInQuery = `site:linkedin.com/in "${recommendation.roleToHire}" hiring available`;
  const linkedInResults = await searchSerpAPI(linkedInQuery);
  
  if (linkedInResults.organic_results) {
    for (const result of linkedInResults.organic_results.slice(0, 5)) {
      if (!result.link.includes("linkedin.com/in/")) continue;
      
      const { name, currentTitle } = extractLinkedInInfo(result.link, result.title);
      
      candidates.push({
        id: generateId(),
        name,
        title: currentTitle,
        linkedinUrl: result.link,
        score: calculateScore(result.snippet ?? "", roleKeywords),
        reasoning: generateReasoning(result.title, result.snippet ?? "", recommendation.roleToHire),
      });
    }
  }
  
  // Search GitHub for technical roles
  const techRoles = ["engineer", "developer", "devops", "sre", "architect", "data"];
  const isTechRole = techRoles.some(r => recommendation.roleToHire.toLowerCase().includes(r));
  
  if (isTechRole) {
    const githubQuery = `site:github.com "${recommendation.roleToHire}" OR "${roleKeywords.join(" ")}"`;
    const githubResults = await searchSerpAPI(githubQuery);
    
    if (githubResults.organic_results) {
      for (const result of githubResults.organic_results.slice(0, 3)) {
        if (!result.link.includes("github.com/")) continue;
        if (result.link.includes("/repos/") || result.link.includes("/issues/")) continue;
        
        const { name, username } = extractGitHubInfo(result.link, result.title);
        
        // Check if we already have this person from LinkedIn
        const existing = candidates.find(c => 
          c.name.toLowerCase() === name.toLowerCase() ||
          c.linkedinUrl?.includes(username)
        );
        
        if (existing) {
          existing.githubUrl = result.link;
        } else {
          candidates.push({
            id: generateId(),
            name,
            title: `GitHub: ${username}`,
            githubUrl: result.link,
            score: calculateScore(result.snippet ?? "", roleKeywords),
            reasoning: generateReasoning(result.title, result.snippet ?? "", recommendation.roleToHire),
          });
        }
      }
    }
  }
  
  // If no results found, return empty array (real search returned no matches)
  // Sort by score descending
  return candidates.sort((a, b) => b.score - a.score);
}
