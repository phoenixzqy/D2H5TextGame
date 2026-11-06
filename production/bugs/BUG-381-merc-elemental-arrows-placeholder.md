# BUG-381 — Mercenary elemental arrows ignore weapon damage contracts

- Severity: High — two recruitable signature skills use scalar placeholders.
- Status: Open — native repair verified; broader acceptance pending.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained native delivery, Frozen Armor, Pilfer and verified Blessed Aim changes in the claimed worktree.
- Environment: native Vitest/Linux; no app/browser/viewport execution.
- Locale: mechanical repro is presentation-independent; zh-CN/en skill and recruitment copy aligned.
- Seeds: Fire7, Cold3.
- Owner: engine-dev; content/writer for authored tuning and zh-CN/en copy.

## Reproduction

1. Load actual mercs/act1-rogue-fire or mercs/act1-rogue-cold from the authored pool; call createMercFromDef and mercToCombatUnit.
2. Retain the native skill bar and set signature rank1/20. Use imported survivor pools, Attack10, zero crit, zero target defenses/resistances and held hostile targets. Arrange primary at1,1; left1,0; right1,2; up0,1; diagonal0,0.
3. Run recorded native battles and inspect the first signature shot, committed statuses and delegated real seeded probabilities. These constructed survivors are not earned progression.

Expected: one base22 roll plus Attack10 gives P32. Fire retains physical32 plus Fire16 on primary, Fire16 on up to2 additional adjacent hostile bodies, and authored Fire-only Burn for3000ms at max(1,floor(.1*finalFire)) HP/sec per stack. Cold yields physical16+cold16 with one30% Chill proc; seed3 procs a2000ms canonical Chill. Both ranks share mana0/CD2/flat potency.

Actual native causal RED: all four rank1/20 cases fail their intended first-shot damage arrays. Fire emits only Fire25 on primary, rather than physical32+Fire16 and two Fire16 splashes. Cold emits only cold25 instead of physical16+cold16. No setup, collection or timeout failure. Registry aliases supply scalar Fire/Cold base25–40/CD1, no snapshot Attack contribution, no additive physical component or Fire splash, and guaranteed placeholder Cold status.

Root cause: Fire/Cold native authored rows are not resolved into the final runtime registry, and the existing normalized weighted pipeline lacks the explicit Fire1+.5 budget and Attack-sharing/splash adapter.

Supplemental first-combat check (`arrows-combat-first`) also exposed premature
rounding of a derived fractional Fire splash by `scalePerRank`: an18.5 payload
became19 before a secondary critical, yielding38 instead of37. The private
splash input must preserve its already-rolled fractional base. The same run
contained independently identified test-fixture errors in seeded accuracy,
flat-defense expectations and personal-armor authority; failed predecessors are
retained separately in the packet and are not runtime defect evidence.

## Native repair checkpoint

The two actual authored arrows now use the selected physical/elemental budgets,
shared primary accuracy/base/critical, Fire cross splash and component-bound
Burn/Chill. Snapshot Attack is shared correctly. Derived fractional splash stays
unrounded until ordinary critical/mitigation. Native ranged Aim/contact rules,
paid Enchant exclusion and genuine paid mercenary Armor negatives are covered.
Both locales, recruitment lore and the gacha design rows agree.

Final ordinary units pass 21,883/21,883 tests across 1,032 unique permitted
files, including all 11,942 engine tests / 443 files; zero failed/pending/todo.
Focused245/7 and Vengeance16/1 pass. Strict types, full zero-warning lint/engine
purity and boundary audit pass on unchanged2,129-input map
`c15fef6eee49a18560aabb01e77c9dded26e77dd0778a4bb18e0ada7d98f4953`.
The production build passes on predecessor map
`4d68bbff7765ded4a60dc51c279582075d3a2d0ff0e2b59cb2cb3211da17e726`;
only the three approved test files changed afterward. No fresh build, timing
budget, browser, earned-play or full-v1 acceptance is claimed.

[Native evidence](../../docs/plans/evidence/merc-elemental-arrows.md) records
all failed predecessors, independently reviewed exact corrections, final
command/report/map/environment binding and retained limitations. This verifies
native mechanics only; earned play and broader acceptance remain unverified.

## Evidence and retained boundary

Original pre-repair primary src/stores/merc-elemental-arrows-primary.test.ts SHA2560e60c70c6492850fff72962224e9a575839659bc16210f5609fe93123fd7552d. Native causal RED exits1 in9.617424s with unchanged2126-input map fc2342e2728aa13e5713a71242d20ea2cf4b12b42668a2b06f4bef15f39655a6; report SHA25641032c910b04b5ce541b14a6b98ede4112c94ee6e80a71f6255c8d15ad240276. Required packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-elemental-arrows-kuokdas2. The original RED/freeze remains retained. First GREEN passed all literal damage arrays and both Cold cases, but both Fire cases failed an incorrect committed-status filter. Independently reviewed v2 corrects only burn→ignite, SHA256770d2beff4242b71c71779fe86e9a8b15e05701375d0f28c1e759380f4796c06. A second independently reviewed typing-only V3 removes the unnecessary optional chain on required skillOrder, SHA25677619973d1ea4b3d122bcbdb3c0b794a74df57493358e52c3811d69b61859f46. Original RED applies to unchanged damage assertions; V2 and V3 were not executed in the original RED. Reviewed typed status assertions and Vengeance opt-in list correction preserve damage/status expectations. Failed broad-engine/lint predecessors remain retained. No production alias workaround. Driver4058330 and npm4058343 are absent.

H3 remains terminal H3_PREREQUISITE_FAILED_NO_APP. No app/browser/alternate retry, protected fixture, diagnostics/closed matrices, new acquisition/lineage/gameplay replacement experiment, remote/deployment/worktree operation or new agent is authorized. BUG180/366 timeout recurrence stops source continuation. Campaign/economy/14-build viability/pacing/defeat-retry/device/locale/a11y/performance/PWA/actualCI/human/soak/full-v1 acceptance remain unresolved. Root retains required evidence and owns eventual exact-path cleanup.
