# BUG-697 — Double Throw recovery preempts its primary

- Status: Fixed locally; earned five-act Normal completion reconciled.
- Severity: High — the intended build's retained Normal route stops here.
- Owner: root acting as game/level designer and engine/QA; no agent dispatch.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus frozen dirty source;
  production tree `37fa738e4125a4ee6f6c53c93f453bdccc67338b61dd9de6f01104d4df1ca09f`.
- Environment: native production engine/store campaign driver, Node v24.21.0;
  browser/viewport/locale not applicable to this headless combat observation.
- Seed: **1402803244**, Normal ordinal **714**, Crystalline Passage wave1;
  start timestamp **1793510110923**.

## Reproduction already recorded

1. Continue authenticated Double Throw Act IV successor, level49/next712,
   using actual equipment/resources/ranks and Prayer mercenary.
2. Admit Bloody Foothills712 and Frigid Highlands713 once each. Both win all six
   waves; claim earned main quests and perform canonical prison actions.
3. Admit Crystalline Passage714. Stop immediately at the first nonwin.

Expected: establish whether the intended build has a viable earned campaign
path within existing finite preparation limits. A low-level draw alone is not
evidence of a mechanics violation; do not require an arbitrary win.

Actual: wave1 draws at60s. The level49 hero survives with1613.24HP and457/462MP
(minimum450MP); the level31 Prayer mercenary dies. Three level67 enemies survive:
Frozen Terror `enemy-act5.frozen-terror-11-51aa`2285HP and Succubi
`enemy-act5.succubus-6-866b`3425HP/`enemy-act5.succubus-7-a525`3098HP.
Hero direct damage86490; merc6890. Hero casts Battle Command7, Double Throw25,
Find Potion12 and Double Swing6. No Crystalline clear/Ancients/Throne attempt.

## Evidence and investigation

[Checkpoint and evidence hashes](../../docs/plans/evidence/p15-double-throw-act5-checkpoint.md).
Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-throw-post-tuning-act5-v1`: frozen plan/driver, report, journal,
native save, retained-output reader and closure. Original observation is the
reproduction; no additional combat is needed to file this report.

The retained events show 11 of 12 Find Potion casts took turns when Double Throw
was ready and affordable. The shared `earnedDoubleThrowProfile` preparation
placed recovery ahead of the learned primary at both growth and area boundaries.
One frozen order-only diagnostic swapped those two entries on the complete saved
engine input: victory at 51211.8780789454ms, no survivors, hero1612.24HP/450MP.
No baseline replay, native admission, reward or balance credit. Diagnostic closure
SHA256 `e627ff34458824578d953c8cba5954152df50ee2a631bb1614357f913909ec0c`;
same packet, prefix `p15-throw-crystalline-order-diagnostic-v1`.

The upstream preparation now puts Double Throw before Find Potion, preserving
buffs, recovery before Double Swing and the paid early bridge/reset behavior.
Focused regressions reproduce recovery preempting an available primary; they
also cover pre-unlock order and recovery during cooldown or low MP. First fixture
assertions were corrected to use native learned order and actual event fields;
the corrected RED run has three relevant failures and three passing controls.
All12selected regression cases pass, with scoped strict types and explicit two-file lint.
The bounded earned suffix wins all21waves in Crystalline715/Ancients716/Throne717,
ending50/next718; exact saved rewards, all19ActV actions/five claims, Baal title
and Nightmare unlock reconcile. [Completion evidence](../../docs/plans/evidence/p15-double-throw-priority-and-completion.md)
retains the original failures, closed diagnostic, failed metadata preflight and
successful one-time native continuation.

Find Potion's near-full recovery agrees with the explicit
[D06 contract](../../docs/plans/decisions/D06-find-potion-v1.md), including net
positive MP recovery; do not change eligibility merely to force a win. The18-level
gap prevents matched-level balance acceptance. No engine/formula change is needed
for the established preparation defect; the retained intended Normal route is complete; wider balance/population/pacing
acceptance remains unproven.
Original Act IV706–708 failures and exhausted preparation allowances remain
spent; do not renew them or replay earlier acts.
