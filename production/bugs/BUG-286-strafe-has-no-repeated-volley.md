# BUG-286 — Give Strafe real repeated attack attempts

- Severity: High — advertised skill behavior is missing.
- Status: Reproduced; source correction pending the frozen Amazon integrated checkpoint.
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
