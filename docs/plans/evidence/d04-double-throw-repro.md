# D04 — Double Throw's missing singleton second throw

2026-10-25; [BUG215](../../../production/bugs/BUG-215-double-throw-single-attempt.md).
Root author investigation; independent and earned acceptance remain open.

Actual native L30 Barbarian composition includes Bash1 and Double Swing1, then
selects Double Throw alone at ranks1/2/20 ×seeds7/19/41/97 ×one/four enemies.
Synthetic100MP/100000HP and holds after1701ms isolate one1700ms hero action.
Enemies occupy standard `(floor(i/3),i%3)` positions and are held after2001ms.
Inputs remain immutable and exact same-seed recordings agree.

Every case pays12MP once, ending88MP, with one cast. All12singleton cases resolve
one attempt instead of the advertised two throws. Each four-enemy case resolves
one attempt each on its first two enemies, none on the remaining two. The actual
registered Physical50–75/+5rank effect has no sequence or explicit geometry/cap.
The four-enemy result does not itself prove missing multiplicity: the old prose
does not promise two throws at each enemy. A contract must decide how the two
total throws use the original pool before repair. No guaranteed hits/damage or
Double Swing-style two-pass behavior is inferred from the name.

The first copied probe retained the wrong90MP expectation from Double Swing;
it stopped at actual88MP before observations. That fixture failure/script is
preserved. The corrected probe retains the authored12MP and writes all24cases'
complete events/HP/payment observations before the expected final exit1.
Corrected runtime5.678s; this intentional failing assertion is not a passing suite.

The [Double Swing raw packet](fixtures/double-swing/raw.tar.gz) retains both
`double-throw-repro.ts` and `double-throw-repro-corrected.ts`,
`double-throw-observations-corrected.json`, correction notes and both
`next-double-throw*` command logs/live/terminal receipts. Source base7229ffcf plus
the frozen Swing repair is captured by the packet's delivery source audit.

No Double Throw source repair or inventory credit. Genuine Ancients/Rite
L33/XP149261/nextNormal402/Nightmare0/Baal uncleared remains unchanged. No genuine
campaign or remote action. C2–C4/fullG0–G7/all-class earned builds/30–50hour
pacing/economy/endgame/independent acceptance and complete privatev1 remain open.


## Subsequent local repair

`25ae9b20` implements the [author contract](../decisions/D04-double-throw-v1.md). [Delivery verification](d04-double-throw.md) records actual independent original-pool throws, one payment, native save/wave lifecycle and production browser proof. Historical prepatch evidence is preserved; independent/earned acceptance remains open.
