# Bulk-discard counts — verified correction, 2026-11-03

The inventory toolbar previously built four candidate arrays just to display
counts. Retained mobile profiles attributed 19.480–19.817 ms to those selectors,
out of 25.386 ms inclusive toolbar work in the representative profile.

A pure single-pass count now shares the existing below-tier eligibility rule
with actual selection. Unique/set protection, both-ring comparison, missing or
slotless bases, explicit item level and fallback level remain covered. Actual
preview and discard behavior retain their current inputs and validation.

Five new count cases failed before implementation. All 35 affected cases pass:
17 selection/count, four bilingual toolbar, and 14 existing pagination cases.
Scoped strict TypeScript and explicit unignored lint pass. No engine, campaign,
earlier-act or full-suite checks were rerun.

One candidate browser round reused the retained baseline without retries:

| Context | Baseline ms | Candidate ms |
| --- | ---: | ---: |
| Desktop, English, 1× CPU | 120.201 | 118.762 |
| Mobile, Chinese, 4× CPU, observation 1 | 238.477 | 217.852 |
| Mobile, observation 2 | 246.584 | 254.856 |
| Mobile, observation 3 | 247.062 | 228.272 |
| Mobile median | 246.584 | 228.272 |

The fixed retention rule passes: mobile median improves 7.426%, and desktop
remains within the 10% regression tolerance. All four contexts preserve the
complete imported historical save, native/public successor save after one
transfer, surviving card identity and final-page access. Independently counted
52 normal / 0 magic / 8,484 rare / 819 below-tier candidates and localized
previews agree. Dialogs were canceled; no items were discarded. Screenshots
were inspected, with no overflow, page errors or console errors.

These are shared-host development diagnostics using Chromium 147.0.7727.15,
1280×800 desktop and 360×640 mobile. The timing boundary may precede debounced
saving. Mobile long tasks remain 93–117 ms, so BUG-592 stays open. This does not
establish full modal/accessibility, production-device or release acceptance.
The baseline predates nine separately verified Corpse Explosion paths; inventory
code and the earned save are unchanged between the timing baseline and this fix.

Exactly four declared source/test paths change. All 2,147 baseline production
inputs authenticate; 2,148 current inputs include the new toolbar test. Gameplay
data is unchanged. Current source authority:
`bug592-bulk-counts-v1-candidate.json`, source tree SHA256
`8c706b27dc60846783cfe9a19f442d212eda90a9633d150827fe44b314bdb9aa`.

Evidence closure:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/bug592-bulk-counts-v1-closure.json`
SHA256 `7daa0c61370c45f256d1ac2e8cbc11b272318d2a8016c117a0e576c5b4bd355b`.
It indexes 30 retained evidence files. All recorded processes are terminal and
absent; exact task-owned test/Vite caches were removed and absence verified.
Root retains this evidence and the claimed human-worktree-2 through umbrella
review and owns eventual cleanup/release.

No combat, training, campaign admission, quest or accepted balance cell occurs.
Act V remains 13/19; formal balance remains 0/210. BUG-611 and full private v1
remain open. Closed combat experiments and exhausted controllers stay closed.
