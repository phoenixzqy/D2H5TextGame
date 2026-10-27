# BUG-285 — Give Multiple Shot its five-target cone

- Severity: High — advertised skill behavior is missing.
- Status: Fixed locally in `677fb25d`; UI `dceffcf4`; final public/integrated acceptance pending.
- Build: runtime `121fd691`, documentation-only head `bcfb6479`; Linux, Vitest1.6.1/jsdom.
- Locale: en/zh-CN promises checked in source; no browser/viewport claim for native reproduction.
- Owner: root (engine/content/UI/native/public); independent acceptance remains open.
- Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-volley-l7m0tvg6/amazon-volley-native-red.log` and `.json` (6failed/1control passed,23.287s; repository inputs unchanged).
- Seed: 7.

## Reproduction

1. Create/equip/project a legal native Amazon with Multiple Shot at rank1 or20.
2. Place nine enemies in a three-row widening1/3/5 triangle and one outside it.
3. Isolate one cast with seed7; inspect selected enemies and actual HP/payment.

## Expected

One paid cast makes an independent Physical attempt at up to five living
hostiles in the advertised cone; no out-of-footprint or sixth target is hit.

## Actual

The cross selects tip,left,middle,right,back-middle. The cone's fifth
row-ordered target back-left is omitted. Rank1 and20 reproduce the mismatch.

## Root cause and repair boundary

The JSON and legacy builder author a cross; existing cone-2 has only four
cells. Add a three-row widening cone primitive and author maxTargets5. Keep
rank damage40–60/+4,15MP/2s,eligibility and ordinary accuracy unchanged.

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
