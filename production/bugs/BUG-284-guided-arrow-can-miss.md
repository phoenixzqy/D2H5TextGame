# BUG-284 — Make Guided Arrow honor its hit guarantee

- Severity: High — advertised skill behavior is missing.
- Status: Fixed locally in `677fb25d`; UI `dceffcf4`; final public/integrated acceptance pending.
- Build: runtime `121fd691`, documentation-only head `bcfb6479`; Linux, Vitest1.6.1/jsdom.
- Locale: en/zh-CN promises checked in source; no browser/viewport claim for native reproduction.
- Owner: root (engine/content/UI/native/public); independent acceptance remains open.
- Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-volley-l7m0tvg6/amazon-volley-native-red.log` and `.json` (6failed/1control passed,23.287s; repository inputs unchanged).
- Seed: 41.

## Reproduction

1. Create a native level30 Amazon with Guided Arrow and its legal prerequisites.
2. Equip a canonical training bow through the inventory store, project to combat,
   isolate one paid action, and give both living enemies physical dodge1.
3. Run rank1 and20 with seed41 and inspect damage plus actual enemy HP.

## Expected

The advertised seeking arrow always lands against one living target, including
ordinary accuracy/dodge/Blind. It still pays20MP/2s and respects Physical
resistance, ordinary Defense, critical rolls, personal absorption and reflection.

## Actual

Both ranks miss, emit amount0/dodgedtrue and leave both enemies at2000HP.
The ordinary Magic Arrow control still misses, as expected.

## Root cause and repair boundary

JSON lacks any authored guaranteed-hit capability; its scalar damage effect
uses the ordinary85% hit/dodge path. Route an explicit JSON flag through the
adapter/effect to the existing damage pipeline's ignoreDodge input, preserving
other mitigation. Do not patch descriptions to remove the guarantee.

No player workaround restores this mechanic. Constructed native fixtures do
not establish earned builds or balance. Security check: pass; first-party local
gameplay/data/tests only, no credentials,dependencies,CI,remote or genuine save
changes. Root retains the task and original failed attempts until all consumers
finish, then preserves decisive evidence and performs exact owned cleanup.

## Local implementation and regression

`52880d01` adds explicit guaranteed-hit effect settlement; `f366fb56` adds
cone-3 geometry; `677fb25d` authors the actual three skills with closed schema
constraints. Native24/schema56 tests pass, including rank1/20 literal HP/payment,
miss/Blind, cone/cap, dead targets, reflection/caster death and deterministic
replay. `dceffcf4` adds accurate bilingual current/next/MAX descriptions;30new
UI tests plus40single-hit controls pass.

See [batch evidence](../../docs/plans/evidence/d04-amazon-volley.md). Original
failures remain retained; production browser and final full-regression work
are active. No skill-inventory credit or independent/earned balance approval.
