# BUG-283 — Explain Amazon single-hit targeting and effects

- Severity: Medium — the generic skill panel omits rules needed to compare builds.
- Status: Fixed in `6ac13aa2`; focused/public/integrated checks and owned cleanup pass.
  Independent and earned acceptance remain open.
- Owner: root (frontend/native/browser); author evidence only, no independent approval.
- Reproduction head: `7dca3402`, Linux, Vitest/jsdom, en and zh-CN.
- Affected: Magic Arrow, Lightning Bolt, Fire Arrow and Cold Arrow skill previews.

## Reproduction

1. Mount the actual Skills screen with a constructed level30 Amazon, valid
   prerequisites and the selected skill at rank0,1,19 or20.
2. Select each of the four skills. Inspect its actual dynamic description.
3. Allocate19→20 through the ordinary button and inspect the resulting MAX text.

Expected: current-rank base damage, one living target, mana/cooldown and the
correct mitigation rule. Magic Arrow explains bow/crossbow and zero ammunition;
Fire Arrow explains landed Burn alongside the existing finite/stacking Burn
paragraph; Cold Arrow explains two-second, nonstacking,50% attack-speed Chill
and misses. These are existing production rules, not new damage tuning.

Actual: the description selects generic damage copy and discards the authored
identity. Cold Arrow has a generic applied-status label but no duration/slow
explanation; Magic Arrow loses its weapon/ammunition explanation. The40 new
UI assertions fail, while28 native combat controls pass. Expanded39 native
cases also pass, including finite Burn refresh/cap and real Chill action times.

## Evidence and bounds

Task owner root retains `amazon-draft-red2.log/json`, the original drafts and
`amazon-draft-causal.log/json` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-plague-payload-3qlrqw3s`.
The RED is40failed/28passed,16.939s; expanded native verification39passed,9.031s.
Both run against unchanged repository inputs. The earlier external draft had
a JSX module-resolution setup failure and three incorrect Magic Arrow numeric
oracles, retained in `amazon-draft-red.log/json`; these are not product defects.
Seed7's base roll0.06195825757458806 produces35/111 Magic Arrow damage, rather
than the draft's36/112. No engine damage was changed to satisfy that oracle.

Root cause: `dynamicDescription` uses the generic damage fallback for these
four identities. Fix that selection and bilingual source copy, reusing current
display stats and shared status configuration. Preserve authored weapon gates,
damage/status mechanics, saved fields and seeded RNG. Workaround: inspect
current numeric rows; those rows alone do not explain all effects.

## Correction and verification

`6ac13aa2` selects the four identity-specific bilingual descriptions using
existing runtime/display definitions. No combat tuning, equipment gate,
affliction, RNG or saved-field change was required. Final original RED:
40 preview failures with39 passing native controls (`amazon-preview-red-final`,
17.228s). GREEN:52 preview/control tests across two files (13.000s) and39 native
cases (10.146s); focused strict types and source lint pass.

`121fd691` adds public production acceptance:4/4 contexts pass (160.115s),
en/zh-CN on Chromium desktop/Pixel5. Each exercises all four MAX allocations,
priority selection and actual cast/positive typed enemy hit; Fire additionally
shows Ignite and positive enemy DoT, Cold shows Chill. Eight exact seven-domain
save pairs and four actual service-worker offline Continues pass. All1677frozen
inputs read back exact. Public types, explicit lint, production build,
six-chunk bridge scan and756-URL precache checks pass.

Full checkpoint against121fd691 passes18607tests/860files/two existing opt-in
skips812.782s,types113.204s/lint259.846s,all1677inputs exact before later engine
changes. All370archive members read-back verified;1897files/39directories
cleaned,remaining[]/failures[]. Four single-hit credits plus Plague yield179/
32/oneengine/onereview. Exact archive/sidecar paths and limits are in
[evidence](../../docs/plans/evidence/d04-amazon-single-hit.md).
Constructed fixtures do not establish earned builds,balance,independent QA or
full-v1 acceptance. Root retains evidence through full-v1 consumers.

Security check: pass for first-party local gameplay/UI/test work; no dependency,
credential, permission, CI, remote or genuine-save changes.
