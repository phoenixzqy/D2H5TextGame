# BUG-214 — Double Swing resolves one attempt per selected enemy

- Status: locally fixed in `0269609e`; independent and earned acceptance open.
- Severity: High — the advertised two-strike skill has no second attempt.
- Owner: root; independent design/QA and earned balance remain open.
- Build: `059228dd` plus the frozen, uncommitted Leap repair; Double Swing
  data, registration and shared attack behavior are unchanged.
- Environment: Node24.21.0, native L30 Barbarian, real default registry and
  Bash1 prerequisite; ranks1/2/20 ×seeds7/19/41/97 ×one/four enemies.
- Browser/viewport/locale: engine probe only; both existing en/zh-CN skill
  descriptions promise two swings and up to three enemies.
- Affected systems: authored hit sequence, area target selection and display.

## Reproduction

1. Compose learned Double Swing as the native Barbarian's sole priority.
2. Use synthetic100MP/100000HP and one hero action at1700ms; hold the hero
   from1701ms. Hold enemies after2001ms to isolate that paid cast.
3. Place one or four enemies at valid positions `(floor(i/3),i%3)`.
4. Record actual events and exact replay, preserving the original input.
5. Count actual damage attempts, including misses, per original enemy.

Expected: an accepted contract implements the advertised repeated attempts and
defines the up-to-three-target selection. This reproduction does not invent a
shape, guarantee hits or choose a new per-attempt damage value.

Actual: each of24cases has one action and one10MP payment. All12single-enemy
casts resolve exactly one attempt. All12four-enemy casts resolve one attempt
on each of the first two enemies, with none on the other two. The registered
effect has no sequence, shape or maximum-target metadata. Native damage and
ordinary miss outcomes settle once; no second strike exists.

The original four-enemy probe put the fourth enemy at column3, outside the
standard three-column layout. The engine accepts nonnegative coordinates, so
that position is not rejected by its validator. The corrected24case run uses
the standard layout to remove geometry ambiguity and reproduces the same
attempt counts. Both scripts/observations are retained. Complete observations
precede the intentional exit1.

Evidence: [native reproduction](../../docs/plans/evidence/d04-double-swing-repro.md).
No Double Swing repair/credit, genuine campaign or remote action.


## Local repair

`0269609e` implements the [author contract](../../docs/plans/decisions/D04-double-swing-v1.md):
two independently settled passes across a fixed capped cross, no dead-target
replacement/redistribution and one payment/CD.38new cases/four files cover
schema/adapter/pure display, actual combat/playback, native save/wave lifecycle
and bilingual UI. Focused38/4, compatibility129/6, loader1/1, types/lint/build,
production4/4 and full15063/683/two existing skips pass.
[Delivery evidence](../../docs/plans/evidence/d04-double-swing.md) retains original
REDs, synthetic fixture limits, hashes and exact task-owned cleanup. Independent
design/QA/earned balance stay open; the historical reproduction above remains.
