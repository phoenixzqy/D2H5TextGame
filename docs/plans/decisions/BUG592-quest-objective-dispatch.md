# BUG592 — dispatch quest objective validation by type

Status: retained after affected checks and matched browser readback. Full private v1 remains open.

The retained mobile inventory profile attributes about 151 ms of overlapping
inclusive samples to repeated `loadQuests` calls. Each call freshly validates
both authored documents. The objective schema's 17-way `oneOf` checks every
closed payload, including payloads with unrelated type tags, creating errors
which are discarded even for valid objectives.

Replace only that union's dispatch with standard draft-2020-12 conditions:
require an object and a known type, then validate the exact existing payload
for that type. Keep both `deliver` variants under their existing `oneOf`, and
keep the three `interact` variants unchanged. Every leaf retains its required
fields, closed properties and value constraints. No Ajv options, caches,
caller APIs, loader freshness, action validation or gameplay data change.

An external probe first compares the original schema and candidate on 5,862
authored-objective/field-perturbation documents: 369 accepted and 5,493 rejected,
with no mismatches. Fifteen alternating warm Node pairs reduce median validation
of both documents from 1.260 to 0.235 ms. This is screening, not browser evidence
or a proof over arbitrary non-JSON JavaScript objects.

Plan review: ready. Preserve the baseline schema and candidate, finish the
same-source browser baseline before changing production inputs, then apply the
single-schema change. Run the existing quest loader/item/counted/reward and
quest-panel checks; compare native and browser-generated validators, full native
and portable save identity, and matched desktop/en and mobile/zh inventory
timings using the same earned save. No campaign or unrelated suite replay.
Reject a candidate which changes supported acceptance, corrupts state, or adds
an unexplained material performance regression. Record diagnostics honestly;
this increment cannot close all of BUG592 or any balance acceptance case.

Security check: pass. Scope is first-party local schema validation and retained
CPU/save evidence. Closed payload checks and transaction guards remain; no
credentials, installs, grants, publication or external requests are involved.

Evidence is retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `bug592-quest-dispatch`. Driver-owned caches are disposable after their
consumers finish; source snapshots, reports, profiles and readers remain with
root through umbrella review. Root retains the existing worktree claim.

Final verification: 394 affected tests pass. A second 1,013-case corpus covers
all 19 closed payload variants, with no acceptance mismatch or input mutation;
the actual generated browser validator passes those cases in both locales.
The independent reader verifies every current production/campaign input,
unchanged payload definitions and complete saved state. Authority70 changes
only this schema from69. Mobile initial opening2356→1750ms and warm median
1149→1052ms improve; desktop464→440ms/421→417ms is roughly unchanged.
These are shared-machine development diagnostics. BUG592 stays open.
See [report](../../balance/2026-11-02-quest-objective-dispatch.md).
