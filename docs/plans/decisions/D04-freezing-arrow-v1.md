# D04 — Freezing Arrow secondary Freeze

2026-10-25. Initial BUG201 contract authored before runtime/data edits; the final
15% source-review correction is recorded below. Root is
sole writer/author reviewer; independent design/QA and earned balance stay open.
No mechanic credit until integrated proof and committed-source verification.

Preserve Cold50–70/+5 per rank,20MP,2second cooldown,unlock30/cap20 and native
Cold Arrow→Ice Arrow prerequisites. Keep existing `box-3x3` geometry and ordered
target selection, including original unpositioned fallback. Add explicit
`additionalStatusEffects:{freeze:{chance:0.15}}` to the existing JSON row. The
existing closed schema, adapter and ordered status loop already support this;
do not add another runtime branch or guess defaults for other status tails.

Fifteen percent preserves the existing `docs/design/skills-spec.md` Amazon
Freezing Arrow row. The earlier10% draft borrowed Frost Nova's probability and
was superseded during source review; reusing its runtime model does not justify
retuning this skill. Neither the six original nonfreezing hits nor this repair
establish canonical D2 or earned balance acceptance. Each landed target takes one ordinary
Cold hit, then ordinary Chill, then an independent15% Freeze roll. A miss pays
the ordinary cast cost but draws/applies neither status. Status-before-death
ordering stays intact. The new secondary draw intentionally changes subsequent
RNG for this skill; unchanged nonopted rows/recordings must remain exact.

Use existing lifecycle defaults: Chill2000ms/half effective attack speed,
Freeze1000ms ordinary or500ms boss/chapter-boss, exclusive expiry and normal
refresh/cadence reconciliation. Neither duration nor probability scales with
rank. No new duration field, stats, movement, resource refill or save migration.
Native class/unlock/rank/MAX/prerequisite authority remains the existing shared
projection. Existing control effects, target deaths and original identity stay.

Both localized descriptions must state actual3×3 area,15% per landed target,
Chill2seconds and Freeze1second/boss0.5seconds. Read probability from loaded JSON
and durations from controlling status defaults; ordinary current/next/MAX damage
previews remain. Do not remove the advertised Freeze or retain stale cone copy.

Verification: native rank1/20 causal RED before the JSON change, actual successful
and failed procs, real suppressed actions/HP, exact ordinary/boss expiry, primary
Chill after Freeze, miss/kill/dead exclusions, independent multi-target rolls,
geometry, one payment, cooldown, legal aliases/class/unlock/prerequisite refusal,
immutable replay and unchanged sibling registrations. Bilingual UI0/1/19/20 and
public production allocation/configuration, localized positive Freeze/logs,
Save-close-new-page-Continue and five-size geometry. Fixtures are synthetic;
no genuine campaign action or new earned class/build claim.

Run focused/data/engine/full/typecheck/lint/production build and final browser
checks. Freeze tested source/build/genuine state; verify actual committed source
blobs. Retain original failures separately from fixture mistakes; archive hashes
and remove only verified task-owned scratch/processes after all consumers finish.

Author security check: pass. Local JSON/UI/tests only; no credential/network/
dependency/permission/CI/persistence expansion. Author plan review: ready after
explicitly including real suppression and exclusive boss expiry, shape/copy
consistency and intentional RNG divergence. Root-only preference overrides skill
delegation suggestions. Full C2–C4/G0–G7/privatev1 remains unfinished.
