# BUG-434 — Reconcile the skeletal-mage cross-wave regression

Status: fixed locally; focused verification passes, full ordinary suite incomplete.
Severity: Medium (integration validation; player impact not established).
Build: b5a0898 plus local private-v1 work, WSL/Node24.21.0.
Engine/store fixture; locale/browser/viewport independent.
Seed: synthetic manual Blood Moor seed7/ordinal0, Date1792454400000.

1. Run `src/stores/combatHelpers.skeletal-mage.test.ts` using ordinary Vitest.
2. The second test settles the original four-mage wave, carries real resources
   and stages the frozen second champion wave.
3. Its expected two native resurrection events are actually one.

Expected: exact current native ordering, resources, finite resurrection and
exactly-once reward/carry assertions agree with the adopted mechanics.
Actual: `expect(revivals).toHaveLength(2)` fails at line239. Do not remove the
assertion or lower it without tracing actual source actions, deaths and mana.
The synthetic fixture preserves champion composition; BUG432 changes rare Attack
and actual Act I promoted affix cardinality, so direct causation is not assumed.

Evidence: retained packet `d2-counted-source-z3jj3xa1`, partial interrupted
`p15-elite-burst-full-unit-v1` and isolated `p15-integrated-oracle-repro-v1`.
Isolated3files:12PASS/1FAIL,40.537s, no live owned descendants. The new Den and
elite regression files pass; the mage failure reproduces independently.
Affected systems: store/engine/QA; root sole writer.
Diagnosis: the cross-wave oracle retained an impossible second resurrection.
The recorded effective input contains nine champions and both Shamans' priority
is Fire Bolt → resurrection → affix Fire Ball. At3640ms Shaman1 consumes the
only eligible first-death token; Shaman0 correctly falls through to Fire Ball.
The revived Fallen dies again at3880ms and creates no second token. The hero
kills Shaman0 at4000ms. Shaman1 survives the missed finisher but cannot resurrect
again before8640ms; it dies at7744ms and the wave ends at7760ms. The previous
oracle incorrectly assigned a7280ms resurrection to the already-dead Shaman0.

This follows `docs/design/monster-resurrection.md`: a shared finite FIFO,
synchronous commitment, five-second resurrection cooldown, living source and
no second-life token. `src/engine/combat/monster-resurrection.test.ts` separately
pins competing Shamans and cooldowns. The exact earlier edit that first made
the literal stale is not established; BUG432 is not claimed as its cause.

Correction changes only the proven-wrong test oracle. It retains exact
death→revive→death, restored stats/HP/mana, localized consumption, cold hits58,
terminal time7760ms, mana754/exact carry0.392, cooldown2240ms, fresh paid Mages,
immutable input, carry and exactly-once settlement/replay assertions. It adds
the complete source action sequences and the dead Shaman's4000ms death, so a
postmortem action or extra corpse consumption fails explicitly. No runtime,
fixture composition, RNG, skill/cooldown or reward change was made.

Verification: original isolated RED retained (`p15-integrated-oracle-repro-v1`)
and full trace `p15-mage-oracle-trace-v1.json`. Corrected focused
`p15-mage-oracle-green-v1`:109PASS/5files,41.536s including wrapper, no live
owned descendants. Includes mage lifecycle/playback/iron replay and native
resurrection/panic cases. Security check: pass; authorized local test/evidence
correction, no network/credentials/dependency/publication changes. Root-cause
review: the test contradicts both native events and the approved contract;
changing runtime to satisfy it would introduce illegal casts.


Full sweep terminal: `p15-mage-full-unit-v1` reached1800s bound,396UI files/
9082announced cases,4failures outside this corrected mage file. No clean full
pass. Source audit flags only the later Ormus test correction; final exact
owned-PID identities absent. See the Catacombs evidence/ledger for scope.
