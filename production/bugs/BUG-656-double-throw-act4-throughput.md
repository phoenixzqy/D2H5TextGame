# BUG-656 — Double Throw Barbarian exhausts prepared Act IV attempts

- **Status:** Locally resolved — earned Act IV continuation verified after rank Attack tuning; wider balance and independent final acceptance remain open.
- **Severity:** High historical progression failure; original attempt limits remain exhausted and preserved.
- **Owner:** game-designer / level-designer; root retains investigation ownership.
- **Affected systems:** Intended Double Throw growth/rotation, weapon-based
  direct physical damage and Act IV encounter throughput.

## Reproduction

- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained uncommitted
  production tree `e22230c8f60e9cbc105e894e1127c6cd4b049eab164299a4a9575884e351213d`.
- Environment: WSL/Linux, installed Node/Vite SSR native store/engine driver.
  Browser/viewport: not exercised; this is a native campaign observation.
- Locale: native campaign; no locale-specific UI claim.
- Seeds: route admissions 706/707/708 use 3385400074/4018905663/4070659197.

1. Restore the verified intended Double Throw Act III export at level 47 /
   next ordinal 677, timestamp 1793506800109, SHA256
   `8d17d3e593f13276e006f9ae6bcc9ecbca4e5f28433c63bda0963c251392cd76`.
2. Retain the accepted profile, existing Prayer, earned equipment and original
   `challenge-prepared-act4-v1` training/attempt limits.
3. Execute its 29 cleared-Travincal training admissions to level 49 and the
   three permitted Plains of Despair attempts.
4. Inspect the retained settled waves. Do not replay these already-recorded
   failures or renew the exhausted attempt budget.

## Expected

The intended Double Throw route supports Normal progression through legal
paid Throw ranks, Throwing Mastery and earned equipment; acceptance requires
actual encounter victory and legal quest progression.

## Actual

All three attempts reach Izual and draw at 60 seconds. His remaining Life is
8556/9657/4863. The hero and Prayer survive; hero minimum mana is 450
of 462 throughout all three waves. Hero casts Double Throw 32/29/32 times,
Double Swing 16/21/13, Battle Command 6/7/7 and Find Potion twice each.
Hero direct damage is 21,288/21,468/20,418; Prayer damage is
15,780/18,666/19,662. No Act IV clear/claim or Act V entry occurs. Terminal
state is level 49 / next ordinal 709; all costs and earned rewards remain.

## Evidence and limits

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`, prefix `p15-throw-earned-act4-v1`:
frozen plan/driver/reader, single native report/journal/export, `-nonwins.json`,
`-failure-analysis.json`, first independent accounting readback and closure.
[Checkpoint](../../docs/balance/2026-11-03-double-throw-act4-checkpoint.md).
The 189 settled waves contain 186 victories/three draws. Scoped strict types/
lint/preflight and nine-negative-control readback pass exact native custody/
economy/points/quests/Prayer/clocks/seeds/ordinals. No combat replay, unrelated
suite or new candidate comparison occurs.

The inspected authored Throw two-attempt/rank curve and Throwing Mastery
contract agree with their design; these failures do not establish an engine
bug, a particular numeric correction or a verified workaround. Continue by
tracing retained damage/resistance/action contributions across the failed
routes. Preserve the intended identity, all original failures and exhausted
attempts. Any diagnostic needs a bounded plan before execution and cannot earn
campaign income or renew attempts 706–708. Root self-review is not final
independent acceptance. Root self-triages; no new agent is dispatched under the
active session constraint.

## 2026-11-03 — Physical selection enabled; no owned throwing upgrade

[Owned-weapon evidence](../../docs/plans/evidence/p15-barbarian-owned-weapon.md):
the intended level12 physical selector and first-affinity precedence pass35
focused cases, scoped strict types and lint. The single retained-save check
performs zero native actions and retains the exact input export: its only
eligible alternate throwing knife has lower physical expectation than the
equipped knife (199.766 versus200.731). Stronger nonthrowing weapons are correctly
excluded. The driver's assumed upgrade assertion fails; no second call occurs.
Before this first execution, the unused32-transfer plan was superseded after
read-only overflow preflight; both versions remain recorded. No failed gameplay
budget is renewed. Newly available ordinary throwing tiers (BUG658) are not
already-earned items in this save. Earned acquisition and encounter viability
remain open; attempts706–708 stay exhausted. No combat or clock advancement.

## Retained damage attribution — 2026-11-03

[Six-wave attribution](../../docs/plans/evidence/p15-act4-damage-attribution.md)
reconciles every damage source and exact Izual Life deltas without combat or
native-save mutation. Throw's rank-one Swing filler deals only79boss damage
across three fights; Swing's current199Attack produces95–105noncritical boosted
hits while Howl consumes roughly one-quarter of hero actions. Existing Attack
scaling and mitigation explain these observations; no new formula correction
is justified. Next evaluate attainable offensive equipment/rotation preparation
under a prospective bounded diagnostic; preserve all failed and exhausted
route/preparation budgets. No encounter fix or acceptance follows.

## 2026-11-03 — Attack trial stopped; recorder repaired

The prospective `p15-throw-attack-tuning-v1` trial stopped at its first control:
reconstructing teams omitted native Find Potion, changing the action at1728ms.
Only one control wave executed; zero candidate waves. The proposed20→30Attack
rank contribution was never applied. All three temporary test edits were
restored to their exact preimages, and production Barbarian skill data remains
SHA256`ca6ed7c5dc286e75aea0efa0ad9cd40aea4ea14041330d8c5d602a01c66a385b`.
No retries or renewed gameplay/preparation budgets are authorized by that trial.

[BUG662 evidence](../../docs/plans/evidence/p15-native-wave-input.md) verifies
future recordings retain the actual complete serializable native snapshot.
That diagnostic fix does not recover omitted historical projections or opaque
Battle Command carry, and does not resolve this gameplay failure. Original
terminal level49/next709save and journal authenticate unchanged; attempts706–708
remain exhausted. Status remains Open; no Act IV clear or continuation.

## 2026-11-04 — Rank Attack tuning passes bounded local comparison

[Tuning evidence](../../docs/plans/evidence/p15-double-throw-rank-growth.md)
records the sole20→30pp Double Throw Attack-growth candidate. The corrected
native publication-boundary comparison exactly reproduces15control events/
outcomes and12between-wave openings, then wins all15candidate battles with a
living hero; Izual completes in54.5396/47.0578/50.4570seconds. Both stopped
predecessor controls remain counted:32diagnostic battles across all attempts.
Historical inputs are explicitly reconstructed; observational equality does
not establish retained native-input provenance or earned campaign success.

The JSON tuning and four affected tests are locally verified:33focused cases,
strict scoped types, zero-warning lint and16bilingual desktop/mobile browser
previews pass. Original integration/boot/type-check failures remain retained.
Rank1, Double Swing, costs, two-total-attempt rules and mitigation are unchanged;
the [contract](../../docs/plans/decisions/P15-double-throw-rank-attack-growth-v1.md)
keeps this provisional pending wider balance and progression acceptance.

Status stays **Open**. Original level49/next709save/journal hashes are unchanged;
attempts706–708 and preparation limits remain exhausted. No new campaign
admission, reward, ActIVclaim or renewed attempt is credited or authorized by
this diagnostic. Continue under a prospectively defined progression scope after
this tuning, preserving the failed history. Root self-review is not independent
final design/QA acceptance.


## 2026-11-04 — Earned Act IV continuation verified

[Actual progression evidence](../../docs/plans/evidence/p15-double-throw-act4-completion.md)
now supersedes the earlier no-clear observations: from the exact original
level49/next709save, the separately frozen post-tuning check clears all three
areas in three admissions/18victories, zero training/retry/nonwins and all
quest Claims. Terminal level49/next712save unlocks Act V. Independent retained-
output accounting and closure pass exact native save/custody/economy/points/
party/quest/clocks/seeds/ordinals; all frozen checks pass and disposable outputs
are cleaned. Original706–708 and preparation limits remain exhausted.

This resolves the observed Act IV progression failure locally. It is not a
retroactive success for the old controller, a matched-level or population
balance acceptance, or independent final design/QA signoff. Continue Act V
from the exact successor; the full intended campaign remains unfinished.
