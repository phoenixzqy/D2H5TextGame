# BUG-569 — Allow explicit owned physical protection in the Javelin shield

- Severity: Medium; native manual socket insertion is available.
- Status: Fixed in campaign tooling; paid native shield insertion and Act III completion verified.
- Owner: campaign preparation, root sole writer.
- Build: feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
- Runtime: native Node service in WSL; viewport/locale inapplicable.
- Source authority16; production/data remain unchanged.

Reproduction: inspect exact level35/ordinal532 successor of
`p15-javelin-act3-support-continuation-v1.json`. BazaarW4 starts582Life but
loses to675directphysical damage at8740ms. Both native200Life support bodies
are paid25/15Mana at wave start; support allocation has not proved survival.

Expected: an explicit physical-shield policy can spend an actually owned Diamond
in an empty hero shield through the same native material/equip transactions,
retaining all costs and not changing the older Nova/Arcane policies.

Actual: owned rare kite shield it-5uqwl-3dw has one empty socket; materials own
one Flawless Diamond. Authored shieldEffect adds8physical resistance (plus
other resistances), taking hero12→20 without giving up equipment/stats. The
shared earlier magical preparation unconditionally excludes hero shields.

Correction: explicit hero-shield-only entry point reuses the bounded native
insertion implementation and selects highest owned Diamond. Old callers retain
shield exclusion and mercenary Topaz policy. Skip occupied/absent/non-shield
items; retain capacity refusals, committed costs and finally re-equip. Wire
only earned Javelin Bazaar route preparation. No fusion, purchase, rare drop
farm, supplied material, reset, free heal or seed override.

Evidence: the exact continuation/journal and
`p15-javelin-act3-level-gates-and-support-diagnosis-v1.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Plan review: ready; existing paid material API and rollback/finally rules apply.
Security check: pass; local owned-item/native transactions, no dependency,
credential, permission, network, CI or publication changes.

## Verification and outcome

The explicit hero-shield helper reuses native insertion and finally re-equip;
the fresh runner calls it only at earned Javelin Bazaar route entry. Two new
checks fail before; all10 socket checks, scoped types and explicit lint pass.
Authority17 verifies all2091 original production provenance inputs unchanged.

Exact ordinal532 pays one already-owned Flawless Diamond in shield
it-5uqwl-3dw at material-action ordinal460. The first native hero snapshot
confirms20 physical resistance, up from12. Bazaar, Council and Mephisto clear;
160 bounded Flayer farms plus three route admissions yield978 victories, zero
defeats and seven remaining quest actions. All economy/training/quest/recovery/
export-readback/source audits pass. Final level40/ordinal695 retains the full
695-admission/3303-wave/23-defeat history. This is one earned continuation,
not a causal or population balance result. See
`docs/balance/2026-11-02-javelin-act3-level-gates-and-support.md`.
