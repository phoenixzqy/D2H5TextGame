# D04 — Static Field and ordinary earned preparation

Root implementation/self-review; independent acceptance pending. Contract:
[Static Field](../decisions/D04-static-field-v1.md). BUG150 first reproduces
two real catalog casts spending mana but leaving1000HP unchanged. Both causal
tests now produce750HP, with exact payment and deterministic replay.

The closed JSON effect uses25% current health, lightning resistance/act penalty
and independent MR, integer floor/minimum1. Normal remains nonlethal at1HP;
Nightmare clips to ceil(maxHP×.33). No hit/critical/status/combo RNG, added Attack
or passive damage bonus. All targets at floor yields without payment/cooldown.
Exact positive allocated aliases resolve maximum once/cap20; native Sorceress
authority explicitly disables foreign/removed/ineligible ranks. Next-wave/replay
refresh preserves resources and issued recordings. Immutable run profile owns
difficulty, including when selected map difficulty changes. Save21 is unchanged.
Both locales show current/next25%/33%, actual cost/cadence and truthful prose.

## Validation

- Causal engine RED2, schema RED2/28 and UI RED6/6 retained before correction.
- Full11326→11430 tests/436files pass, two existing opt-in skips,419.22s.
  Engine5598/170 passes61.98s. Final focused121/7 and37/1 pass.
- Typecheck, full lint, scoped final lint and production build pass. The full
  suite ran against frozen source. Subsequent corrections widen runtime boundary
  types to unknown and fix test callback/optional-field typing; all four emitted
  production JS chunks remain byte-identical. Original typed/lint failures and
  corrected results remain. No ignored diagnostics or weakened assertions.
- All four production JS chunks have zero forbidden bridge symbols.
- Production en/zh-CN×360×640/412×915/640×360/1280×800/1920×1080 passes10/10,
  zero horizontal overflow or page/console errors. Native Save-close-new-page
  Continue preserves the complete prepared export exactly.

Root self-review found no remaining local mechanic/eligibility/persistence
defect. This is not independent signoff. Existing test-time, bundle and PWA
budgets remain open; this does not establish any full G0–G7 gate.

## Earned preparation and honest failures

The actual source is the retained Summoner257 final (rawSHA256
458c75cc6b609f1b15cdb6d77fd8435917cad10d1df9d1525a1925a9917f1fd7).
Ordinary Import migrates20→21, Drognan performs one free skill reset, and31
ordinary Allocate clicks produce FireBolt9/Warmth1/FireBall20/StaticField1.
The public Active Skills tab sets StaticField→FireBall→FireBolt. Counters3/2,
zero unspent points,6240original owned gear,120HP/102MP and all inventory,
quests/merc/endgame/ordinals survive. There is no stat reset or fee.

Four browser setup invocations fail before any combat: premature option-list
observation twice, the still-hidden Active Skills tab, then the disabled
allocation button's different label. The first resumes its last retained reset
export; later runs resume actual interrupted exports, without repeating a reset
or an entry. Corrected native controls/matrix pass. No passing rerun is claimed
for the original scripts; reports, saves and screenshots remain.

[Prepared native save](fixtures/earned-static-preparation258/retained-final.json.gz)
and its manifest are now the retained precombat boundary: nextNormal258,
Nightmare0, Duriel undefeated and ActIII locked. Actual attempt258 is next.

Fixed native diagnostic seeds1–16: unchanged cold0/16; cold+Static1 11/16;
cold+Static1+Warmth2 11/16; legal fire+Static1 16/16; fire/control+Static1
16/16. These are projections, not earned progress or pacing evidence. No boss,
reward, seed-selection or global damage tuning accompanies the correction.

Raw evidence remains root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop`.
Root removes diagnostics after full-v1 consumers finish. Exact disposable builds
are tracked in artifact-ownership.json and removed after preview/browser readers
finish. C0/C1 remain accepted; earnedActsII–V/C2, seven-class/213-skill/economy/
pacing acceptance, C3/C4/fullG0–G7 remain open. Local only.
