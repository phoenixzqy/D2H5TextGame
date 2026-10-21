# BUG-057 — Apply Meteor Armor Melt after its triggering hit

Status: Reproduced; runtime fix pending.
Severity: High — the advertised Meteor defense debuff is absent.
Owner: engine-dev; root implements, producer/QA independently review.

## Reproduction

Commit `0353da5` includes reviewed representation/authored metadata, with all
runtime source unchanged. Node24.21.0/Linux, Vitest engine project; browser,
viewport and locale do not apply to this pure engine reproduction.

1. Run `node_modules/.bin/vitest run src/engine/combat/armor-melt.test.ts src/engine/skills/registry.test.ts`.
2. Seed5: actual registered player Meteor, rank1/20, level24/50MP, against a
   held defense20 target. Explicit fixture poison closes the encounter at2000ms
   after the real1700ms Meteor; these are engine fixtures, not earned gameplay.
3. Seed7: fixed100 fire/physical direct hit against active Armor Melt, with
   defense20 or21 and optional merc Inner Sight. Compare no-Melt controls.
4. Check Burn/ignite plus Melt physical combos, and explicit on-hit duration1234ms.

Expected, per [approved contract](../../docs/plans/decisions/D04-armor-melt-v1.md):
ordered Burn→Melt after the unchanged119/309 triggering hit; Melt applies3000ms
at all current tiers. Active Melt projects30% ordinary defense reduction with
fractional Inner Sight composition. Fixed100 fire vs defense20 deals86; defense21
with both reductions deals88. Burn/ignite, Melt or both give exactly one physical
bonus1.25 (boss/chapter1.125). Explicit duration reaches canonical status timing.

Actual: adapter forwards only Burn, so no Melt application/event/draw occurs.
Already active Melt leaves fire damage80 and defense21+Inner Sight84. Both fire
statuses multiply physical combos to1.5625 (boss1.28125). Explicit duration1234
is ignored in the hit loop, yielding4700 instead of2934 expiry.

## Evidence and root cause

Final prepatch test SHA `a457e24500fee382a986c983f1f9e4664b9244652973875b41c91c5b026f2276`.
Corrected prepatch RED:27 failed/75 passed,102 reached assertions, exit1,
2.346s, no deadline/cap stop, signals or survivors. Original RED28/74 is retained;
three tests had fixture assumptions about default grid order or the legacy
remaining counter. Independent producer/QA approved explicit cells and canonical
remaining3/no-expiry assertions before corrected RED. No product behavior was
changed to accommodate those assumptions.

The complete2517-byte prepatch no-Melt/no-fire-status recording is pinned by
SHA256 `bc410c62608c3265818f4f00473705edca576549f4fc6321574ac5e7c05d3484`.
It includes intentional stun/poison scheduler scaffolding. The same full-record
assertion passes before runtime edits; same-head replay alone is not parity proof.

Root-owned RAW:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-armor-melt-jcabtz3k`.
Contains both RED logs, command/process metadata, original/final tests, original
runtime sources and oracle. Durable index planned at
`docs/plans/evidence/p08a08-meteor-armor-melt.md` before exact cleanup.

`dataCatalog.ts` supports only secondary Freeze; `buildDamageInput` projects
Inner Sight alone; the direct-hit status loop drops explicit duration; `combo.ts`
independently multiplies the overlapping fire branches. Fix those origins as one
coherent runtime slice and reuse canonical status timing/refresh/death handling.
No workaround provides the advertised effect. No status subsystem, save, global
balance, gameplay pilot or prior Moor-draw causality change is established.
