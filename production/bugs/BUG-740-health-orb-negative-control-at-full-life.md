# BUG-740 — Keep life-accounting negative controls effective at full health

- Severity: Medium (external retained-output analysis only).
- Status: Fixed locally on dirty `b5a0898`; external analysis only, no new commit.
- Owner / affected system: root / QA diagnostic analysis.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, current dirty human2.
- Environment: Python 3, WSL; locale, browser, viewport and RNG not applicable;
  retained earned Double Swing ordinal128/wave5, no gameplay replay.

## Reproduction

1. Run `swing-route-first-v1-analysis-v1.py` in retained packet
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-earned-representatives-p_pqjbjf`.
2. Its negative life-accounting control removes the hero's health-orb events.
3. This sample's orbs restore zero effective HP because the hero is already full.

Expected: test effective restoration with a deterministic non-full-life fixture;
retain and account the real zero-restoration events without claiming they must
change the terminal life balance.

Actual: the copied control assumes deleting every HP orb must change life. Exact
ordered life accounting still passes for this valid no-op deletion, so the
negative-control harness fails with `Changed life evidence unexpectedly accepted`.
Native gameplay, capture and separate full reward/save readback already passed.

Evidence: `analysis-v1-failure.log` and `analysis-v1-failure-receipt.json` in the
packet above; original script retained. No analysis result JSON exists from the
failed attempt. Fix controls, keep life equalities and native records intact;
do not rerun combat.

## Correction and verification — 2026-11-05

Version2 keeps the original script/failure and the real sample's exact life
ledger. A deterministic non-full-life fixture proves effective orb restoration
and four rejection controls (orb removal, damage, healing, terminal life). A
separate full-life fixture proves zero-effective restoration and unchanged life
when that no-op event is omitted. Real sample damage/heal/terminal mutations
also reject; the actual zero-effective orb is accounted as zero, without making
an unsupported event-custody claim from life arithmetic alone.

`swing-route-first-v1-analysis-v2.json` passes: hero472.77→472.77, minimum416.77,
69incoming/69skill healing/0effective orb healing. Ordered native output remains
unchanged and the existing full readback is still pinned. No gameplay replay or
production change. See
[earned representatives evidence](../../docs/plans/evidence/p15-act2-earned-representatives.md).
