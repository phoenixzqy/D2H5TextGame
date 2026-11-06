# BUG-621 — Enable intended campaign signatures at their early unlock

Status: Fixed in working tree (uncommitted; no fixed commit SHA). Severity: Medium. Owner: root (campaign policy).

## Verified resolution — 2026-11-03

Fire priority now includes Inferno before Fire Bolt. Both Barbarian target
lists buy rank-one Double Swing before optional Shout. Three native sequential
level-five/six cases verify unlock exclusion, allocation, projection, payment
and positive damage at the signature cast's timestamp. The final affected run
passes seven cases (three signatures, four decoy cases), scoped strict types
and explicit lint. The earlier 154 unaffected passes are retained; 161 distinct
cases are covered across the two runs, not by a fresh full-suite invocation.

The three earned reruns execute their repaired skills but all still stop in
the Den. This closes the missing-signature policy defect only; progression and
balance remain unresolved. See the [acquisition report](../../docs/balance/2026-11-03-intended-act1-acquisition.md)
and retained `p15-early-signatures-v3-*` / `p15-first-entry-early-repair-v1-*`
evidence. Production combat and game data are unchanged.

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production tree
`8bf6b59060bf9920a8f97a7fa0cc5236780c43938816ce81fdf315b9cdf315a0`.
Environment: Node/Vitest native campaign services; browser, viewport and locale
are not applicable. Creation timestamp: `1793469600000`; native admission seeds
derive from area and accumulated logical time, recorded in each journal.

1. Run the intended Fire Sorceress or either intended Barbarian through the
   existing level-six Blood Moor opening, allocating native points sequentially.
2. Inspect the allocated ranks, projected combat order and settled-wave events.
3. For Fire, inspect Den admission 40 and recovery admission 41. For either
   Barbarian, inspect Den admission 40 and recovery admission 45.

Expected: Fire can cast its purchased Inferno at six. Both Barbarian profiles
prioritize their available early Double Swing signature before optional Shout.
Neither policy should require extra points, a reset or a level-seven grant.

Actual: Fire has Inferno 1 but the declared rotation omits it; every recorded
hero action in those losses is Fire Bolt. Both Barbarians buy Shout with the
level-six point, leaving Double Swing unlearned; they cast only Howl and Bash.
All three runs stop during bounded opening recovery at six. These policy defects
are demonstrated; they are not established as the sole causes of those losses.

## Evidence and cause

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
The original `p15-first-entry-intended-act1-v1/` reports and journals are retained.
`p15-first-entry-intended-act1-v1-readback.json` independently reconciles all
13 cases, including all failures, native saves, spending, rewards and source.

`tests/campaign/intended-growth-v1.json` omits Inferno from Fire priority and
orders Shout before Double Swing in both Barbarian allocation lists. Existing
rotation checks cover levels 12/32 and miss these level-six boundaries.
Zeal at six is correctly filtered by its level-twelve unlock and is outside
this bug. Production skill mechanics and numerical balance are unchanged.

## Planned verification

Add level-five negative controls and level-six native allocation, projection,
paid cast and damage checks for all three profiles, then correct only the
omission and target ordering. Run affected growth/profile regressions, scoped
strict types and explicit lint. These constructed checks use supplied XP and
do not establish earned acquisition, survival, typicality, pacing or balance.
