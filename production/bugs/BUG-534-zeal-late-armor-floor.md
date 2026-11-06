# BUG-534 — Let ranked Zeal benefit from earned Attack

Severity: High. Status: fixed in the working tree; full balance/fidelity acceptance remains open.
Owner: root (game design/content/QA responsibilities in the current sole-writer run).

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, dirty retained worktree.
Environment: Node24.21.0 native production-store simulation, no browser/viewport;
locale-independent combat values. Seed:3064741450 (Outer Steppes wave0).

1. Load accepted `p15-paladin-zeal-act3-complete-continuation-v1.json` from the
   retained `d2-counted-source-z3jj3xa1` packet:28/172199XP/next310, Zeal20,
   Attack342, owned Prayer24 and all40 paid insertions.
2. Execute `p15-paladin-owned-area-forecast-v8.ts` with the retained
   `p15-paladin-zeal-act4-outer-forecast-v1.spec.json` Cleansing candidate.
3. Read its completed first row in the retained `.rows.jsonl` (later candidate
   fails an independently recorded aura-ID input error; original row survives).

Expected: allocated late ranks and earned equipment sustain the advertised
Zeal cleave against later-act Defense. The three-target/cost/cooldown rules stay.
Actual: wave0 draws60s with494HP;58 hero damage events remove only1HP.
Holy Freeze also draws; Might loses at39.953s. Basic-attack substitutes do not
prove a working Zeal build.

Root cause: capped flat116–136 damage lacks any Attack contribution, so later
Defense117–142 (plus physical resistance) floors many hits. More attributes,
weapons or sockets cannot improve Zeal's fixed base. The existing JSON rank-
Attack pipeline already solves this for Bow/Double Swing/Double Throw.

Evidence: retained `p15-paladin-zeal-act4-outer-forecast-v1.rows.jsonl`,
`p15-paladin-zeal-act4-outer-forecast-v2.json` and wrapper receipts/logs.
Contract: `docs/plans/decisions/P15-zeal-rank-attack-growth-v1.md`.
Regression: `src/engine/skills/zeal-attack-growth.test.ts`.
No commit, publication, full build-matrix or balance signoff is claimed.

## Fix verification

Zeal now authors20percentage points of Attack per allocated rank above1.
The schema allows and requires this existing field for Zeal. Registration,
combat and current/next/MAX previews reuse their existing data consumers.
No shared engine or UI logic changed; rank1 base/cost/CD/targeting remain.

Eight focused regressions fail before the fix and pass after it. The74affected
cases (Zeal growth, existing target cap/control, Double Swing and Double Throw
schema controls) pass; scoped strict TypeScript and lint pass. The old targeting
test's literal damage bounds now include its fixture Attack1 contribution.

The original Outer wave0 draw becomes22.392s with the same earned character
and gear. Native310 clears all five Outer waves with exact forecast agreement.
Native312 clears Plains and defeats Izual with Zeal throughout, paid owned
weapon improvement and preserved earlier loss. Independent new-only readers
pass source/custody/income/quests/clocks/points/mercXP. Restored comparisons and
old campaign clears are not promoted to full current-head build acceptance.

Exact before-source bytes and successor hashes are retained in
`p15-zeal-growth-source-binding-v1.json`; failed RED and diagnostic results
remain in the root packet. No commit/publication/broad suite/browser/CI run.
