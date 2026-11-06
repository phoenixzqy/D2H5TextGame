# BUG-438 — Tainted tier oracle retains superseded rare Attack multipliers

Status: fixed locally, uncommitted (owner excludes commits).
Severity: Medium (QA regression; runtime agrees with the adopted tier contract).
Build: HEAD b5a0898 plus local private-v1 work, WSL/Node24.21.0,
Vitest1.6.1 Node project; browser/viewport/locale not involved.
Affected systems: engine regression; root sole writer.

## Reproduction

Run `src/engine/combat/tainted-action-source.test.ts`. At factory seed7 and
L1/L3/L12/L17, the rare-minion expected Attack vector42/55/113/146 is actually
35/46/96/123; rare-elite expected64/84/174/224 is actually48/63/131/168.
Two failures/nine passes are reproduced by the ordinary engine sweep
`p15-unit-unreached-engine-v1.log` in packet `d2-counted-source-z3jj3xa1`.

Expected: tier/range literals agree with the accepted BUG432 multipliers,
without changing Tainted's poison source, cadence, endpoints or unrelated tiers.
Actual: these two rows still encode the old1.3/2.0 multipliers. The adopted
rare-minion1.1 and rare-elite1.5 produce the received rounded values from
Tainted32/+5. Trash/elite/champion rows and all nine other tests pass.

## Correction plan

After focused reproduction, change only those two proven stale expected vectors,
preserving point ranges, frozen ranges, crit/delivery/action/poison assertions.
No runtime/content/RNG/skill/reward change. Retain the broad failed attempt;
source audit will disclose this exact test-only correction after the file ran,
and focused current-source verification must pass independently.

Security check: pass; local test correction, no credential/network/dependency/
permission/CI/publication changes. Root-cause review: explicit already-adopted
shared numerical contract supersedes the old literal expectations.


Focused RED reproduces2FAIL/9PASS,19.690s. Corrected exact two-row oracle:
`p15-tainted-tier-oracle-green-v1`71PASS/2actualfiles,17.159s (Tainted11 +
monsterAttack60). A nonexistent elite-burst filter matches no file; no credit
is claimed for it. The correct native elite pack regression is included in
the broad ordinary engine sweep. Types PASS14.403s/scoped lint PASS19.155s.
All focused descendants exited; no runtime bytes changed. Broad source audits
must flag this exact test-only edit after its execution, preserving failed
historical broad results rather than relabeling them green.
