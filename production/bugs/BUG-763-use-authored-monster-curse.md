# BUG-763 — Use the authored single-target monster Curse

- Status: Fixed and verified locally; uncommitted on `feat/playable-foundations` above `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- Severity: High — the advertised single-target curse path is replaced by a party-wide damaging compatibility action, with no player workaround.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes; `feat/playable-foundations`.
- Environment: Vitest engine project, Node; no DOM/browser dependency or locale-specific behavior. Seed: 13; native Ghost factory seed: 7, level 12.
- Affected systems: engine-dev; monster skill registration and authored combat behavior. Root owns this repair, working solo.
- Requirement: G2/F02; enabled monster actions must implement their authored behavior. `src/data/skills/monsters.json` defines `monster-curse` as single-enemy, cooldown 4, with amplification rather than damage.

## Reproduction

1. Load the production skill registry and build `monsters/act1.ghost` through the real monster factory.
2. Run a seed-13 recorded battle against held hero/mercenary/summon bodies; hold the Ghost after its first action at 1780ms to isolate the cast.
3. Inspect the recipients, damage/status events and unchanged HP. Separately let the Ghost act normally and inspect its first seven actions.

Expected: one living enemy receives a nondamaging Amplify Damage debuff. A four-second cooldown yields two ordinary Ghost actions before the next cast. Existing JSON-derived 3000ms/-50 physical-resistance-point family semantics remain valid.

Actual: all three living party bodies receive a one-point arcane attempt followed by legacy `amplify` on hit. Magic dodge can prevent the curse. The three-second compatibility cooldown permits a second cast after only one ordinary action.

## Evidence and cause

`src/engine/combat/monster-curse.test.ts` reproduces five failing cases before production repair. Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-monster-curse-h2iea13h`; `red.json`/`red.log` retain the failures and `baseline/` retains exact preimages.

The registry installs the hardcoded `MONSTER_STUB_SKILLS` Curse, with no native override. Its zero-base damage is clamped by the real damage pipeline to a minimum hit of one. Amplification itself already works through the legacy alias; it is not missing. The defect is targeting, cadence, hit dependence and phantom damage.

## Repair boundary

Replace only that compatibility action with a validated JSON-backed monster debuff. Reuse the existing authored Amplify Damage family defaults; do not invent duration/potency or change shared damage/status/targeting rules. Preserve monster definitions, other signatures, player Curse, save format and loot. No campaign or exhausted sample/retry allowance is renewed.

## Verification

[Evidence](../../docs/plans/evidence/p15-authored-monster-curse.md): five causal RED cases; 93 distinct affected assertions pass after repair, strict scoped TypeScript (431 files, zero diagnostics), eight-file lint plus final resolver lint pass. Native targeting, four-second cooldown, amplification/expiry, immunity, Mana Burn fallback, no phantom damage/hit draws, replay and immutability are guarded. Source baselines verify shared combat/status/family tuning and monster skill JSON unchanged. Full-v1 balance and independent acceptance remain open.
