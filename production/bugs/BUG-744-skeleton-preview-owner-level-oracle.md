# BUG-744 — Keep the mounted Skeleton preview regression aligned with owner growth

- Severity: Low; stale test oracle, no demonstrated player-facing defect.
- Status: Fixed locally; uncommitted. Producer source review approved.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited human2 edits.
- Environment: Vitest/jsdom, zh-CN; locale-independent expected numbers. No RNG.
- Affected systems: QA/frontend SkillsScreen regression assertions.

## Reproduction

1. Read the retained failing assertion in the BUG743 original `red.json`.
2. Its fixture mounts a level12 Necromancer with Raise Skeleton rank5.
3. It expects Life152/Attack33/Defense18, which are the owner-level1 values.

Expected: follow [P15 owner-level growth](../../docs/plans/decisions/P15-skeleton-owner-growth-v1.md):
current482/187/62, next492/189/63; caps1/2. Current and next previews both use
the actual hero level. Rank scaling precedes +11 owner levels of30/14/4.

Actual: the assertion fails on Life152. Runtime and UI already share the
specified growth. The test stopped checking the actual mounted contract after
owner growth was implemented; do not revert gameplay to satisfy this oracle.

Evidence: original `d2-avatar-skill-recovery-zjof2q7o/red.json` and extracted,
hashed assertion in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-skeleton-preview-oracle-sbkg62hm/inherited-red-assertion.json`.
The new packet also freezes source/test/data/decision inputs before correction.

Plan reviewed ready by producer: use literal independent current/next stat
oracles scoped to their detail sections, both locales, and a mounted owner
level12→13 refresh. No production edit, new balance claim or campaign replay.

## Resolution and verification

Only `src/features/skills/SkillsScreen.test.tsx` changes: independent literal
current/next body stats and caps are asserted within their labelled preview
sections in both locales. A mounted owner12→13 update must refresh both bodies;
next-rank deltas remain+10/+2/+1. No production tuning changed.

Two selected bilingual assertions pass,43 unrelated assertions are filtered,
zero fail. Single-file ESLint and scoped strict TypeScript exit0. All three
verification processes are terminal; these results were collected without
rerunning checks. Producer source review: APPROVE, no material findings or
false-positive risk. Original RED remains unchanged. The retained packet now
contains final test snapshot, incremental patch and hashed completion receipt.
No disposable cache/browser was created for this test-only slice. Root retains
the exact named packet through full-v1 acceptance and owns eventual cleanup.
