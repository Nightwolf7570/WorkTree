import { env } from "../config/env.js";

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  html_url: string;
  public_repos: number;
  followers: number;
}

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
}

/**
 * Search GitHub users by skill/role keywords.
 * Used to enrich candidate discovery with real GitHub data.
 */
export async function searchGitHubUsers(
  query: string,
  maxResults = 10
): Promise<GitHubUser[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "WorkTree-App",
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const url = `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=${maxResults}&sort=followers`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { items: Array<{ login: string; html_url: string }> };

  // Fetch full profile for each user
  const users: GitHubUser[] = [];
  for (const item of data.items.slice(0, maxResults)) {
    const userRes = await fetch(`https://api.github.com/users/${item.login}`, { headers });
    if (userRes.ok) {
      users.push((await userRes.json()) as GitHubUser);
    }
  }

  return users;
}

/**
 * Get top repositories for a GitHub user.
 */
export async function getUserRepos(
  username: string,
  maxResults = 5
): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "WorkTree-App",
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const url = `https://api.github.com/users/${username}/repos?sort=stars&per_page=${maxResults}&type=owner`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const repos = (await response.json()) as GitHubRepo[];
  return repos.filter((r) => !r.fork);
}
