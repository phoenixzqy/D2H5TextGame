# D04 — Five Druid fire spells cause actual Burn damage

Runtime `67cdf76` authors explicit potency for Firestorm, Molten Boulder,
Fissure, Volcano and Armageddon; `435ceba` adds bilingual Burn rules to
current/next skill details. See [BUG190](../../../production/bugs/BUG-190-druid-fire-missing-dot.md)
and the [local contract](../decisions/D04-druid-fire-dot-v1.md).
Only these five rows receive bounded local functional credit. Independent
design/QA and earned class/build balance remain open; full private v1 is unfinished.

## Result

The five JSON rows now explicitly author `statusEffect.dotPctOfDamage: 0.1`.
This uses existing Fire Bolt as a provisional reference, not earned balance.
The existing adapter, Burn→Ignite identity and shared periodic runtime already
work; they required no runtime change. There is no global implicit rate.
Authored hits, rank growth, target sets, unlocks/prerequisite chains, rank-20
caps, costs and cooldowns remain unchanged. Molten Boulder uses the existing
first-two enemy area target; the other four hit all enemies. Spell damage
remains independent of weapon Attack.

A landed hit captures its final mitigated damage once. Each stack deals
`max(1, floor(finalHit * 0.1))` HP per second for three seconds, capped at five
aggregate stacks. Existing damaging Burn keeps its original rate on refresh;
a rate-less marker may adopt incoming valid potency prospectively. Existing
fractional carry, exact expiry, status combos and wave cleanup are preserved.
Misses spend normal resources but apply no Burn. Native current-class/unlock/
learned-rank/full-prerequisite authority and exact alias/MAX rules remain.
Save22 is unchanged and transient Burn is not persisted.

The pure display resolver reads authored metadata and shared Ignite defaults.
Both locales show rate, duration, stack cap and floor in current/next details,
including unlearned and MAX states. Separate Burn prose preserves existing hit
descriptions. It describes a rule based on final damage without inventing a
fixed final DPS. Already-authored Fire Bolt/Meteor also use this shared display;
neither gains additional skill-verification credit.

## Verification

At unchanged `ccf9762`, causal RED has **15 failures / 10 controls passing**:
the actual five registered spells at ranks 1, 2 and 20 hit and create a marker
but cause zero periodic HP loss. Schema/display RED records 50 failures / 26
passes; bilingual UI RED has 40 failures. All original logs are retained.
The old Firestorm rate-less production assertion is intentionally superseded
by the explicit contract. An explicitly rate-less registered copy retains the
no-global-fallback assertion and cleans up its registry changes.

Focused compatibility passes **535 tests / 14 files** in 41.172s. The engine
suite passes **6,813 tests / 237 files** in 82.062s. Five new files contain
195 tests covering data/schema, literal seeded rank hits, final HP/full expiry,
mitigation/increase applied once, actual one-point minimum damage, target sets,
exact cooldown boundary/basic fallback, mana/misses, legacy rate retention and
promotion, native authority/allocation, and bilingual current/next/MAX controls.
The later changes only correct structural test typing/lint; the final full run
includes them. Types (36.829s), standard lint (99.840s) and explicit
`VITE_E2E=false` production build (18.809s) pass. The four-JS-chunk bridge scan
uses retained `bridge.py`, equivalent to the repository forbidden-pattern scan.
The repository script does not support a custom output path and rebuilds `dist`,
so it was deliberately not used for this task-owned production build.

Final standard `npm test`: **13,198 passed / 571 files, two existing skips**; wrapper wall time **496.436**s.
All **1,293 source/test/config hashes**, **760 build hashes**, HEAD, Git status
and genuine-save digest match before/after. Every committed source blob matches
the validated snapshot. Two existing skips and the test-duration budget breach
remain disclosed; this pass does not establish performance acceptance.

Production browser cases pass **4/4**, en/zh-CN ×1280×800/360×640, with **20
actual spell combat entries**, zero page errors, eight exact five-domain
Save→close→new-page→Continue pairs and 20 geometry samples. Geometry covers
360×640, 412×915, 640×360, 1280×800 and 1920×1080, without horizontal overflow;
Allocate controls are at least 44px. Cases create a character and import a
**disclosed synthetic L30 / five rank-1 skills / five points / large-resource
fixture**. Public controls upgrade all five to rank 2 and select each for actual
Catacombs combat. DOM probes observe periodic logs and damaged living enemies.
Native combo options retain authored IDs while saved rank keys and cast IDs are
canonical; eight exported player/inventory/map/mercs/formation pairs are exact.
These fixtures earn no campaign, loot, pacing or class-balance acceptance.

All 16 screenshots were individually inspected. Desktop combat images show
Ignite and damaged enemies; mobile combat viewport images show the header/hero
with targets below the fold. DOM evidence, not mobile combat pixels, establishes
target damage. Existing header/nav occlusion, nested/below-fold panels, icon/font
fallback, shared generic DoT FX and full accessibility/PWA/performance remain open.
The build's chunk, generated-manifest precache and Browserslist warnings persist.

Initial Ajv strictRequired, Fire-defense fixture, exact hit-description, authored
priority/canonical cast, timestamped synthetic identity, exclusive on-hit union,
exact optional-property and lint failures are retained with their corrections.
The initial browser fixture chose canonical option values where the public UI
uses authored values; the corrected run uses localized labels and separate
artifacts. No assertion/timeout was weakened and no test newly skipped. The
first browser-audit wrapper overwrote its derived report with a command receipt;
the same retained exports were re-audited into separately named report/receipt
files, without replaying gameplay. Root source/visual/attachment self-reviews
are not independent acceptance.

## Scope and continuation

Only these five inventory rows change. All 213 IDs and their order remain:
**141 unverified / 70 bounded-functional / one bounded-engine-functional /
one review-needed**. Proof scopes differ; this is not overall game completion.
Stale alias/metadata warnings are cleared only on these proven rows.

Genuine Ancients401 decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`
is unchanged: L33 / XP149261 / 23682 gear / nextNormal402 / Nightmare0,
Ancients/Rite claimed, **Baal uncleared**. No genuine campaign or remote action
occurs. C0/C1 retain their original narrow acceptance; C2–C4, all213 skills,
earned builds/economy/pacing/endgame, independent QA and full G0–G7 remain open.
Root remains sole writer; the umbrella goal/worktree/branch/claim stay active.

## Retention and cleanup

[Manifest](fixtures/druid-fire/manifest.json), [raw archive](fixtures/druid-fire/raw.tar.gz)
and [cleanup receipt](fixtures/druid-fire/cleanup.json) retain original failures,
commands/results, exact scripts/fixtures, browser exports/screenshots/traces,
freeze hashes, self-review and committed-source proof. Every raw member is
byte/hash verified before exact owned scratch/build disposal. The disposable
760-file production build is represented by its complete frozen hash map.
Only verified owned server PID78408 was stopped; port4477 is closed. Earlier
required campaign evidence, source/history, shared caches and umbrella checkout
are preserved. Retention and cleanup are terminal: all 143 raw files and 20 command-result receipts are byte-verified in the archive; 903 exact owned files were removed. Scratch is absent, port4477 is closed, remaining paths [] and failures [].
