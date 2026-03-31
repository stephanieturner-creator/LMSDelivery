/**
 * Main orchestrator for the LearnV3 gantt chart refresh pipeline.
 *
 * Usage:
 *   bun run src/refresh.ts [--dry-run] [--push]
 *
 * Env vars required: JIRA_EMAIL, JIRA_API_TOKEN, GITHUB_TOKEN
 */

import { TRACKED_GROUPS, MANUAL_GROUPS } from "./config";
import type { TrackedGroupConfig, TrackedRowConfig } from "./config";
import { fetchTickets, fetchEpicStatus } from "./jira";
import type { JiraTicket } from "./jira";
import { fetchAllMergedPRs, matchPRsToTickets } from "./github";
import type { MergedPR } from "./github";
import { crossReferenceRow } from "./crossref";
import type { RowResult } from "./crossref";
import { generateGroups } from "./generate";
import type { ProcessedGroup, ProcessedRow } from "./generate";
import { render } from "./render";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs(): { dryRun: boolean; push: boolean } {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    push: args.includes("--push"),
  };
}

// ---------------------------------------------------------------------------
// Collect all ticket keys
// ---------------------------------------------------------------------------

function collectAllTicketKeys(groups: TrackedGroupConfig[]): string[] {
  const keys = new Set<string>();
  for (const group of groups) {
    for (const row of group.rows) {
      for (const ticket of row.tickets) {
        keys.add(ticket);
      }
    }
  }
  return Array.from(keys);
}

/**
 * Collect all unique epic keys that need status checks.
 */
function collectEpicKeys(groups: TrackedGroupConfig[]): string[] {
  const keys = new Set<string>();
  for (const group of groups) {
    if (group.epicKey) {
      keys.add(group.epicKey);
    }
  }
  return Array.from(keys);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { dryRun, push } = parseArgs();

  if (dryRun) {
    console.log("DRY RUN mode — will not write files or push.\n");
  }

  // --- Collect all ticket keys ---
  const allKeys = collectAllTicketKeys(TRACKED_GROUPS);
  console.log(`Fetching ${allKeys.length} tickets from Jira...`);

  // --- Fetch Jira tickets ---
  let ticketMap: Map<string, JiraTicket>;
  try {
    const tickets = await fetchTickets(allKeys);
    ticketMap = new Map(tickets.map((t) => [t.key, t]));
    console.log(`  Received ${ticketMap.size} tickets.`);
  } catch (err) {
    console.error("Failed to fetch Jira tickets:", err);
    process.exit(1);
  }

  // --- Fetch epic statuses ---
  const epicKeys = collectEpicKeys(TRACKED_GROUPS);
  const epicStatusMap = new Map<string, string>();
  if (epicKeys.length > 0) {
    console.log(`Fetching ${epicKeys.length} epic statuses...`);
    for (const key of epicKeys) {
      try {
        const status = await fetchEpicStatus(key);
        epicStatusMap.set(key, status);
        console.log(`  ${key}: ${status}`);
      } catch (err) {
        console.error(`  Failed to fetch epic ${key}:`, err);
      }
    }
  }

  // --- Fetch GitHub PRs ---
  console.log("Fetching PRs from GitHub...");
  let allPRs: MergedPR[];
  try {
    allPRs = await fetchAllMergedPRs();
    console.log(`  Received ${allPRs.length} merged PRs.`);
  } catch (err) {
    console.warn("  Warning: Failed to fetch GitHub PRs (will use Jira data only):", (err as Error).message);
    allPRs = [];
  }

  // --- Cross-reference ---
  console.log("Cross-referencing...\n");

  const processedGroups: ProcessedGroup[] = [];
  let changedCount = 0;
  let unchangedCount = 0;

  for (const group of TRACKED_GROUPS) {
    const epicStatus = group.epicKey ? epicStatusMap.get(group.epicKey) : undefined;
    const processedRows: ProcessedRow[] = [];

    for (const rowConfig of group.rows) {
      // Gather Jira tickets for this row
      const rowTickets: JiraTicket[] = [];
      for (const key of rowConfig.tickets) {
        const ticket = ticketMap.get(key);
        if (ticket) {
          rowTickets.push(ticket);
        } else {
          console.error(`  Warning: ticket ${key} not found in Jira response`);
        }
      }

      // Match PRs
      const prMatch = matchPRsToTickets(allPRs, rowConfig.tickets);

      // Cross-reference
      const result = crossReferenceRow({
        tickets: rowTickets,
        prMatch,
        epicStatus,
        epicOverride: rowConfig.epicOverride,
        ticketKeys: rowConfig.tickets,
        milestone: rowConfig.milestone,
      });

      // Log result
      const icon = result.staleStatus ? "\u26a0" : "\u2713";
      const staleNote = result.staleStatus ? " (Jira stale)" : "";
      const prNote = prMatch.count > 0 ? ` [${prMatch.count} PRs]` : "";
      console.log(`  ${icon} ${rowConfig.name}: ${result.status}${staleNote}${prNote}`);

      processedRows.push({
        name: rowConfig.name,
        result,
        tickets: rowTickets,
        milestone: rowConfig.milestone,
        ticketKeys: rowConfig.tickets,
      });

      // For now, count everything as "changed" since we don't have previous state
      changedCount++;
    }

    processedGroups.push({
      label: group.label,
      rows: processedRows,
    });
  }

  console.log("");

  // --- Generate GROUPS JavaScript ---
  console.log("Generating GROUPS data...");
  const groupsJs = generateGroups(processedGroups, MANUAL_GROUPS);

  if (dryRun) {
    console.log("\n--- DRY RUN: Generated GROUPS output ---\n");
    console.log(groupsJs);
    console.log("\n--- End of GROUPS output ---\n");
    console.log(`Done (dry run). ${changedCount} rows processed.`);
    return;
  }

  // --- Render index.html ---
  console.log("Writing index.html...");
  const today = new Date();
  render(groupsJs, today);

  console.log(`\nDone. ${changedCount} rows updated, ${unchangedCount} unchanged.`);

  // --- Optional: push to git ---
  if (push) {
    console.log("\nPushing to git...");
    try {
      const addResult = Bun.spawnSync(["git", "add", "index.html", ".pr-cache.json"], {
        cwd: import.meta.dir + "/..",
      });
      if (addResult.exitCode !== 0) {
        console.error("git add failed:", addResult.stderr.toString());
        process.exit(1);
      }

      const dateStr = today.toISOString().split("T")[0];
      const commitResult = Bun.spawnSync(
        ["git", "commit", "-m", `Refresh gantt chart data — ${dateStr}`],
        { cwd: import.meta.dir + "/.." }
      );
      if (commitResult.exitCode !== 0) {
        const output = commitResult.stdout.toString() + commitResult.stderr.toString();
        if (output.includes("nothing to commit") || output.includes("working tree clean")) {
          console.log("No changes to commit.");
          return;
        } else {
          console.error("git commit failed:", output);
          process.exit(1);
        }
      } else {
        console.log("Committed.");
      }

      const pushResult = Bun.spawnSync(["git", "push"], {
        cwd: import.meta.dir + "/..",
      });
      if (pushResult.exitCode !== 0) {
        console.error("git push failed:", pushResult.stderr.toString());
        process.exit(1);
      }
      console.log("Pushed to remote.");
    } catch (err) {
      console.error("Git operations failed:", err);
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
