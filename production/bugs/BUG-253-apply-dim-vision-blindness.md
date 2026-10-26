# BUG-253 — Apply paid Dim Vision blindness to real hostile hits

- Status: locally fixed and verified at combined implementation `7b27fb04`; one bounded functional credit. Independent design/review/QA and earned balance remain open.
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

Raw evidence root was `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-dim-vision-gxjf3r50`; it has been losslessly retained/read-back verified and its disposable paths cleaned. Exact retained archive/sidecars and root's removal responsibility are recorded in the final evidence linked below. [Implementation contract](../../docs/plans/decisions/D04-dim-vision-v1.md).

## Cause and boundaries

`dataCatalog` emits an ordinary `dim-vision` marker. No accuracy/targeting consumer reads it; the existing Raven `blind` status alone supplies a Physical-hit penalty. No workaround makes Dim Vision functional. Adopt an explicit text-combat blindness adaptation, rather than inventing movement/range or removing the skill promise. Preserve canonical eligibility, targets, cost/cooldown scaling, resources, RNG draws, shared damage/mitigation and saved allocation.

## Local implementation and verification

Authored metadata/definition`aaaaccaf`, copied finite status`45e54dff`, shared hit consumer`a4a90f65`, bilingual details`a9985354`, native/component/type-fixture controls`cd5e90a3`.89focused regressions across six files pass13.368s, including the original paid native rank1/20 failure, eight independent first-seed50-point/onset/expiry controls, all seven direct types, valid Cleansing/rebasing, Raven maximum/nonstack, periodic HP integrals, actual reflection, playback and real native allocation/next-wave/import. Both locales expose current/next/MAX mechanics. An existing one-decimal cooldown rule justified three test-oracle corrections; exact optional-input fixtures now delete optional keys rather than assigning undefined. Original failed sources/results remain task-owned and retained pending final archive/cleanup.

Final engine8,986/337 and full17,874/819/two existing opt-in skips pass, as do final types/lint/official production build/six-chunk bridge/756-URL precache. Production4/4PASS226.198s proves actual localized cast/chip,19→20 public allocation,eight exact seven-domain online/offline save pairs,four activated-SW network-disabled Continues and20geometry observations. All eight PNGs were individually inspected with precise mobile/victory clipping/black-region limitations; runtime markers are separate from causal accuracy proof. No retry/skip/assertion weakening or suppression was added.

All26scoped committed source/config/test files and both762-file builds match;25terminal command receipts/log hashes verified.1,463raw members retained/read-back verified;2,225exact files/59directories plus the separate driver cleaned. Remaining[]/failures[];30restrictedproc entries disclosed. Exactly one bounded local credit,Necromancer20/32,inventory162bounded/49unverified/one engine-only/one review-needed. Other212raw rows/header/IDs/order exact. [Final evidence and retention ownership](../../docs/plans/evidence/d04-dim-vision.md).

Author review is not independent approval. Provisional numeric adaptation,independent design/review/QA and earned balance remain open. GenuineL33/Ancients claimed/Baal uncleared remains hash-exact;no genuine campaign/replay or remote action. Remaining skills,C2–C4/G0–G7 and complete privatev1 remain unfinished.
