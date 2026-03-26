# LearnV3 Delivery Timeline — Change Log

## 2026-03-26 — Major Rebuild

### What We Did
Rebuilt the gantt chart from scratch by cross-referencing three data sources:
- **Jira LMSV3** (ltv8.atlassian.net) — ticket statuses, resolution dates, epic structure
- **GitHub thrivecart/LearnV3** — PR merge dates, actual development timelines
- **Jira LMSAI** — checked for historical planning data (defunct, last updated Dec 2025, not useful for timelines)

### Key Findings

**The original gantt's ticket-to-label mapping was almost entirely wrong after LMSV3-609.** The Jira stories follow a strict E0-S1 through E9-S4 naming convention. Examples:
- 619/620 was labeled "Gamification panel + preview" → actually "Access requests + invite codes"
- 621/622 was labeled "Go-live + take offline" → actually "Invite codes + gamification preset"
- 623 was labeled "Universal student profile" → actually "Gamification preset override"
- 630 was labeled "Global leaderboard" → actually "Student Profile card"

**LMSV3-604 (Analytics service) was incorrectly shown as Done** — it's actually in PRD/TODO status with zero PRs. Replotted as needing scoping.

**All 602-640 tickets were developed in ~5 days (Mar 12-16)**, not the months shown in the original gantt. The original dates were aspirational, not actual.

**9 tickets (632-640) were completely missing** from the original gantt — Student Onboarding E8 stories and Platform Badges E9 stories.

**Major work streams not on the original gantt:**
- Auth System (LMSV3-919) — 12/12 Done
- Course Management (LMSV3-457) — 80 stories, ~85% done
- Student Course Display (LMSV3-984) — 6/6 Done
- Lesson Blueprints (LMSV3-934) — Done
- Media Library / Piktochart (LMSV3-992) — In Progress
- Quiz UI/UX Rework (LMSV3-869 + 880) — see decision below
- ThriveCart Integration (LMSV3-1019) — 16 stories, just started

### Decisions Made

1. **Scope:** Expand gantt to cover all active work, not just Communities (602-640)
2. **Granularity:** Epic-level rows for new items, story-level for existing Communities work
3. **Date source:** Use actual dates from GitHub PR merges and Jira resolution dates
4. **Quiz 869/880 labeled as "UI/UX Rework"** — investigation showed the core quiz system (schema, grading, builder, runner, video quizzes, assessments) is fully built across 30+ completed tickets. The 869/880 epics are a UX modernization pass (inline card editing, consolidating 9 quiz-lab variants to 4 modes) created by Fabio on Mar 22. Not a rebuild.
5. **Quiz "Blocked" status is mostly stale** — at least 2 tickets (870, 872) have merged PRs but were never transitioned. A Heartbeat bot failed 686+ automated attempts on LMSV3-870 without resolving.
6. **LMSV3-604 replotted** — teammate flagged that PRD items shouldn't show as "overdue". Changed to blocked/needs scoping.
7. **Planned bars removed** — Stephanie said they looked ugly. Originally showed dashed outline bars with the old gantt's aspirational dates vs actual dates.
8. **No Post-GA items** — Stephanie said too far out. Added disclaimer instead.

### Features Added to the Chart
- **Clickable Jira links** — single ticket = direct link, multiple = modal picker with all tickets
- **Milestone filter pills** — All, Done, Alpha, Alpha 2, Beta, GA
- **Disclaimer banner** — "This release schedule is scoped to Beta, and subject to user testing feedback. Post-GA iterations are TBC."

### Bug Fixes
- **Bar alignment** — bars were in a different coordinate system than phase flags and today line. Flags used % of full canvas width, bars used % of track width (after 220px label). Fixed by putting flags in a `.chart-overlay` container offset by the label width.
- **"1d overdue" on Done items** — Done bars now show "Done · 25 Mar" instead of countdown.
- **Active bars stopping at today** — bars now extend to their deadline date so the today line sits correctly relative to in-progress work.

---

## 2026-03-26 — Confluence Cross-Check

### What Happened
Stephanie flagged that future items from the Confluence "Release Schedule by Test Group" page were missing. She said: "I don't want people thinking it's been done if it's not on the future plan."

### Confluence Page
Source: `ltv8.atlassian.net/wiki/spaces/TLL/pages/962887685/Release+Schedule+by+Test+Group`

Phase dates confirmed:
- Alpha: w/c 30 March (first intake)
- Alpha 2: 14 April (revised 25.03, second intake)
- Beta: w/c 27 April (dependent on Alpha feedback)
- Student migration: Early May (30-50 creators, staggered)
- GA: End May (post-Beta, dependent on feedback)

### Alpha Cross-Check Results
Investigated 10 Alpha items from Confluence against Jira + GitHub:

| Item | Status | Notes |
|------|--------|-------|
| Community Home Activity Feed | DONE | Core feed, schema, reads, mutations all merged |
| Sidebar Navigation | DONE | Collapse, branding, skeletons, polish merged |
| Discussion System + @Mentions | DONE | Schema, highlighting, bug fixes resolved |
| Moderation Tools | DONE | Queue, flagged posts, bans, service migration merged |
| Creator Announcements | DONE | Via pinned posts system |
| Reactions System | DONE | Schema, toggle, service migration. 2 minor polish bugs remaining |
| Direct Messages | DONE | Inbox, group chat, pin/delete, navigation merged |
| Lesson Discussion Integration | IN PROGRESS | Base works, lesson-level thread linkage (971) in PRD |
| Leaderboards | IN PROGRESS | Core UI done, enhancement tickets (filters, visibility) in PRD |
| Non-real-time Notifications | IN PROGRESS | Toasts + celebration modals done, full Notification Center (31) in PRD |

### Items Added
**Beta — Enhanced Features (6 rows, no Jira tickets):**
- Real-time notifications
- Community-wide search
- Community types (course/membership/free)
- Basic analytics
- Performance-based unlocking (pass quiz to continue)
- Completion bonuses + certificate triggers

**GA — Commerce & Integration (6 rows, no Jira tickets):**
- Billing integration (ThrivePay)
- Upsells
- ThriveCampaign integration
- Events (live sessions, Q&A, workshops)
- Enhanced analytics
- Study groups

**Alpha Gaps (3 rows with Jira tickets):**
- Lesson discussion integration (LMSV3-971)
- Leaderboard enhancements (LMSV3-20 epic)
- Notification center (LMSV3-31 epic)

---

## Files

- `index.html` — current gantt chart (deployed via GitHub Pages)
- `index-original.html` — preserved original gantt for comparison
- `CHANGELOG.md` — this file
