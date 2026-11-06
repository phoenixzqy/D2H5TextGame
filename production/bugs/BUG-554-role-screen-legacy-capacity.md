# BUG-554 — Preserve lossless over-cap inventories in role diagnostics

Status: Fixed and locally verified; external diagnostic adapter only, uncommitted.
Severity: Medium; the game already supports lossless over-cap reward ingestion.
Owner: root, measurement/QA.

## Reproduction

Worktree `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`;
production source hash `3ec0567f2eb3b29ecdc4d929d0e24b16d7bef11d5cfa84965860f9c24f3bd82c`.
Node native production-path diagnostic; no browser, viewport or locale dependency.
Evidence packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Execute frozen `p15-build-act-role-screen-v1.ts` using its retained spec.
2. Its first four Bow trials complete and retain compressed native records.
3. Restore `p15-necro-skeleton12-earned-continuation-v1.json`, which owns3084
   backpack items and an empty stash. Prepare seed1 of Act I trash.
4. The driver requires at least12 free nominal backpack slots and moves items
   to stash. At stash500 the next native transfer correctly refuses; the driver
   incorrectly treats this as a required measurement failure.

Expected: preserve all earned items and use the game's existing lossless award
path for legacy over-cap sources. Stash-only preparation is optional and cannot
be a universal admission requirement. Retain all completed trials on failure.

Actual: the external driver aborts with `false !== true` before that area's
combat admission. Its four preceding completed trials remain on disk; no earned
campaign state or income advances. Larger sources include61123 backpack items.

## Evidence and cause

`p15-build-act-role-screen-native-v1-exit.json` is terminal, exit1;
matching log/progress and four native `.json.gz` records preserve the failure.
All52 conditional XP forecasts remain level-matched. The failure is the
adapter's capacity assumption, not combat or XP forecasting.

`src/stores/inventoryCapacity.ts` defines nominal limits for manual transfers;
`inventoryStore.addItem` intentionally retains earned items beyond those limits.
The diagnostic copied a stash-only policy suitable for smaller checkpoints.
Its fixed2MB raw-record budget also needs to account for the authenticated
source's existing inventory footprint before any new combat starts.

## Resolution and verification

`p15-build-act-role-screen-v2.ts` freezes source-aware capacity handling before
new outcomes. When stash cannot free12 nominal backpack slots, retain both
original containers and use native lossless ingress. Its raw-record budget
accounts for the authenticated source footprint. No destruction/spend or store
injection. Four completed v1 trials are reused;100new trials/491waves complete.

`p15-build-act-role-screen-v2-readback-v3.json` passes104trials/513waves, including
28lossless-overflow trials and the61123-item source. Exact source custody,
unchanged preparation costs, all native award identities and party carry pass.
Entry-life checks preserve automatic Barbarian passives and Oak Sage's no-heal
capacity projection; earlier false-positive reader receipts remain retained.
Both adapter versions pass strict scoped types/focused lint. Closure:
`p15-build-act-role-screen-artifacts-v1.json`; failed original receipt retained,
all owned processes terminal and exact disposable configs/caches removed.

No production source change, commit or historical campaign replay. This fixes
diagnostic admission and retention; it supplies no final balance acceptance.
