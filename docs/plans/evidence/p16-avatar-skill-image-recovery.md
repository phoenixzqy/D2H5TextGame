# P16 — HUD portrait and skill-icon recovery

2026-11-05; BUG743 fixed locally, uncommitted, on human2 at
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes.

`Avatar` and `SkillIcon` permanently removed failed artwork. Both now reuse the
existing `useRecoverableImage` hook with source-identity keys. The hook remains
byte-identical. Image URLs, fallback appearance, fitting, geometry and accessible
names are preserved. No timers, cache busting, PWA or gameplay changes.

Three assertions reproduce the defect before the source edit. The original
two-file run has 50 passes/four failures; the fourth is the separate Raise
Skeleton preview's stale-Life assertion, retained for diagnosis. The selected
post-fix run has **11 passed, 43 filtered, zero failed**, counted from individual
assertion statuses because the Vitest 1 aggregate incorrectly reports 54 passes.
Explicit four-file ESLint and scoped strict TypeScript pass. Producer's source
review reports no material findings; this is not independent full-v1 approval.

Chromium147 verifies zh-CN/en ×360×640/1280×800: four cases/eight surface
observations. Ordinary UI creates a fresh character; no combat or injected
progress. Exact portrait/skill requests remain unavailable until restoration,
then actual browser offline/online reconnects recover decoded images at the
same URLs. Healthy neighboring images/controls remain mounted, the 72px skill
icon and HUD geometry stay stable, semantics remain decorative, and there is no
horizontal overflow or unexpected page error. Reconnecting after success adds
no replacement/request. Mobile fallback/recovered screenshots were inspected.

Two failed observer revisions are retained: the first lost HUD failure during
navigation/remount; the second did not establish the skill fallback at its
measurement point. The final observer blocks matching requests throughout the
unavailable period and records request events. These failures are not concealed
or counted as product passes.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-avatar-skill-recovery-zjof2q7o`.
It includes exact before/after source snapshots, `increment.patch`,
`source-sha256.json`, raw RED/GREEN/type/lint receipts, browser drivers/reports,
screenshots and `completion.json`. Browser driver is terminal with `closed:true`;
its task-owned Vite cache was removed and absence verified. Root retains this
exact evidence through umbrella acceptance and removes it after consumers finish.

Previous goal turn made progress by collecting the terminal four-case browser
result and cleaning the owned cache. This continuation records the verified
implementation and next diagnosis. Counts remain14/14 intended Normal,
210/210 supplemental sources and0/210 formal balance acceptance. Full private
v1, broader art/provenance/budget/PWA and app acceptance remain incomplete.
