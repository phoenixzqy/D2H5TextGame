# BUG-549 — Lightning Sentry rank growth falls below campaign mitigation

2026-11-01. Severity: High. Status: fixed for the focused growth defect; broader balance remains open.
Owner: root (content, combat and QA). HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce, inherited dirty worktree.
Environment: Node24.21.0 production-store simulation; browser/viewport/locale not applicable to this engine reproduction.

1. Restore `p15-traps-act2-native-v3.json`: earned24/XP64152/next290, original Rogue23, Charged Bolt Sentry20/Lightning Sentry7/Shock Web1/Fire Blast1, no available skill points.
2. The preceding native Arcane Sanctuary admission289, seed404410616, reaches The Summoner and loses after55080ms with4200/5425 boss HP. Five earlier waves and all partial income remain retained.
3. Compare existing paid priorities and a legal free reallocation to Lightning Sentry20/Charged Bolt Sentry7. Current-source whole-area controls at ordinal290 are retained in `p15-traps-act2-arcane-controls-v1.json`. The reallocation with two-sentry boss order still loses at58320ms with2027 boss HP. No projected income is retained.

Expected: investing in the level24 primary trap supplies useful damage through ordinary on-chapter mitigation, retaining its finite autonomous pulses and ordinary defenses.
Actual: capped Lightning Sentry is only189–224 per pulse. The observed Summoner has25 Lightning resistance and81 MagicResist, reducing ordinary cap hits to60–87 before hit/critical variation. Earlier growth controls and owned preparation do not establish an accepted balance curve.

Root cause: provisional data-owned rank growth+6. This is separate from the corrected external priority-helper assertion, which had incorrectly required selected trap authority to remain unchanged when changing an order. No game runtime defect was found in that refresh path.

Evidence packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`, retained by root through umbrella acceptance. Source/save/readbacks and exact original failure streams remain there. Proposed tuning: [Lightning Sentry growth](../../docs/balance/2026-11-01-lightning-sentry-growth.md). Security check: pass; authorized local JSON/test work, no dependencies, network, permissions or persistence change.


Correction and verification: only Lightning Sentry damagePerLevel6→24. Rank1, payment, timing, targeting, mitigation and all inherited Talon/Tail values are preserved. Corrected RED has11distinct expected failures/151passes; GREEN has162/162affected cases across definition/display/native/UI, including actual-data Ajv validation and native ranks1/7/20 against Summoner mitigation. Scoped strict types and lint pass. The first lint command omitted plugin resolution; corrected command uses installed worktree plugins, with no install. Source audit checks all2090inputs and finds exactly the declared five data/test paths changed.

Fresh exact-source Arcane controls retain the rank7 timeout, while the same legal rank20 reallocation that previously lost now clears the whole area and kills The Summoner19.686s. Native admission290 reproduces it exactly and independent readback-v4 passes. Duriel's subsequent draw is retained; already-owned Rogue gear and six paid insertions qualify the whole Tomb at ordinal292, kill Duriel59.4s, and native/readback-v5 pass. Actual24/XP147622/next293, all six Act II areas and21canonical actions complete. No additional farming or tuning in this correction. Required evidence remains in the packet through umbrella acceptance. The narrow victory does not certify full balance, later acts or active-hour pacing.
