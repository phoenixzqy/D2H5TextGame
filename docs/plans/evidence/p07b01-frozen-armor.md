# P07b01 — paid player Frozen Armor

Status: engine/native and qualified imported-fixture browser acceptance approved
by producer/QA. GD/TD approve the contract and engine source. Durable whole-packet
review and exact cleanup follow separately. Full private-v1/C0–C4/G0–G7 remain open.

A real paid Frozen Armor cast now grants captured ordinary defense and direct-hit
retaliatory Chill. Learning the skill or supplying its marker grants no power.
This slice does not establish earned progression, campaign/balance, new coverage,
CJK glyph quality, full mobile readability or accessibility acceptance.

## Contract and implementation

[Approved D05](../decisions/D05-frozen-armor-v1.md) specifies the exact authored/
canonical pair, finite positive integer maximum-valid-alias rank capped at the
authored maximum, and copied immutable tuning. Current cap20 and coefficient.03
produce3%/60% defense at rank1/20. Existing MP7/CD4 and rank scaling remain.

`7a95868` adds closed schema/definition/rank representation and optional combat
snapshot only. `9bdfdbc` separately makes two existing positive fixtures explicitly
rank1 while preserving their assertions. [BUG-058](../../../production/bugs/BUG-058-paid-frozen-armor.md)
records genuine behavioral RED before runtime changes.

`ed05766` activates exact authored opt-in and captures `{rank, defensePct}` only
on a valid paid cast. Shared capped rank controls cost/CD/potency. A bare marker
neither grants effects nor blocks the first paid cast. Active Armor does not
recast; positive rank changes or combo removal retain the paid snapshot.

Ordinary direct pre-hit defense is
`max(0, baseDefense * (1 + capturedBonus) * meltFactor * innerSightFactor)`.
Fractions remain until existing final damage rounding. MR, periodic rates,
authoritative stats and resources remain unchanged. A landed positive direct
hit chills its living attacker once after offensive statuses and before death
closure, including a lethal hit on the wearer. All direct types/thorns qualify;
misses/zero/periodic/reflection do not. Canonical Chill is reused with no extra
RNG draw, duration/speed/boss/cadence/refresh policy preserved.

`93022ee` refreshes native wave inputs using the same rank resolver. Zero/missing
allocation removes the snapshot and three exact player markers only from the
new input, including replay; stored carry/recording remain intact. Positive
allocation preserves captured potency, fresh gear refreshes base defense, and
new/repeat/flee/stop/death/reload cannot import paid Armor into another run.
No save field, migration, global tuning or general buff framework is added.

## Reproduction and frozen controls

Stage A schema RED has19failures/24controls. Missing-module capability failure
collects zero tests. Initial GREEN collection fails Ajv strictRequired because
the conditional requires mana without declaring its properties; a command also
names a nonexistent loader test path. Reviewed schema declaration and actual
`src/data/loader.test.ts` command yield421focused pass. Initial unit/type runs
overlap4.971s; evidence preserves them and the accepted gates rerun sequentially.

Stage B original and corrected genuine prepatch RED each have41failures/77controls.
The first GREEN retains one incorrect assumed RNG-next expectation. Its isolated
failure, source-derived correction and corrected prepatch RED remain preserved.
Type failures and later three forbidden non-null assertions are likewise retained;
reviewed type narrowing preserves every gameplay oracle. Final combat-test SHA256:
`84b1b5901452a502ef0dd5e1a53bcbf59cac09c5edb499bb1582259e8f428675`.

The complete2498-byte unaffected prepatch serialized recording remains frozen:
`7ca6d4c9d59d6d74ad9b50e86895acc855f8dccc6f241ddb1e4827f8e4b5c91a`.
The full event clocks/delays/teams/result digest passes before and after runtime
changes; deliberate stun/poison scaffolding is disclosed. Same-head deterministic
replay supplements this baseline comparison.

Stage C concrete drafts are independently corrected before their first execution
for actual regen ordering, terminal fractional carry, native Shaman firebolt versus
fixed weak-melee sources, real mercenary markers and actual lifecycle handlers.
Genuine frozen prepatch RED has10failures/10passing controls; unchanged GREEN
passes79focused tests. Native test SHA256:
`18f6f807efe67384a2147e496cf3202dc42c81ab30873262633c6e196b4ae1ed`.
It uses real Blood Moor seed7/ordinal0 and a genuinely paid cast at2000ms, with
explicit gear/registered finisher scaffolding. Coverage includes earned level-up
base-defense refresh, rank changes, no refill/repeated reward, replay baseline
restoration after unlearning/clamps, and actual victory/repeat/flee/stop/death.
These are native integration fixtures, not an earned campaign route.

## Production browser evidence

`562da72` adds a separate production-preview Playwright config/test. The validated
production dist is reused without rebuilding or debug bridge; `__GAME__` is absent.
Four cases cover English/Chinese ×1280×800desktop/360×640mobile, one worker,
zero retries, maxFailures1,50s/case and240s command plus2s exact-owned cleanup.
Only Date is fixed; native playback and the1500ms repeat timer remain active.

Ordinary create/export/import/equip/skills/map/combat/farm/save/reload controls
prepare explicit imported rank20, a cleared Moor flag and two synthetic rare caps.
The real equip path preserves1mHP, attack100022 and defense27. This disclosed
preparation enables bounded mechanic/idle evidence, not earned acquisition.
Read-only DOM observation is capped at256frames/eight log lines per frame.

Compact battlefield cards do not render effect chips. Independent pre-execution
review replaces that impossible witness with the actual localized buffApplied
log, without changing runtime/fixture/route. First execution passes Englishdesktop
then fails the Chinese expected name “冰封装甲”; authored and rendered name is
“寒冰甲”. The exact one-literal correction is reviewed; first failure remains.
The corrected attempt is interrupted at4.360s by an artifact-monitor lstat race
on a disappearing Chromium temporary path, with10 exact-owned TERM signals and
no survivors. It provides no gameplay verdict. Reviewed monitor-only correction
uses one no-follow stat/entry, ignores only individually vanished entries and
retains sibling counts, symlink rejection, errors, caps, deadlines and process
ownership. Eight helper checks cover those boundaries; original runner remains.

Final unchanged fixture/test/config pass4/4 in81.294s, no retries/skips/flaky cases,
stop/signals/survivors. Case durations19.135/19.774/19.040/19.845s. Each9–11frame
stream shows MP102→97, exact cast/buff, positive1damage→same-name Chill on a living
attacker. Name binding is rendered UI evidence; internal snapshot identity is
proved by native tests. Combo-off fresh runs have neither cast nor buff. Actual
native Skip completes all waves→victory→1500ms repeat→newW1 paid cast. UI stop
clears idleTarget; true save/reload retains exact player/inventory/map without
combat fields, then a fresh run casts again. All browser-errors arrays are empty;
no horizontal overflow is observed at the tested points.

Producer/QA independently decode the original attachments and verify16 extracted
records byte-for-byte. Mobile raster990×1760 reflects CSS360×640 at DPR2.75.
Enemies/log require scrolling on mobile. The host lacks Chinese glyphs; Chinese
DOM/copy/control behavior passes, glyph readability does not. No full mobile
readability/a11y claim follows this functional route. Representative PNGs,
observations, saves and failed screenshot/context are retained in the archive.

## Final validation

Final accepted commands run sequentially in the claimed worktree,
Node24.21.0/npm11.19.0. All exact commands, output and process metadata are indexed.

| Stage | Focused | Engine | Full unit | Types | Lint | Production bridge/build |
| --- | --- | --- | --- | --- | --- | --- |
| A representation | 421/3.386s | 1361/8.476s | 3645/62.584s | 11.295s | 28.013s | 8.726s |
| Positive fixture | 57/2.298s | 1361/8.613s | 3645/65.260s | 11.133s | 27.568s | 8.701s |
| B paid runtime | 238/2.452s | 1413/8.671s | 3697/66.568s | 11.006s | 28.418s | 8.943s |
| C native | 79/4.322s | 1413/8.587s | 3717/64.507s | 10.965s | 28.946s | 9.150s |
| Final browser tests | 4browser/81.294s | unchanged runtime above | 3717/171files/66.851s | 11.326s | 28.957s | unchanged validated dist above |

Existing engine3s/unit15s targets remain exceeded; Browserslist, chunk-size and
optional art-precache warnings remain. No new coverage run/claim. The bridge guard
scans four production chunks with VITE_E2E unset. Repository diff check passes.
Bounds remain focused30/engine120/unit120/types90/lint90/build210/browser240s,
plus2s exact cleanup;32MiB/log or report and64MiB aggregate RAW/dist/.vite.

## Durable evidence and remaining cleanup

[Packet](fixtures/p07b01-frozen-armor/packet.json) indexes371 safe regular records,
19,397,746raw bytes and adjacent4,567,779-byte archive, preserving all originals,
failures, source snapshots/freezes/reviews,49commands,569final source fingerprints
and5755recorded PID/startTick identities verified absent, without reuse. The
monitor-interrupted attempt is retained distinctly from passing gates.

Packet SHA256:
`f60271297e77288b91c8dae9a1d49889dbfa5ca32cc810abb5a8e5c2d36b0ab5`.
Archive SHA256:
`b233504c32b0c5fb3b00e7ff83dbb4d525931b41ce00004c267d60fcf5ee7f9b`.

After all browser readers/processes release,8 exact browser-temp files are
inventoried/deleted and absence verified. Root still owns exactRAW
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-frozen-armor-wtwinptx`,
760dist files and1.vite file until final packet readers release. The frozen
cleanup script revalidates every archive/RAW/output hash and process identity
before deletion. Pre-existing emptycoverage, tools/dependencies/shared caches,
source/history/evidence and the umbrella worktree are preserved. Original
checkout remains untouched. No remote publication or deployment.

Next source-only RAW:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-fire-mastery-3c7zf7mr`.
Root owns its reviewed runner, next-card proposal and frozen cleanup script;
no next-card product commands/source changes yet. P07a02A Fire Mastery needs
concrete plan/test review before implementation; later runtime/copy/browser
acceptance remains open. The complete private-v1 objective continues.
