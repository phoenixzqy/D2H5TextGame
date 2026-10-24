# D05 — Native Amazon Critical Strike, Penetrate and Dodge

Status: implemented and locally verified. Independent acceptance and full C3/G2
remain open.

## Behavior and scope

[Contract](../decisions/D05-amazon-passives-v1.md) and
[BUG158](../../../production/bugs/BUG-158-amazon-passive-composition.md).
The native fresh hero factory now consumes the three authored allocations:
Critical Strike adds .01 critical chance per rank, Dodge adds .01 physical dodge
per rank, and Penetrate multiplies equipment-derived Attack by 1+.03×rank.
Unlocks remain1/6/18 and caps20. Penetrate retains ordinary Critical Strike
learning prerequisites. The old accuracy/dodge description is superseded by
its actual authored `attackPct` contract.

One shared immutable resolver validates and copies the three JSON definitions.
The exact authored/canonical aliases contribute their maximum valid positive
integer rank once, clamped to the copied cap. Only eligible player Amazons
receive modifiers. Equipment and persisted stats remain separate; resource
pools and carry do not refill. Passives introduce no cast, cost, cooldown,
status marker, RNG draw, save field/version or ally inheritance. New waves and
explicit replay recompose; original recordings remain immutable.

Exact schema guards require passive/self/zero-cooldown metadata, positive
integer unlock/cap, and the correct sole nonnegative finite coefficient.
Contradictory paid/active/damage/status/utility fields are rejected. Other
identities and valid alternative tuning retain their existing contracts.
Both descriptions and current/next detail values are checked in zh-CN/en;
descriptions interpolate the copied JSON tuning.

## Causal and regression evidence

- Original native factory:6 causal failures/6 other-class controls pass.
- Exact schema:3 causal failures/7 controls pass.
- Native learning/next-wave and reset/replay:2 causal failures. The corrected
  cap fixture uses L60 so60 allocated ranks plus3 unspent obey the XP budget.
- Detail prose:6 failures in both languages, with18 missing-prose assertions;
  current/next and native rank-up controls already pass.
- Integrated focused checks:58 tests across five files, comprising
  immutable tuning/rank25, schema10, factory/damage15, native lifecycle2 and
  bilingual UI6. The first49-test integration and expanded21-test UI/consumer
  run both pass; the complete set is also part of the full suite below.
- Engine:5748 tests/177 files pass,82.73s. Actual seed1 basic crit damage160→256
  confirms Penetrate; fixed64-seed oracles confirm additional crits and physical
  misses. These constructed opponents prove consumers, not numerical balance.
- Strict types, final full lint and production build pass. Rebuilding after the
  JSON whitespace-only correction reproduces all760 static files byte-for-byte,
  including four bridge-free JS chunks.
- Full unit result:11658 pass/449 files, two existing skips,522.21s.

The schema skill references `npm run validate:data`, but this repository has no
such script. Exact Ajv schema, authored-row/load tests and the actual engine/full
suite provide the recorded validation; no nonexistent command is claimed.
Test-time budgets remain exceeded; existing unit warnings, build chunk size,
PWA manifest precache and portrait issues are not closed by this slice.

Retained unsuccessful setup attempts: first schema integration failed Ajv
`strictRequired` before test collection; a consumer oracle initially assumed
seed1 was noncritical, corrected to its actual deterministic crit; initial lint
reported three test-only style errors; fixture preparation first imported the
wrong XP helper. These are not causal gameplay reproductions. Original reports
remain in the raw archive.

## Production browser

Separate static output/port4431; no test bridge or writes into the genuine
campaign context. Inputs are explicitly constructed L30 learning and L60 cap
Amazons, using canonical current quest/equipment stat derivation. They are not
earned Amazon campaign checkpoints or pacing/balance evidence.

The first proof stops before learning because its input lacked canonical
inherited quest Life/fire/cold bonuses. Exact import comparison detects this;
the input generator is corrected instead of weakening the assertion. The
initial input, stopped export, report and screenshot are preserved.

Corrected proof:36/36 cases across three skills, both locales and five sizes
(360×640,412×915,640×360,1280×800,1920×1080), plus mobile cap checks. Ordinary UI
learning/rank-up consumes exactly six points, shows rank2 current/next values,
and preserves original inventory/map state. Both contexts run real Blood Moor
combat and observe native victory without passive casts. Six complete
Save→close→new-page Continue pairs match exactly; cap imports/exports match
exactly. Zero page errors, console warnings/errors or horizontal overflow;
checked detail controls meet44×44px. Representative English mobile and Chinese
desktop screenshots were visually inspected. All browser contexts are closed.

Source snapshot:900 files unchanged across browser verification. Four production
JS chunks contain no test-bridge identifiers. Final build manifest remains
identical to the browser input build. Raw archive and manifest are under
[fixtures/amazon-passives](fixtures/amazon-passives/).

## Review, campaign isolation and cleanup

Root self-review: the missing behavior is repaired at fresh composition, using
authored tuning and existing damage consumers. It avoids executable passive
casts, persisted bonuses or alterations to ordinary damage/crit/dodge formulas.
No network, dependency, credential, CI, permission or save-shape change.
Independent source/QA acceptance remains pending; no PR/merge is authorized.

The simultaneous genuine farming run continues on the frozen6faa46f production
bundle. Before any old source edits,882 source hashes were verified against that
immutable Git object and the then-current worktree, all760 dist files frozen,
and all four actually served chunks matched. Its audit validates that immutable
Git source and unchanged served/dist payloads, and explicitly records only the
five known Amazon working-tree source changes. It does not claim the current
worktree is unchanged. No constructed save is promoted to the earned campaign.

The exact disposable production dist is removed; preview session75844 is
terminal and port4431 is closed. Cleanup is verified in the fixture manifest. Task raw evidence remains root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/amazon-passives`
through dependent source/QA/full-v1 consumers; root removes it after those
consumers finish. Full campaign,213-skill coverage,14 viable builds, economy,
30–50h pacing, C2–C4 and complete G0–G7 remain open.
