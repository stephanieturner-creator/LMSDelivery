/**
 * Cross-reference engine for the LearnV3 gantt chart refresh pipeline.
 *
 * Takes Jira ticket data and GitHub PR match data, determines the actual
 * status, dates, CSS classes, and subtitle text for each row in the chart.
 */

import type { JiraTicket } from "./jira";
import type { PRMatch } from "./github";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RowStatus = "done" | "qa" | "active" | "at-risk" | "blocked" | "urgent";

export interface RowResult {
  status: RowStatus;
  barClass: string;   // b-done, b-qa, b-alpha2, b-atrisk, b-blocked, b-urgent
  dotClass: string;   // dd-green, dd-amber, dd-red, dd-blue, dd-gray, dd-purple
  actualStart: Date;
  actualEnd: Date;
  deadline: Date;
  sub: string;        // generated subtitle text
  staleStatus: boolean; // true if Jira status is stale (merged PRs but not Done)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DONE_STATUSES = ["done", "closed", "resolved"];
const QA_STATUSES = ["qa", "review", "in review", "code review", "in qa", "ready for qa"];
const PROGRESS_STATUSES = ["in progress", "in development", "development"];
const BLOCKED_STATUSES = ["blocked"];
const TODO_STATUSES = ["to do", "todo", "prd", "open", "backlog", "new", "prd review"];

const BAR_MAP: Record<RowStatus, string> = {
  done: "b-done",
  qa: "b-qa",
  active: "b-alpha2",
  "at-risk": "b-atrisk",
  blocked: "b-blocked",
  urgent: "b-urgent",
};

const DOT_MAP: Record<RowStatus, string> = {
  done: "dd-green",
  qa: "dd-amber",
  active: "dd-blue",
  "at-risk": "dd-amber",
  blocked: "dd-gray",
  urgent: "dd-red",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeStatus(s: string): string {
  return s.toLowerCase().trim();
}

function isStatusInSet(status: string, set: string[]): boolean {
  return set.includes(normalizeStatus(status));
}

function hasImplementationCompleteComment(ticket: JiraTicket): boolean {
  const patterns = [
    "implementation complete",
    "solve complete",
    "implementation done",
  ];
  for (const comment of ticket.comments) {
    const lower = comment.body.toLowerCase();
    for (const pattern of patterns) {
      if (lower.includes(pattern)) return true;
    }
  }
  return false;
}

/**
 * Generate a compact ticket-range string. E.g. ["LMSV3-602", "LMSV3-603"] → "602/603"
 * Sequential ranges collapse: ["LMSV3-629",...,"LMSV3-636"] → "629-636"
 */
function ticketRange(keys: string[]): string {
  const nums = keys
    .map((k) => {
      const parts = k.split("-");
      return parseInt(parts[parts.length - 1], 10);
    })
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (nums.length === 0) return "";
  if (nums.length === 1) return String(nums[0]);

  // Check if fully sequential
  let isSequential = true;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + 1) {
      isSequential = false;
      break;
    }
  }

  if (isSequential && nums.length > 2) {
    return `${nums[0]}-${nums[nums.length - 1]}`;
  }

  return nums.join("/");
}

function statusText(status: RowStatus, tickets: JiraTicket[], epicStatus?: string, stale?: boolean): string {
  if (status === "done") {
    return stale ? "Done (Jira stale)" : "Done";
  }
  if (status === "qa") {
    if (epicStatus) {
      return `All stories done, epic QA`;
    }
    return "QA / Review";
  }
  if (status === "active") return "In progress";
  if (status === "at-risk") return "At risk";
  if (status === "blocked") {
    // Check if it's a PRD/scoping issue
    const hasPrd = tickets.some((t) => isStatusInSet(t.status, ["prd", "prd review"]));
    if (hasPrd) return "PRD — needs scoping";
    return "Blocked";
  }
  if (status === "urgent") return "Urgent";
  return status;
}

// ---------------------------------------------------------------------------
// Main cross-reference logic
// ---------------------------------------------------------------------------

// Milestone → phase deadline mapping
const MILESTONE_DEADLINES: Record<string, string> = {
  alpha: "2026-03-30",
  alpha2: "2026-04-14",
  beta: "2026-04-27",
  ga: "2026-05-25",
};

export interface CrossRefOptions {
  tickets: JiraTicket[];
  prMatch: PRMatch;
  epicStatus?: string;
  epicOverride?: boolean;
  ticketKeys: string[];
  milestone?: string;
}

export function crossReferenceRow(opts: CrossRefOptions): RowResult {
  const { tickets, prMatch, epicStatus, epicOverride, ticketKeys } = opts;
  const now = new Date();

  let status: RowStatus;
  let staleStatus = false;

  // Count statuses
  const allDone = tickets.length > 0 && tickets.every((t) => isStatusInSet(t.status, DONE_STATUSES));
  const allResolved = tickets.length > 0 && tickets.every((t) => t.resolved !== null);
  const anyBlocked = tickets.some((t) => isStatusInSet(t.status, BLOCKED_STATUSES));
  const anyQA = tickets.some((t) => isStatusInSet(t.status, QA_STATUSES));
  const anyInProgress = tickets.some((t) => isStatusInSet(t.status, PROGRESS_STATUSES));
  const allTodo = tickets.length > 0 && tickets.every((t) => isStatusInSet(t.status, TODO_STATUSES));
  const hasMergedPRs = prMatch.count > 0;
  const hasImplComplete = tickets.some(hasImplementationCompleteComment);

  // 1. All tickets resolved in Jira
  if (allResolved || allDone) {
    status = "done";

    // But if epicOverride is set and the epic is not Done, use epic status
    if (epicOverride && epicStatus && !isStatusInSet(epicStatus, DONE_STATUSES)) {
      if (isStatusInSet(epicStatus, QA_STATUSES)) {
        status = "qa";
      } else if (isStatusInSet(epicStatus, PROGRESS_STATUSES)) {
        status = "active";
      }
    }
  }
  // 2. Tickets have merged PRs + implementation complete comments
  else if (hasMergedPRs && hasImplComplete) {
    status = "done";
    staleStatus = true;

    if (epicOverride && epicStatus && !isStatusInSet(epicStatus, DONE_STATUSES)) {
      if (isStatusInSet(epicStatus, QA_STATUSES)) {
        status = "qa";
        staleStatus = false;
      }
    }
  }
  // 3. Tickets have merged PRs + Jira QA/REVIEW
  else if (hasMergedPRs && anyQA) {
    status = "qa";
  }
  // 4. Tickets have merged PRs + Jira In Progress
  else if (hasMergedPRs && anyInProgress) {
    status = "active";
  }
  // 5. Any ticket blocked
  else if (anyBlocked) {
    status = "blocked";
  }
  // 6. No merged PRs + all TODO/PRD
  else if (!hasMergedPRs && allTodo) {
    status = "blocked";
  }
  // 7. In progress without merged PRs
  else if (anyInProgress) {
    status = "active";
  }
  // 8. QA without merged PRs (some internal process)
  else if (anyQA) {
    status = "qa";
  }
  // Default: active (work is happening but doesn't fit neat categories)
  else {
    status = "active";
  }

  // --- Date logic ---
  // actualStart: earliest PR merge date, or Jira created date if no PRs
  let actualStart: Date;
  if (prMatch.earliestMerge) {
    actualStart = prMatch.earliestMerge;
  } else {
    // Use earliest Jira created date
    const createdDates = tickets
      .filter((t) => t.created)
      .map((t) => new Date(t.created));
    if (createdDates.length > 0) {
      createdDates.sort((a, b) => a.getTime() - b.getTime());
      actualStart = createdDates[0];
    } else {
      actualStart = now;
    }
  }

  // actualEnd: Jira resolution date, or latest PR merge, or today if still open
  let actualEnd: Date;
  if (status === "done" || allResolved) {
    // Use Jira resolution date if available
    const resolvedDates = tickets
      .filter((t) => t.resolved)
      .map((t) => new Date(t.resolved!));
    if (resolvedDates.length > 0) {
      resolvedDates.sort((a, b) => b.getTime() - a.getTime());
      actualEnd = resolvedDates[0]; // latest resolution
    } else if (prMatch.latestMerge) {
      actualEnd = prMatch.latestMerge;
    } else {
      actualEnd = now;
    }
  } else if (prMatch.latestMerge) {
    actualEnd = now; // Still open, bar extends to today
  } else {
    actualEnd = now;
  }

  // deadline: use actualEnd for done items, or milestone phase date for active/qa/blocked
  let deadline: Date;
  if (status === "done") {
    deadline = new Date(actualEnd);
  } else if (opts.milestone && MILESTONE_DEADLINES[opts.milestone]) {
    deadline = new Date(MILESTONE_DEADLINES[opts.milestone]);
    // Also extend the bar end to the deadline if it's past today
    if (deadline.getTime() > actualEnd.getTime()) {
      actualEnd = deadline;
    }
  } else {
    deadline = new Date(actualEnd);
  }

  // --- Build result ---
  const barClass = BAR_MAP[status];
  const dotClass = DOT_MAP[status];
  const sub = `${ticketRange(ticketKeys)} \u00b7 ${statusText(status, tickets, epicOverride ? epicStatus : undefined, staleStatus)}`;

  return {
    status,
    barClass,
    dotClass,
    actualStart,
    actualEnd,
    deadline,
    sub,
    staleStatus,
  };
}
