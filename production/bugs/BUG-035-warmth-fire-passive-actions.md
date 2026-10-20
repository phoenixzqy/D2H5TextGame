# BUG-035 — Apply composed fire bonuses and exclude passive actions

- **Status:** Reproduced; P07a01d runtime fix pending.
- **Severity:** High; learned Warmth promises a fire bonus which combat ignores,
  and imported passive combo entries consume an action.
- **Owner / systems:** engine integrator; direct damage input and shared skill
  eligibility in `src/engine/combat/combat.ts`.
- **Build:** accepted adapter input `1860bc63fd7097bed64ee60a77b57478c3e812d0`.
- **Environment:** Linux / Node24.21.0 / Vitest engine project; no browser,
  viewport or locale is involved in this pure deterministic reproduction.
- **Seed:**7; real registry Fire Bolt, composed Sorceress Warmth rank20.
- **Contract:** `docs/plans/decisions/D05-warmth-recovery-v1.md` and accepted
  D04 fire-family potency/stacking behavior.

## Reproduction

1. Compose a learned rank20 Sorceress Warmth fire modifier using the real pure
   composer. Supply that frozen modifier, rank20 actual Fire Bolt, MP8,
   AS100/zero crit, and a held target with HP500/zero defense/resistance/dodge.
   Hold the caster from1701ms to isolate its first1700ms cast and full burn.
2. Run the actual `runBattleRecorded` with seed7; repeat recorded/unrecorded
   and compare immutable snapshots/registry definitions.
3. Put either actual Warmth alias before actual Fire Bolt in imported combo
   order, then run the same battle. Separately use Warmth-only order.
4. Run `npx vitest run --project engine src/engine/combat/warmth.test.ts
   --reporter=dot --silent` against the tests-only worker input.

## Expected and actual

Seed7 main-stream hit/range/crit/status draws produce base106. Rank20 Warmth
adds20% in increasedPct before combo/crit/resistance/mitigation/floor: direct127,
new burn rate12, periodic20@3400ms+16@4700ms, finalHP337. Actual direct106,
periodic17+13, finalHP364: frozen modifier is ignored. Rank0/1/2/20 expected
hits106/107/108/127 remain literal, independent of implementation output.

An authored passive never consumes an action/resource/CD/buff, even forged into
combo order or summon-on-start. Actual imported Warmth casts at1700ms, adds a
buff and leaves MP8 instead of allowing Fire Bolt to spend8 and deal damage.
Warmth-only order should fall through to physical basic attack. Exact trigger
classification must preserve active Frozen Armor, undefined-trigger legacy
merc aura stubs and literal synthetic trigger:aura behavior. This fix does not
implement Paladin auras, other masteries or regeneration.

## Evidence and root cause

Frozen tests-only baseline at09:00:11UTC: **22failed/16passed/38total**, exit1,
1.30s (wall2.626s). Engine at09:00:14UTC: **22failed/758passed/780total**,
48files, exit1,4.38s (wall5.738s); existing3s budget exceeded. Typecheck exit0,
wall8.919s. Existing registry+skill-resolution baseline113passed1.26s.

Only new `warmth.test.ts`369lines changed. Runtime SHA256
`8492230b7ecaf6bbe1fdf49295ee18772fa50af9cb1afb5321afc84dacee8ae4` unchanged;
test SHA256`510cf4d6b55c9201dd5e2a42f8883fe28a291960516a861fb3374c6bf237e6c7`.
Raw owned worker evidence is retained pending review under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/p07a01d-wiw2k563/`.
Final16 passing controls include rank0, small-floor, all six nonfire types,
absent/zero map equivalence, Frozen Armor, legacy/literal aura, mana failure and
miss. Two test-only defects were corrected before frozen RED: exact optional
properties require physically omitting an absent map, and absent/zero map
representations cannot make retained entire unit configuration identical;
compare events/gameplay state while retaining repeated full equality per input.

`buildDamageInput` hardcodes increasedPct0. Shared `canUseSkillForState` lacks
an authored passive guard. Bounded root fix is per-type attacker modifier at
that single pipeline stage plus exact trigger:passive rejection in shared
eligibility. Preserve D04 burn aggregate stacking to5 and original stored
potency/source/start; never apply Warmth twice to periodic damage or accumulate
its percentage on repeated casts. No player workaround repairs ignored bonuses.

Security check: **PASS**. Local deterministic combat fields/eligibility only;
no network/credentials/dependency/permission/save-format or validation bypass.
This is an imported engine fixture, not ordinary earned UI/campaign acceptance.
Independent pre-source review and final resolution are appended below.


Root, producer and QA independently reviewed the complete frozen tests/raw
baseline before runtime edits: **APPROVE / ADEQUATE**. Existing742tests/47files
all pass in the expanded engine run; all22 failures are new intended regressions.
Producer also independently checked cooldownHP158, allyHP188 and legacy burn
2088DoT/HP7651 arithmetic. Runtime source remains unchanged at this bug record.
