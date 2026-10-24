# D05 — Assassin weapons and learned weapon passives / BUG176

2026-10-24. Implementation `a673b47`, baseline `c5a20f7`.
Locally implemented and verified. Independent acceptance, earned class/build
balance, C2–C4 and full G0–G7 remain open.

Explicit hero offhand selection now accepts authored one-handed weapons. Picker,
comparison, equipment transactions and runeword grants share base-aware slot
compatibility. Automatic equips target the main hand. Owned-instance authority,
requirements, capacity and two-handed displacement remain atomic. Both weapons
contribute through existing stat aggregation once; no extra attacks, RNG or save
fields were added. Mercenary equipment rules remain separate.

Six localized claw bases copy the existing sword tuning at levels 1/8/22/32/50/60.
The existing dagger art proxy is reused. Twenty-seven ordinary sword allocations
now supply 29 claw entries. Hand Scythe and Runic Talons share the existing claw
allocations in Act III/V trash. All 38 table totals and level bands are conserved;
recombining claw shares reconstructs the original tables. Forced unique/set rows
and legacy unique-base mappings retain their original values.

Claw Mastery adds 2.5% Attack and 0.5 percentage points of critical chance per rank
with a main-hand one-handed claw. Weapon Block adds 1 percentage point of physical
dodge and 0.5 points of magical dodge per rank with two distinct one-handed weapons
and learned Claw Mastery. Unlocks 1/12 and caps 20 come from strict copied JSON.
Exact aliases resolve maximum once; invalid allocations, classes, levels and gear
are excluded. Fresh composition affects the next wave without persisting bonuses
or refilling resources. Both locales describe the actual current/next bonuses.

## Verification

- Three native baseline reproductions failed before the foundations. Additional
  runtime/schema and bilingual UI causal failures preceded their fixes. Focused
  checks: 85 passes across 10 files; loot/quest checks: 138 across six files,
  including six actual seeded claw drops and 64 seeded Baal quest-cache claims.
  Strict data validation passed all 409 rows.
- Review found a duplicated main-hand-only rule in runeword grant resolution.
  Eight causal failures and 20 passing controls exposed missing Last Wish,
  Phoenix, Hand of Justice and Death grants, plus skipped recipe validation.
  Reusing the shared slot predicate fixes the cause. All 78 checks across six
  files pass, including native equip/preview, passive/active grants, duplicate
  reduction, exact recipes and unchanged atomic mercenary refusal.
- Final engine: **5,936 passed / 194 files**, 86.56 seconds.
- Final full: `npm test -- --reporter=dot`, **12,028 passed / 491 files**, two
  existing skips, 548.89 seconds. All 1,202 source/test/config hashes, HEAD and
  full Git state stayed unchanged throughout. Earlier pre-grant 12,017-pass and
  failed 11,998-pass/16-failure runs remain retained.
- Typecheck, standard lint and explicit lint of all 28 changed TypeScript paths
  pass. Production build with `VITE_E2E=false` passes; all four JS chunks pass
  all five repository bridge-symbol checks. Existing bundle/PWA-manifest warnings
  and test/performance budgets remain open.
- Final production browser: **8/8**, both skills × English/Chinese × desktop
  1280×800/mobile 360×640, with no retries, skips, flaky results or captured errors.
  All eight complete player/inventory/map/mercenary/formation Continue pairs were
  separately parsed and compared exactly. The report embeds 24 attachments,
  including 16 screenshots; two representative final images were inspected.

The initial full run exposed 16 failures. Five quest Claim/UI cases correctly
refused forced claw unique/set rewards without real templates. The correction
preserves the original forced-template rows and strict reward validation. It also
exposed two unreachable claw tiers, now supplied through ordinary drops. Three
earlier acquisition assertions incorrectly equated drop eligibility with equip
requirements; they were corrected against unchanged donor bands. Test-authoring,
type/lint failures and abandoned attempts remain in the raw archive. No required
assertion, guard or timeout was weakened.

## Retention and limits

[Fixtures](fixtures/assassin-weapons/) retain **184 raw files** and **44 terminal
process records**, with SHA256/size manifests and every archive member byte-verified.
They include source freezes, loot conservation, exact browser payloads and genuine
campaign identity. Cleanup removes only task-owned builds/browser/scratch output;
`cleanup.json` records the exact root, port 4458 closure and any failures. Shared
caches and the existing claimed worktree remain intact.

The earned Ancients save remains byte-exact at decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`,
nextNormal402. No genuine campaign action or diagnostic promotion occurred.
Inventory retains 213 IDs; only these two rows receive bounded-functional /
independent-acceptance-open status, leaving 187 unverified. Constructed browser
fixtures prove functional behavior, not earned acquisition, build viability or
balance. Root self-review only; no independent acceptance, remote publication or
deployment is claimed.
