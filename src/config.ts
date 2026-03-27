/**
 * Configuration / source of truth for the LearnV3 gantt chart refresh pipeline.
 *
 * Contains all ticket-to-row mappings, phase definitions, and manual groups.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const JIRA_BASE_URL = "https://ltv8.atlassian.net";
export const GITHUB_REPO = "thrivecart/LearnV3";

// ---------------------------------------------------------------------------
// Phase definitions
// ---------------------------------------------------------------------------

export interface Phase {
  label: string;
  bandClass: string;
  flagClass: string;
  start: string;
  end: string;
}

export const PHASES: Phase[] = [
  { label: "Alpha \u00b7 30\u201350 users", bandClass: "pb-alpha", flagClass: "flag-alpha", start: "2026-03-30", end: "2026-04-13" },
  { label: "Alpha 2 \u00b7 10\u201350 creators", bandClass: "pb-alpha2", flagClass: "flag-alpha2", start: "2026-04-14", end: "2026-04-27" },
  { label: "Beta \u00b7 200\u2013400 creators", bandClass: "pb-beta", flagClass: "flag-beta", start: "2026-04-27", end: "2026-05-18" },
  { label: "GA \u00b7 full release", bandClass: "pb-ga", flagClass: "flag-ga", start: "2026-05-25", end: "2026-06-07" },
];

export const MIN_DATE = "2026-01-05";
export const MAX_DATE = "2026-06-14";

// ---------------------------------------------------------------------------
// Tracked row configuration
// ---------------------------------------------------------------------------

export interface TrackedRowConfig {
  name: string;
  tickets: string[];
  milestone: string;
  epicOverride?: boolean;
}

export interface TrackedGroupConfig {
  label: string;
  epicKey?: string;
  rows: TrackedRowConfig[];
}

export const TRACKED_GROUPS: TrackedGroupConfig[] = [
  {
    label: "E0 \u2014 Foundation \u00b7 592",
    rows: [
      { name: "Schema + backfill", tickets: ["LMSV3-602", "LMSV3-603"], milestone: "auto" },
      { name: "Analytics service", tickets: ["LMSV3-604"], milestone: "alpha" },
      { name: "Brand utilities", tickets: ["LMSV3-605"], milestone: "auto" },
    ],
  },
  {
    label: "E1 \u2014 Creator Wizard \u00b7 593",
    rows: [
      { name: "Wizard steps 1\u20134", tickets: ["LMSV3-606", "LMSV3-607", "LMSV3-608", "LMSV3-609"], milestone: "auto" },
      { name: "Wizard cleanup + brand theming", tickets: ["LMSV3-610", "LMSV3-611", "LMSV3-612"], milestone: "auto" },
    ],
  },
  {
    label: "E2 \u2014 Setup Checklist \u00b7 594",
    rows: [
      { name: "Checklist + go-live blocker check", tickets: ["LMSV3-613", "LMSV3-614", "LMSV3-615"], milestone: "auto" },
    ],
  },
  {
    label: "E3 \u2014 Access & Privacy \u00b7 595",
    epicKey: "LMSV3-649",
    rows: [
      { name: "Public join + access model settings", tickets: ["LMSV3-616", "LMSV3-617"], milestone: "auto" },
      { name: "Free-private access request", tickets: ["LMSV3-618"], milestone: "alpha", epicOverride: true },
      { name: "Access requests + invite join", tickets: ["LMSV3-619", "LMSV3-620"], milestone: "alpha", epicOverride: true },
      { name: "Creator manages invite codes", tickets: ["LMSV3-621"], milestone: "alpha" },
    ],
  },
  {
    label: "E4\u2013E6 \u2014 Gamification, Preview & Go-Live \u00b7 596/597/598",
    rows: [
      { name: "Gamification config + preview", tickets: ["LMSV3-622", "LMSV3-623", "LMSV3-624"], milestone: "auto" },
      { name: "Go live + take offline", tickets: ["LMSV3-625", "LMSV3-626"], milestone: "auto" },
    ],
  },
  {
    label: "E7 \u2014 Universal Student Account \u00b7 599",
    epicKey: "LMSV3-650",
    rows: [
      { name: "Universal account + cross-community", tickets: ["LMSV3-627", "LMSV3-628"], milestone: "alpha", epicOverride: true },
    ],
  },
  {
    label: "E8 \u2014 Student Onboarding \u00b7 600 \u00b7 8 stories",
    epicKey: "LMSV3-650",
    rows: [
      { name: "Onboarding flow + cards", tickets: ["LMSV3-629", "LMSV3-630", "LMSV3-631", "LMSV3-632", "LMSV3-633", "LMSV3-634", "LMSV3-635", "LMSV3-636"], milestone: "alpha", epicOverride: true },
    ],
  },
  {
    label: "E9 \u2014 Platform Badges \u00b7 601 \u00b7 4 stories",
    epicKey: "LMSV3-650",
    rows: [
      { name: "Badges + level-up system", tickets: ["LMSV3-637", "LMSV3-638", "LMSV3-639", "LMSV3-640"], milestone: "alpha2", epicOverride: true },
    ],
  },
  {
    label: "Infra \u2014 CDN & Payments",
    rows: [
      { name: "Bunny.net asset segmentation", tickets: ["LMSV3-713", "LMSV3-994"], milestone: "alpha" },
    ],
  },
  {
    label: "Auth \u00b7 919 \u00b7 stories done, epic QA",
    epicKey: "LMSV3-919",
    rows: [
      { name: "OAuth, magic link, OTP, branding", tickets: ["LMSV3-920", "LMSV3-921", "LMSV3-922", "LMSV3-923", "LMSV3-924", "LMSV3-925", "LMSV3-926", "LMSV3-927", "LMSV3-928", "LMSV3-929", "LMSV3-930", "LMSV3-931"], milestone: "alpha", epicOverride: true },
    ],
  },
  {
    label: "Course Management \u00b7 457 \u00b7 ~85% done",
    rows: [
      { name: "Editor, preview, shortcuts, bulk upload", tickets: ["LMSV3-457"], milestone: "alpha" },
    ],
  },
  {
    label: "Student Course Display \u00b7 984 \u00b7 Done",
    rows: [
      { name: "Skeleton, lock icons, CTA, branding", tickets: ["LMSV3-985", "LMSV3-986", "LMSV3-987", "LMSV3-988", "LMSV3-989", "LMSV3-990"], milestone: "auto" },
    ],
  },
  {
    label: "Blueprints \u00b7 934 \u00b7 Done",
    rows: [
      { name: "Lesson content templates", tickets: ["LMSV3-935", "LMSV3-936", "LMSV3-937", "LMSV3-938", "LMSV3-939", "LMSV3-940"], milestone: "auto" },
    ],
  },
  {
    label: "Media Library / Piktochart \u00b7 992 \u00b7 9 stories",
    rows: [
      { name: "Media SDK + integrations", tickets: ["LMSV3-993", "LMSV3-994", "LMSV3-995", "LMSV3-996", "LMSV3-997", "LMSV3-998", "LMSV3-999", "LMSV3-1000", "LMSV3-1015"], milestone: "alpha2" },
    ],
  },
  {
    label: "Quiz UI/UX Rework \u00b7 869 + 880 \u00b7 18 stories",
    rows: [
      { name: "Creator \u2014 inline card editing, icons, rich text", tickets: ["LMSV3-870", "LMSV3-871", "LMSV3-872", "LMSV3-873", "LMSV3-874", "LMSV3-875", "LMSV3-876", "LMSV3-877", "LMSV3-878", "LMSV3-879", "LMSV3-881"], milestone: "beta" },
      { name: "Student \u2014 consolidate 9 variants to 4 modes", tickets: ["LMSV3-883", "LMSV3-884", "LMSV3-885", "LMSV3-886", "LMSV3-887", "LMSV3-888"], milestone: "beta" },
    ],
  },
  {
    label: "ThriveCart Integration \u00b7 1019 \u00b7 16 stories",
    rows: [
      { name: "Migration pipeline \u2014 7 batches", tickets: ["LMSV3-1020", "LMSV3-1021", "LMSV3-1022", "LMSV3-1023", "LMSV3-1024", "LMSV3-1025", "LMSV3-1026", "LMSV3-1027", "LMSV3-1028", "LMSV3-1029", "LMSV3-1030", "LMSV3-1031", "LMSV3-1032", "LMSV3-1033", "LMSV3-1034", "LMSV3-1035"], milestone: "ga" },
    ],
  },
  {
    label: "Alpha Gaps \u2014 In Progress",
    rows: [
      { name: "Lesson discussion integration", tickets: ["LMSV3-971"], milestone: "alpha" },
      { name: "Leaderboard enhancements", tickets: ["LMSV3-20", "LMSV3-532", "LMSV3-829"], milestone: "alpha" },
      { name: "Notification center", tickets: ["LMSV3-31", "LMSV3-640", "LMSV3-972"], milestone: "alpha" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Manual groups (no Jira tickets — pass through unchanged)
// ---------------------------------------------------------------------------

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

export interface ManualGroupConfig {
  label: string;
  rows: ManualRow[];
}

export const MANUAL_GROUPS: ManualGroupConfig[] = [
  {
    label: "Infra \u2014 CDN & Payments",
    rows: [
      {
        name: "Payments integration",
        sub: "No Jira ticket \u00b7 BLOCKED by payments team since Mar 16",
        milestone: "ga",
        tickets: [],
        bars: [
          { cls: "b-atrisk", s: "2026-03-05", e: "2026-03-16", dl: "2026-03-16", ddc: "dd-amber" },
          { cls: "b-urgent", s: "2026-03-16", e: "2026-03-27", dl: "2026-03-27", ddc: "dd-red" },
        ],
      },
    ],
  },
  {
    label: "Beta \u2014 Enhanced Features (from release schedule)",
    rows: [
      { name: "Real-time notifications", sub: "No Jira ticket \u00b7 planned for Beta", milestone: "beta", tickets: [], bars: [{ cls: "b-beta", s: "2026-04-27", e: "2026-05-18", dl: "2026-05-18", ddc: "dd-purple" }] },
      { name: "Community-wide search", sub: "No Jira ticket \u00b7 planned for Beta", milestone: "beta", tickets: [], bars: [{ cls: "b-beta", s: "2026-04-27", e: "2026-05-18", dl: "2026-05-18", ddc: "dd-purple" }] },
      { name: "Community types (course/membership/free)", sub: "No Jira ticket \u00b7 planned for Beta", milestone: "beta", tickets: [], bars: [{ cls: "b-beta", s: "2026-04-27", e: "2026-05-18", dl: "2026-05-18", ddc: "dd-purple" }] },
      { name: "Basic analytics", sub: "No Jira ticket \u00b7 planned for Beta", milestone: "beta", tickets: [], bars: [{ cls: "b-beta", s: "2026-04-27", e: "2026-05-18", dl: "2026-05-18", ddc: "dd-purple" }] },
      { name: "Performance-based unlocking", sub: "No Jira ticket \u00b7 pass quiz to continue", milestone: "beta", tickets: [], bars: [{ cls: "b-beta", s: "2026-04-27", e: "2026-05-18", dl: "2026-05-18", ddc: "dd-purple" }] },
      { name: "Completion bonuses + certificate triggers", sub: "No Jira ticket \u00b7 planned for Beta", milestone: "beta", tickets: [], bars: [{ cls: "b-beta", s: "2026-04-27", e: "2026-05-18", dl: "2026-05-18", ddc: "dd-purple" }] },
    ],
  },
  {
    label: "GA \u2014 Commerce & Integration (from release schedule)",
    rows: [
      { name: "Billing integration (ThrivePay)", sub: "No Jira ticket \u00b7 needs payments unblocked", milestone: "ga", tickets: [], bars: [{ cls: "b-ga", s: "2026-05-11", e: "2026-06-07", dl: "2026-06-07", ddc: "dd-purple" }] },
      { name: "Upsells", sub: "No Jira ticket \u00b7 post-billing", milestone: "ga", tickets: [], bars: [{ cls: "b-ga", s: "2026-05-18", e: "2026-06-07", dl: "2026-06-07", ddc: "dd-purple" }] },
      { name: "ThriveCampaign integration", sub: "No Jira ticket \u00b7 planned for GA", milestone: "ga", tickets: [], bars: [{ cls: "b-ga", s: "2026-05-18", e: "2026-06-07", dl: "2026-06-07", ddc: "dd-purple" }] },
      { name: "Events (live sessions, Q&A, workshops)", sub: "No Jira ticket \u00b7 planned for GA", milestone: "ga", tickets: [], bars: [{ cls: "b-ga", s: "2026-05-25", e: "2026-06-07", dl: "2026-06-07", ddc: "dd-purple" }] },
      { name: "Enhanced analytics", sub: "No Jira ticket \u00b7 planned for GA", milestone: "ga", tickets: [], bars: [{ cls: "b-ga", s: "2026-05-25", e: "2026-06-07", dl: "2026-06-07", ddc: "dd-purple" }] },
      { name: "Study groups", sub: "No Jira ticket \u00b7 planned for GA", milestone: "ga", tickets: [], bars: [{ cls: "b-ga", s: "2026-05-25", e: "2026-06-07", dl: "2026-06-07", ddc: "dd-purple" }] },
    ],
  },
];
