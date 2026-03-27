/**
 * Generates the JavaScript GROUPS array string from cross-referenced results.
 *
 * Produces a JavaScript source string that can be injected into the HTML template,
 * defining the full GROUPS array consumed by the gantt chart renderer.
 */

import type { RowResult } from "./crossref";
import type { JiraTicket } from "./jira";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProcessedRow {
  name: string;
  result: RowResult;
  tickets: JiraTicket[];
  milestone: string;
  ticketKeys: string[];
}

export interface ProcessedGroup {
  label: string;
  rows: ProcessedRow[];
}

export interface ManualBar {
  cls: string;
  s: string;
  e: string;
  dl: string;
  ddc: string;
}

export interface ManualRow {
  name: string;
  sub: string;
  milestone: string;
  tickets: any[];
  bars: ManualBar[];
}

export interface ManualGroup {
  label: string;
  rows: ManualRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateConstructor(d: Date): string {
  return `new Date(${d.getFullYear()},${d.getMonth()},${d.getDate()})`;
}

function parseDateStringToConstructor(dateStr: string): string {
  const d = new Date(dateStr);
  return `new Date(${d.getFullYear()},${d.getMonth()},${d.getDate()})`;
}

function escapeJs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function indent(level: number): string {
  return "  ".repeat(level);
}

// ---------------------------------------------------------------------------
// Generate a tracked group
// ---------------------------------------------------------------------------

function generateTrackedRow(row: ProcessedRow, indentLevel: number): string {
  const i = indent(indentLevel);
  const i1 = indent(indentLevel + 1);
  const i2 = indent(indentLevel + 2);
  const r = row.result;

  // Build tickets array: [{k:"LMSV3-602",s:"Schema migrations"}, ...]
  const ticketEntries = row.tickets.map(
    (t) => `{k:"${escapeJs(t.key)}",s:"${escapeJs(t.summary)}"}`
  );

  const milestoneValue = r.status === "done" ? "done" : row.milestone;

  const lines: string[] = [];
  lines.push(`${i}{`);
  lines.push(`${i1}name: "${escapeJs(row.name)}",`);
  lines.push(`${i1}sub: "${escapeJs(r.sub)}",`);
  lines.push(`${i1}milestone: "${escapeJs(milestoneValue)}",`);
  lines.push(`${i1}tickets: [${ticketEntries.join(",")}],`);
  lines.push(`${i1}bars: [`);
  lines.push(`${i2}{ cls:"${r.barClass}", s:${formatDateConstructor(r.actualStart)}, e:${formatDateConstructor(r.actualEnd)}, dl:${formatDateConstructor(r.deadline)}, ddc:"${r.dotClass}" },`);
  lines.push(`${i1}],`);
  lines.push(`${i}}`);

  return lines.join("\n");
}

function generateTrackedGroup(group: ProcessedGroup, indentLevel: number): string {
  const i = indent(indentLevel);
  const i1 = indent(indentLevel + 1);

  const rowStrings = group.rows.map((row) =>
    generateTrackedRow(row, indentLevel + 2)
  );

  const lines: string[] = [];
  lines.push(`${i}{`);
  lines.push(`${i1}label: "${escapeJs(group.label)}",`);
  lines.push(`${i1}rows: [`);
  lines.push(rowStrings.join(",\n"));
  lines.push(`${i1}],`);
  lines.push(`${i}}`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Generate a manual group
// ---------------------------------------------------------------------------

function generateManualRow(row: ManualRow, indentLevel: number): string {
  const i = indent(indentLevel);
  const i1 = indent(indentLevel + 1);
  const i2 = indent(indentLevel + 2);

  const barsStr = row.bars
    .map(
      (bar) =>
        `${i2}{ cls:"${bar.cls}", s:${parseDateStringToConstructor(bar.s)}, e:${parseDateStringToConstructor(bar.e)}, dl:${parseDateStringToConstructor(bar.dl)}, ddc:"${bar.ddc}" }`
    )
    .join(",\n");

  const lines: string[] = [];
  lines.push(`${i}{`);
  lines.push(`${i1}name: "${escapeJs(row.name)}",`);
  lines.push(`${i1}sub: "${escapeJs(row.sub)}",`);
  lines.push(`${i1}milestone: "${escapeJs(row.milestone)}",`);
  lines.push(`${i1}tickets: [],`);
  lines.push(`${i1}bars: [`);
  lines.push(barsStr);
  lines.push(`${i1}],`);
  lines.push(`${i}}`);

  return lines.join("\n");
}

function generateManualGroup(group: ManualGroup, indentLevel: number): string {
  const i = indent(indentLevel);
  const i1 = indent(indentLevel + 1);

  const rowStrings = group.rows.map((row) =>
    generateManualRow(row, indentLevel + 2)
  );

  const lines: string[] = [];
  lines.push(`${i}{`);
  lines.push(`${i1}label: "${escapeJs(group.label)}",`);
  lines.push(`${i1}rows: [`);
  lines.push(rowStrings.join(",\n"));
  lines.push(`${i1}],`);
  lines.push(`${i}}`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateGroups(
  trackedResults: ProcessedGroup[],
  manualGroups: ManualGroup[]
): string {
  const allGroups: string[] = [];

  for (const group of trackedResults) {
    allGroups.push(generateTrackedGroup(group, 1));
  }

  for (const group of manualGroups) {
    allGroups.push(generateManualGroup(group, 1));
  }

  const lines: string[] = [];
  lines.push("[");
  lines.push(allGroups.join(",\n"));
  lines.push("];");

  return lines.join("\n");
}
