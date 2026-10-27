# BUG-286 — Give Strafe real repeated attack attempts

- Severity: High — advertised skill behavior is missing.
- Status: Fixed locally in `677fb25d`; UI `dceffcf4`; final public/integrated acceptance pending.
- Build: runtime `121fd691`, documentation-only head `bcfb6479`; Linux, Vitest1.6.1/jsdom.
- Locale: en/zh-CN promises checked in source; no browser/viewport claim for native reproduction.
- Owner: root (engine/content/UI/native/public); independent acceptance remains open.
- Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-volley-l7m0tvg6/amazon-volley-native-red.log` and `.json` (6failed/1control passed,23.287s; repository inputs unchanged).
- Seed: 7.

## Reproduction

1. Create/equip/project a legal native Amazon with Strafe at rank1 or20.
2. Isolate one cast against two living enemies, each with2000HP, using seed7.
3. Inspect ordered damage events, actual per-enemy HP, mana and action count.

## Expected

The promised rapid multi-hit volley produces multiple real independent
attempts per original living enemy, paying mana and cooldown once. Dead
original targets are skipped; stop when the caster dies.

## Actual

One cast produces only target,reserve: one scalar hit per enemy, without
any repeated attempt. Both ranks fail the two-pass acceptance contract.

## Root cause and repair boundary

Strafe's JSON has no hitSequence. Reuse existing each-original sequence
settlement rather than introduce a parallel attack engine. Two passes are a
provisional v1 count for the unspecified rapid volley; retain35–55/+4,20MP/2s
and all-enemy targeting. Independent design and earned balance remain open.

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
