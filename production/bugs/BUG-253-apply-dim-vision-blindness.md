# BUG-253 — Apply paid Dim Vision blindness to real hostile hits

- Status: locally implemented through `cd5e90a3`; broad/static/production-browser verification pending. No skill credit yet.
- Severity: High — the advertised control spell spends mana without affecting combat.
- Owner: root engine/content/frontend; independent design/review/QA remain open.
- Build: `8724f96c`; Node24.21.0/Linux; engine/native adapter reproduction, independent of browser/locale/viewport.
- Seed:1; actual native Necromancer allocation ranks1/20, unearned fixed HP/MP and attack cadence for isolation.

## Reproduction

1. Run `npx vitest run src/stores/necromancer-dim-vision.causal.test.ts`.
2. Project a real level30 Necromancer with learned/slotted Dim Vision through `playerToCombatUnit`.
3. Permit its one actual curse at400ms, paying9MP at rank1 or5MP at rank20; hold later hero actions. A neutral hostile makes nine100-damage Physical attacks at500ms intervals.
4. Compare with the same snapshot whose hero is held before casting.

Expected: a successfully paid blind changes actual hostile accuracy during its finite interval, preserving attack cadence and existing resource/eligibility rules.

Actual: both paid ranks emit the localized-status identity and consume all prepared MP, but settle exactly the same700 hostile HP loss as the uncast control (hero99300HP). Cadence, payment, applied-status, unchanged input and deterministic recorded/plain assertions pass. The two positive effect cases fail; unavailable/poor-MP controls pass. Original RED2failed/2passed, exit1,7.838s command, raw log SHA256`03d3f05fe76ca384389a970eed25283b83423b2d46df6a0d9ce53ee0a813e2ca`.

Evidence root: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-dim-vision-gxjf3r50`, owned by root through this task's consumers; original test/log/receipt will be retained before exact cleanup. [Implementation contract](../../docs/plans/decisions/D04-dim-vision-v1.md).

## Cause and boundaries

`dataCatalog` emits an ordinary `dim-vision` marker. No accuracy/targeting consumer reads it; the existing Raven `blind` status alone supplies a Physical-hit penalty. No workaround makes Dim Vision functional. Adopt an explicit text-combat blindness adaptation, rather than inventing movement/range or removing the skill promise. Preserve canonical eligibility, targets, cost/cooldown scaling, resources, RNG draws, shared damage/mitigation and saved allocation.

## Local implementation progress

Authored metadata/definition`aaaaccaf`, copied finite status`45e54dff`, shared hit consumer`a4a90f65`, bilingual details`a9985354`, native/component/type-fixture controls`cd5e90a3`.89focused regressions across six files pass13.368s, including the original paid native rank1/20 failure, eight independent first-seed50-point/onset/expiry controls, all seven direct types, valid Cleansing/rebasing, Raven maximum/nonstack, periodic HP integrals, actual reflection, playback and real native allocation/next-wave/import. Both locales expose current/next/MAX mechanics. An existing one-decimal cooldown rule justified three test-oracle corrections; exact optional-input fixtures now delete optional keys rather than assigning undefined. Original failed sources/results remain task-owned and retained pending final archive/cleanup.

Production-browser spec/config now cover four desktop/Pixel5 locale cases using ordinary controls and current Save22, keyboard detail/combo, exact previews, real localized cast/chip, geometry, seven-domain online/offline reopen and console-warning/error checks. Discovery lists four cases; this is not runtime browser acceptance. Full engine/unit/type/lint/build/precache/public browser and visual review remain pending; author review is not independent approval. Inventory remains unchanged.
