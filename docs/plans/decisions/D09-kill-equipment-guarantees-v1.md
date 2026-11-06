# D09 — Additional live-kill equipment guarantees

Status: additional equipment guarantees implemented and verified locally;
full boss bundles and economy unaccepted. See [evidence](../evidence/p17-equipment-guarantees.md).

BUG680 and drop-tables §4.9/§5 require additional equipment independently of
ordinary Magic Find picks. Root owns this slice in the existing human2 worktree.
User constraints remain: affected checks only, no agents, installs, commits,
pushes, publication or CI. Security check: pass; local authored data and pure
reward generation only, no new file/network execution or permission change.

## Plan and acceptance

1. Reproduce missing guarantees with real production pools and compare each
   call with the same seed and the guarantee policy disabled.
2. Add a strict, precompiled JSON policy keyed by kill treasure-class ID.
   Andariel/Duriel add one rare+, Mephisto/Diablo two, Baal three; Diablo/Baal
   also add one set/unique. Goblins add one rare+. Each mini adds one rare+
   with probability0.5. Mini bonuses explicitly select from their act's trash
   equipment pool: Den of Evil's actual level4 precedes mini-act1's level7 band.
   Other guarantees use the killed monster's own table. Ordinary tables remain
   byte-for-byte unchanged.
3. Use a bounded weighted selection over eligible base/rarity pairs, equivalent
   to conditioning current MF/tier rarity probabilities on successful materialized
   rarity. Missing set/unique templates contribute to rare fallback for rare+
   only; set/unique guarantees require an eligible positive-weight template.
   Share eligibility with the materializer, and reject impossible configured
   rewards with MaterialRewardError rather than silently granting a lesser item.
4. Roll bonuses after the entire ordinary equipment/currency/wishstone reward.
   Thus an individually seeded call preserves its ordinary item prefix and all
   currencies exactly. Additional rolls advance the shared stream for later
   kills; historical campaign/reward results are not retroactively regenerated.
   Quest caches bypass live guarantees. No save schema change.
5. Verify the production counts, actual level bands, conditional selection,
   unavailable/zero-weight templates, impossible pools, 50% boundary, deterministic
   output, ordinary MF and quest-cache isolation. Freeze the old MF-only sample's
   policy explicitly so future imports cannot contaminate its historical scope.
   Run only affected loot tests, scoped types/lint and one isolated production
   build for precompiled-schema integration; no campaign or old browser replay.

Plan review: ready after resolving the level4 mini-boss source and historical
sample contamination above. Local review only; no independent approval claimed.

## Scope still open

The remaining boss bundle requirements (ordinary pick/jewelry counts, forced
rune/gem quantities, optional unique attempts, first-kill rewards), balance,
economy/pacing, native earned campaign viability and final integration remain
required under the umbrella goal. This slice does not claim their acceptance.
