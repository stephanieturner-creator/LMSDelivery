/**
 * Jira REST API client for LearnV3 gantt chart refresh pipeline.
 * Uses basic auth (email:token base64 encoded) against the Atlassian REST API.
 */

import { JIRA_BASE_URL } from "./config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JiraComment {
  author: string;
  body: string;
  created: string;
}

export interface JiraTicket {
  key: string;
  summary: string;
  status: string;
  created: string;
  resolved: string | null;
  comments: JiraComment[];
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getAuthHeader(): string {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!email || !token) {
    console.error("Missing JIRA_EMAIL or JIRA_API_TOKEN environment variables");
    process.exit(1);
  }
  const encoded = btoa(`${email}:${token}`);
  return `Basic ${encoded}`;
}

function baseUrl(): string {
  return JIRA_BASE_URL;
}

// ---------------------------------------------------------------------------
// Internal fetch wrapper
// ---------------------------------------------------------------------------

async function jiraFetch<T>(path: string): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`Jira API ${res.status} ${res.statusText}: ${url}\n${text}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Comment body extraction
// ---------------------------------------------------------------------------

/**
 * Atlassian Document Format (ADF) bodies are deeply nested. We recursively
 * extract all text nodes to produce a flat string for keyword matching.
 */
function extractAdfText(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.type === "text") return node.text ?? "";
  if (Array.isArray(node.content)) {
    return node.content.map(extractAdfText).join("");
  }
  return "";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Batch-fetch tickets by key using JQL `key in (...)`.
 * Automatically paginates if more than 100 results.
 */
export async function fetchTickets(keys: string[]): Promise<JiraTicket[]> {
  if (keys.length === 0) return [];

  const fields = "summary,status,created,resolutiondate,comment";
  const jql = `key in (${keys.join(",")})`;
  const tickets: JiraTicket[] = [];

  // Batch into chunks of 50 keys to avoid URL length limits
  const chunkSize = 50;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    const chunkJql = `key in (${chunk.join(",")})`;
    const encodedJql = encodeURIComponent(chunkJql);
    const path = `/rest/api/3/search/jql?jql=${encodedJql}&fields=${fields}&maxResults=${chunkSize}`;

    const data = await jiraFetch<{
      issues: any[];
    }>(path);

    console.log(`  Jira batch ${Math.floor(i / chunkSize) + 1}: requested ${chunk.length}, got ${data.issues.length}`);

    for (const issue of data.issues) {
      const f = issue.fields;
      const rawComments: any[] = f.comment?.comments ?? [];

      const comments: JiraComment[] = rawComments.map((c: any) => ({
        author: c.author?.displayName ?? c.author?.emailAddress ?? "unknown",
        body: extractAdfText(c.body),
        created: c.created,
      }));

      tickets.push({
        key: issue.key,
        summary: f.summary ?? "",
        status: f.status?.name ?? "Unknown",
        created: f.created ?? "",
        resolved: f.resolutiondate ?? null,
        comments,
      });
    }

  }

  return tickets;
}

/**
 * Fetch just the status of a single issue (typically an epic).
 */
export async function fetchEpicStatus(key: string): Promise<string> {
  const data = await jiraFetch<{
    fields: { status: { name: string } };
  }>(`/rest/api/3/issue/${key}?fields=status`);

  return data.fields.status.name;
}
