# BUG-151 — Admit equipment for late Act II ordinary waves

Severity: High. Status: fixed locally; independent acceptance pending. Owner: root/content and QA.
Runtime `a9dc03081de97e72f3953f1f05d56d060764bf97`; production Chromium,
English,360×640. Actual attempt259 uses native seed3286157777 derived from
the retained historical Date1792785263368, without a seed override.

1. Continue the retained earned attempt258 final, nextNormal259.
2. Enter the Tomb once with the retained legal Fire Ball/Static Field build.
3. Win waves1–3 and inspect the native wave3 settled export.

Expected: the level29 elite pack has eligible equipment in its assigned
`loot/trash-act2` pool. Random drops need not be guaranteed, but equipment
must be possible at the actual encounter level.
Actual: wave3 grants2610XP and currencies but zero equipment; every item
entry's maximum is at most28. This is an empty eligibility pool, not a
noDrop roll. The task harness's positive-gear assertion stops the run after
settlement. The original failing report remains unchanged; no attempt259 replay.

Root cause: authored loot maxima were not reconciled with the production
planner's difficulty bonus, wave offsets and encounter-level spread. The
Tomb's nonboss waves reach31. Only its four highest equipment rows reach28;
the ten lower rows stop at22/26. Boss/quest tables are separate.

Evidence: root-owned native exports, DOM logs, screenshot and original report
at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/earned259`.
Exact seed reproduction and legal-build screens remain in the same task root.
Root retains them through campaign/full-v1 consumers, then removes them.

Resolution contract: extend only the four max28 `loot/trash-act2` item rows
to31. Preserve minima/weights/rarities, all other rows/tables, level/scaling,
noDrop/pick policy, prior saves and the original consumed259 outcome. Cover
real planner levels and native reward materialization, exact boundaries and
unchanged unrelated content. Independent acceptance and full P12/G gates remain open.

Security check: pass. Local data/test change; no new executable input,
dependencies, credentials, permissions, CI or publication.

Local resolution: four top-band maxima28→31 only, with seven causal REDs and
eight GREEN checks in `src/engine/loot/act2-level-eligibility.test.ts`. Actual
next260 wave3 awards18gear through ordinary UI; original259 remains unmodified.
Full verification and campaign outcome: [evidence](../../docs/plans/evidence/d08-act2-loot-and-earned-tomb.md).
