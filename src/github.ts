/**
 * GitHub client for LearnV3 gantt chart refresh pipeline.
 * Uses `gh` CLI locally (no PAT needed) or GITHUB_TOKEN in CI.
 */

import { GITHUB_REPO } from "./config";

export interface MergedPR {
  number: number;
  title: string;
  state: string;
  mergedAt: string;
}

export interface PRMatch {
  earliestMerge: Date | null;
  latestMerge: Date | null;
  count: number;
  prs: MergedPR[];
}

/**
 * Try gh CLI first (local dev), fall back to GITHUB_TOKEN (CI).
 */
async function ghApiFetch(endpoint: string): Promise<any> {
  // Try gh CLI first
  try {
    const proc = Bun.spawn(["gh", "api", endpoint, "--paginate"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode === 0 && stdout.trim()) {
      // gh --paginate outputs concatenated JSON arrays, need to merge
      const chunks = stdout.trim().split("\n").filter(Boolean);
      const merged: any[] = [];
      for (const chunk of chunks) {
        try {
          const parsed = JSON.parse(chunk);
          if (Array.isArray(parsed)) merged.push(...parsed);
          else merged.push(parsed);
        } catch { /* skip malformed chunks */ }
      }
      return merged;
    }
  } catch {
    // gh CLI not available, fall through
  }

  // Fall back to GITHUB_TOKEN
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Neither `gh` CLI nor GITHUB_TOKEN available for GitHub API access");
    process.exit(1);
  }

  const allResults: any[] = [];
  let page = 1;
  while (true) {
    const url = `https://api.github.com/${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
    const data = await res.json() as any[];
    if (!Array.isArray(data) || data.length === 0) break;
    allResults.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return allResults;
}

/**
 * Fetch ALL merged PRs from the repo.
 */
export async function fetchAllMergedPRs(): Promise<MergedPR[]> {
  const prs = await ghApiFetch(`repos/${GITHUB_REPO}/pulls?state=closed&per_page=100`);

  return prs
    .filter((pr: any) => pr.merged_at)
    .map((pr: any) => ({
      number: pr.number,
      title: pr.title ?? "",
      state: pr.state,
      mergedAt: pr.merged_at,
    }));
}

/**
 * Match PRs to a specific Jira ticket key by checking the PR title.
 */
export function matchPRsToTicket(allPRs: MergedPR[], ticketKey: string): PRMatch {
  const keyUpper = ticketKey.toUpperCase();
  const matched = allPRs.filter((pr) => pr.title.toUpperCase().includes(keyUpper));

  if (matched.length === 0) {
    return { earliestMerge: null, latestMerge: null, count: 0, prs: [] };
  }

  const dates = matched.map((pr) => new Date(pr.mergedAt));
  dates.sort((a, b) => a.getTime() - b.getTime());

  return {
    earliestMerge: dates[0],
    latestMerge: dates[dates.length - 1],
    count: matched.length,
    prs: matched,
  };
}

/**
 * Match PRs to any of several ticket keys, returning a combined PRMatch.
 */
export function matchPRsToTickets(allPRs: MergedPR[], ticketKeys: string[]): PRMatch {
  const seen = new Set<number>();
  const unique: MergedPR[] = [];

  for (const key of ticketKeys) {
    for (const pr of matchPRsToTicket(allPRs, key).prs) {
      if (!seen.has(pr.number)) {
        seen.add(pr.number);
        unique.push(pr);
      }
    }
  }

  if (unique.length === 0) {
    return { earliestMerge: null, latestMerge: null, count: 0, prs: [] };
  }

  const dates = unique.map((pr) => new Date(pr.mergedAt));
  dates.sort((a, b) => a.getTime() - b.getTime());

  return {
    earliestMerge: dates[0],
    latestMerge: dates[dates.length - 1],
    count: unique.length,
    prs: unique,
  };
}
