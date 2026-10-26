# BUG-277 — Complete deferred Skeletal Mage signature effects

- Severity: Medium — direct elemental bolts work; GDD signature effects remain absent.
- Status: Implemented locally; final full-suite verification and cleanup pending.
- Owner: root, engine/content/QA; no delegation or independent approval.
- Baseline: `f8392a8b` (runtime unchanged from `6122bee5`).
- Environment: Linux, Node v24.21.0, Vitest pure-engine fixture; browser, viewport
  and locale do not apply. Unearned synthetic combat, no campaign action.
- Seed: 7.

## Reproduction and result

1. Prepare the actual canonical rank6 Mage batch with exactly22MP.
2. Hold three bodies and allow one selected element exactly one ordinary hit.
   The numeric factory isolates base Attack85 plus rank6 growth15, AS0 and no
   crit: one100damage hit at2000ms against a held zero-defense/resistance target.
3. Repeat independently for Fire, Cold, Lightning and Poison.
4. Assert the matching real stored status, source/expiry, periodic HP loss and
   unchanged caller input, alongside the successful payment/body/direct-hit checks.

Expected under the [follow-up contract](../../docs/plans/decisions/D06-mage-signature-effects-v1.md):
Burn3s/10HP/s, Chill2s, Paralyze1s or Poison5s/5HP/s respectively. Each branch
still pays once for four bodies; target HP includes actual direct and periodic loss.

Actual: all four branches pass direct100/element/body/payment assertions, then
fail because no status is emitted. The current direct-only child explicitly
deferred this behavior; this is a full-plan feature gap rather than a regression
against its earlier tooltip promise.

Root retains `signatures-red-test.ts`, `signatures-red.log/json` and unchanged
`baseline-combat.ts` at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-mage-signatures-kwew5kh6`.
The original RED is4failed/4cases,exit1,4.016s. Keep it through final verification,
then archive/read-back/exact cleanup. No inventory credit yet.

## Cause and repair plan

The paid battle-local map selects only a damage type in `basicAttack`; it supplies
no shared on-hit status. Add validated JSON tuning and attach its matching payload
at that existing authority boundary. Preserve generic/preload/enemy/malformed
fallbacks, whole payment, Command potency, shared status/mitigation/scheduling and
determinism. Workaround: use other status skills alongside Mage direct bolts.

Security check: pass for local first-party code/data/tests; no credential,
dependency, permission, network, CI or save-shape change. Independent design/QA,
earned balance, full-skill browser acceptance and private v1 remain open.

## Implementation and current verification

Validated definitions `468ed83f` and runtime `602d0f14` supply all four signatures
through the existing paid-Mage authority. Bilingual copy/native playback is in
`cbd99f8f`; resistance-chip translation is `1d8a34cf`. All326related tests/18files
pass after `71081cc7`, including Command, resource, provenance and replay checks.
The final production matrix passes10/10 across both locales and five viewports.
See the [current evidence](../../docs/plans/evidence/d06-mage-signatures.md).
The first final full suite failed nine stale-consumer assertions; a fresh full
run is active after their correction. No full pass, inventory credit, independent
approval, earned balance or full-v1 completion is claimed yet.
