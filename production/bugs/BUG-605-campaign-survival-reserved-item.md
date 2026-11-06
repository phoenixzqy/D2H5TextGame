# BUG-605 — Preserve reserved Iron Golem gear in campaign survival selection

Status: fixed locally; affected verification passed. Severity: Medium.
Found: 2026-11-02. Owner: root (campaign policy/QA responsibility).
Base: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local changes,
production source authority77. Environment: Linux/WSL native campaign Vitest;
no browser, viewport or locale dependency. Timestamp1793304000000; no RNG used.

## Reproduction

1. Create a native hero and hire the authored Act I companion.
2. Add a constructed defensive cap and reserve its ID for the current hero's
   Iron Golem using the native selection API.
3. Run `equipCampaignSurvivalGear` for the hero or companion while idle.

Expected: the reserved item stays owned and unequipped; selection stays intact.
Actual: the cap is equipped, changing its custody despite the reservation.
The generic intended-owned selector already excludes this item; survival does not.
Workaround: omit reserved items from defensive equipment selection.

Evidence: both owner-specific assertions fail in the retained
`p15-intended-defense-red-v1.json` under
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
Regression: tests/campaign/survival-gear.regression.test.ts, named
`preserves the current hero's reserved Iron Golem armor` for hero and merc.
Affected system: campaign preparation/QA helper, not native production gear APIs.

## Plan

Exclude the active hero's reserved item before computing candidate projections,
for both owners and backpack/stash. Preserve eligibility, native equip/retrieval,
resources and scoring. Verify both custody and reservation survive selection.
Run affected gear cases and scoped strict types/lint only. No campaign replay.

## Resolution and verification

The shared survival selector now resolves the current hero's reservation and
excludes its item before candidate projection for both owners. Both reproduced
RED custody cases pass in `p15-intended-defense-green-v1.json`, alongside45other
affected cases. Scoped strict TypeScript and explicit lint exit0. No production
game code/data changed and no combat was replayed for the fix.

[Evidence](../../docs/balance/2026-11-02-intended-owned-defense.md).
