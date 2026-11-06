# BUG-544 — Recover native stash headroom below the salvage threshold

Severity: Medium. Status: fixed in external helper v3; native continuation and readback pass.
Affected system: earned campaign verification policy; no product capacity change.

Reproduction: Node24.21.0, production-store training from Javelin Amazon
13/XP54168/ordinal114. `p15-javelin-act2-earned20-v1.json` in the retained
packet records31 admissions, actual level17/XP104337/next145, then a boundary
assertion `protected-capacity-blocked`. Browser/locale do not affect this case.
The report and raw journal retain the actual native seeds and all partial income.

Expected: move ordinary retained gear through the native stash service when
additional backpack headroom is needed and the stash has room.
Actual: backpack93/stash3. The base salvage policy returns ready below97;
the stashing helper requires88 but only moves special/paid items. It reports
failure despite free stash capacity and93 ordinary unpaid backpack items.

Root cause: mismatched headroom thresholds combined with an unnecessary rarity
filter. Keep base salvage and nominal100/500 capacities unchanged; let the
external helper move ordinary items too, preserving exact custody and native
refusals. Preserve the failed execution and audit its partial save before resume.

Evidence: packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
`p15-javelin-act2-earned20-v1.json`, its raw journal and run exit receipt;
`p15-caster-stashing-capacity-v2.ts`. No commit/publication for this work.

## Local outcome

Immutable helper v3 removes the rarity-only stash restriction. New scoped strict
types/lint pass. A fresh qualification from the retained17/104337/145 save
performs five native ordinary stash transfers and wins. Native resumed training
then wins125/125 waves across25admissions to actual20; independent readback
reconciles all314060new XP, custody, currencies and points. The failed predecessor
and its373980earned XP remain intact. No product capacity or source-code change,
commit, or publication was needed.
