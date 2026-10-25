# BUG-188 — Apply Druid allied aura effects

Severity: High. Status: locally fixed in `5e1532e`; independent and earned acceptance open.

Reproduction: `03b115a`, Node/Vitest, seed7, both locales share the defect.
1. Run `src/stores/druid-ally-auras-causal.test.ts` with native stores and combat.
2. A disclosed synthetic level30 Druid learns Oak Sage or Heart of Wolverine at1/20.
3. Start an ordinary Blood Moor recording; compare initial capacity and real damage.

Expected: Oak increases self/allied life capacity without healing; Heart increases
real allied attack/critical chance under authored rank coefficients. Their effects
remain automatic with no active cast. Oak and paid forms add over one fresh base.

Actual: Oak leaves999382 capacity unchanged at1/20; Heart leaves the first real
hit1024 unchanged at1/20. Paid wolf alone gives1599011 instead of2198640 with Oak.
Corrected causal RED:5fail/3controls. The first attempt omitted ready hydration and
failed all8 before reaching combat; original setup/log retained, not mechanic proof.

Evidence: `causal-red` and `causal-corrected-red` logs/results and original fixture
are retained in the [raw archive](../../docs/plans/evidence/fixtures/druid-ally-auras/raw.tar.gz).
The original task scratch directory was removed after byte-verified retention.

Root cause: passive metadata has no party projection or damage/capacity consumer.
Existing form/Vigor capacity writers also require a shared base to compose Oak
without compounding, premature clamping or losing HP on wave carry.
Owners: root acting as engine/frontend/content; independent design/QA remains open.
Spirit of Barbs separately requires its actual advertised spirit creation/effect
and receives no credit from this bug. No workaround grants the missing effects.

Implementation regressions reproduced and retained: old native bear cases lost
paid capacity on death; a new rejected-carry playback case left stale form state;
and the existing native Vigor replay test exposed pre-projected snapshot capacity
where its original-resource contract requires the fresh base. Keep common capacity
settlement in the engine after complete party registration; native wave refresh
preserves absolute HP until that final projection. Original tests remain authoritative.

Resolution: native causal8/pure11/shared-capacity4/allied-engine12/native3/playback1/
localized-component10 cases pass in full12962/559/two existing skips. Engine6656/231,
types/lint/explicit-false build/bridge and production4/4 pass; eight exact five-domain
Continue pairs,20 geometry samples and eight inspected screenshots retained.
All1280source/760build/HEAD/Git/genuine hashes stayed exact through the full run;
committed source blobs match. [Evidence](../../docs/plans/evidence/d05-druid-ally-auras.md)
preserves the original RED, fixture failures, interrupted full and later regressions.
Only Oak and Heart gain local bounded credit. Spirit of Barbs, earned builds,
independent QA, mobile occlusion, test/performance budgets and complete privatev1
remain open; no genuine campaign or remote action occurred.
