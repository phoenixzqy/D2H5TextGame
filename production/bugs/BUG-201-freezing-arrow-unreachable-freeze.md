# BUG-201 — Preserve Freezing Arrow's advertised Freeze effect

- Status: Fixed locally in32c5918c (data/native regressions), presentation9104ea3c; independent/earned acceptance open. Historical reproduction below.
- Severity: High — an advertised control effect has no reachable runtime effect.
- Source: frozen Conversion runtime, now committed at `f93a4e23`. Actual
  committed source blobs match the reproduction hashes retained in the
  Conversion evidence packet; no Freezing Arrow runtime change was made.
- Environment: Node24.21.0, Vite Node runner with `vitest.config.ts`, real native
  player projection and registered skill catalog. Browser/viewport/locale are
  not applicable to this engine reproduction; both localized descriptions
  advertise freezing. Seeds7/19/41/97, ranks1/20.
- Systems/owners: root acting as engine-dev/content-designer/game-designer/QA.
  Independent acceptance remains open.

## Reproduction

1. Project a synthetic L30 Amazon with the complete Freezing Arrow prerequisite
   chain, rank1 or20 and only Freezing Arrow selected. Preserve real native
   class/skill projection; isolate HP2000/MP100, no mana recovery, zero mitigation
   and one surviving ordinary target. Synthetic Stun holds other actions.
2. Run one real scheduled cast at1700ms for each rank and seed7/19/41/97.
3. Verify exact input immutability/replay,20MP payment, actual damage/status
   events, declared JSON statuses and reachable registered effects.

Expected: authored `[chill,freeze]` must have a reachable Freeze mechanic. The
current description says "sometimes freezing"; no specific chance is assumed
or approved by this reproduction.

Actual: JSON declares `[chill,freeze]`, but the registered damage effect contains
only Chill. Six landed native hits deal51/56/54Cold at rank1 and146/151/149Cold
at rank20 and apply only Chill. Seed41 misses at both ranks; those real misses
still pay20MP and apply neither status. No registered Freeze effect exists, so
the absence is structural rather than an unlucky proc sample.

Root cause: `dataCatalog.ts` accepts a secondary Freeze only when explicit
`additionalStatusEffects.freeze` metadata exists. Freezing Arrow declares the
second status without that metadata. The reverse `[freeze,chill]` repair does
not apply. Do not globally guess a chance for every uncontracted status tail.

Evidence: [native reproduction](../../docs/plans/evidence/d04-freezing-arrow-repro.md).
The first diagnostic incorrectly assumed every selected seed would land and
stopped at seed41 before writing the report. Its source/error are retained;
the corrected diagnostic records misses and preserves the decisive missing-
effect assertion. No runtime change, skipped test, balance credit, workaround
or genuine campaign action is claimed.

Next: author explicit secondary Freeze tuning and correct area/duration copy,
then add rank1/20 native causal/control/expiry/miss/eligibility/replay coverage
before a minimal JSON/schema/adapter repair and integrated browser verification.

## Local repair and verification

[Final evidence](../../docs/plans/evidence/d04-freezing-arrow.md) and
[contract](../../docs/plans/decisions/D04-freezing-arrow-v1.md) preserve the
existing skills-spec15% Freeze, actual3×3 shape and shared1s/boss0.5s lifecycle.
Native causal/status/expiry/geometry/authority/replay27, schema/registration8 and
bilingual UI8 new cases pass. Final full14332/637/two existing skips, engine7499/270,
types/lint/build and four final production browser cases pass. Eight exact
five-domain Continue pairs/20geometry samples; actual committed source/design
blobs and build/genuine hashes match the final tested bytes. Initial10% draft
and all failed/interrupted evidence remain superseded, not final proof.
