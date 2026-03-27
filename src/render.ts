/**
 * Template renderer for the LearnV3 gantt chart.
 *
 * Reads template/shell.html, injects the generated GROUPS data,
 * updates dates, and writes out index.html.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatHumanDate(d: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function render(groupsJs: string, today: Date): void {
  const projectRoot = resolve(import.meta.dir, "..");
  const templatePath = resolve(projectRoot, "template", "shell.html");
  const outputPath = resolve(projectRoot, "index.html");

  let html: string;
  try {
    html = readFileSync(templatePath, "utf-8");
  } catch (err) {
    console.error(`Failed to read template at ${templatePath}:`, err);
    process.exit(1);
  }

  // 1. Replace the GROUPS placeholder
  //    The template contains: /* __GROUPS_DATA__ */[]
  //    We replace the entire `/* __GROUPS_DATA__ */[]` with our generated code.
  const groupsPlaceholder = "/* __GROUPS_DATA__ */[]";
  if (html.includes(groupsPlaceholder)) {
    html = html.replace(groupsPlaceholder, groupsJs);
  } else {
    // Fallback: try to find just the marker comment
    const markerRegex = /\/\*\s*__GROUPS_DATA__\s*\*\/\s*\[\s*\]/;
    if (markerRegex.test(html)) {
      html = html.replace(markerRegex, groupsJs);
    } else {
      console.error(
        "Could not find GROUPS placeholder in template. " +
        "Expected: /* __GROUPS_DATA__ */[]"
      );
      process.exit(1);
    }
  }

  // 2. Replace __TODAY__ placeholders with today's date
  const isoDate = formatISODate(today);
  html = html.replaceAll("__TODAY__", isoDate);

  // 3. Replace __REFRESH_TIME__ with exact timestamp
  const now = new Date();
  const refreshTime = now.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  html = html.replaceAll("__REFRESH_TIME__", refreshTime);

  // 4. Update "last-updated" display
  const humanDate = formatHumanDate(today);
  html = html.replace(
    /Last updated:\s*[^<]*/g,
    `Last updated: ${humanDate}`
  );

  // Write the output
  try {
    writeFileSync(outputPath, html, "utf-8");
    console.log(`Wrote ${outputPath}`);
  } catch (err) {
    console.error(`Failed to write ${outputPath}:`, err);
    process.exit(1);
  }
}
