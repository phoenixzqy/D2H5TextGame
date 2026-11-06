# Act II Javelin elemental gear and retained retry

Private v1 is incomplete. The current earned Javelin successor is level 24,
normal ordinal 293, still before Arcane completion. Radament and Staff remain
complete; Duriel and Act III are unreached. No completed farming or quest action
was replayed, and no new fresh campaign was created.

## Maintained change

BUG-562 corrects the Act II property gear policy: it now scores equally weighted
120-raw physical, lightning, cold and arcane hits. The other acts and existing
attack, attack-speed and maximum-mana floors are unchanged. Hero and fielded
merc selection still use native eligibility and transfers of owned items; there
are no grants, purchases or socket operations.

Four new native equipment regressions fail under the old policy and pass with
the change. The two affected suites pass all 26 tests; scoped strict types and
explicit lint of maintained files pass. No unaffected act/build, full suite,
browser or CI was rerun. Production/data and all 2,091 original provenance
inputs are unchanged. Supplemental campaign source authority 9 binds the two
changed files.

## One bounded native retry

Frozen continuation 2 starts from exact level 24/ordinal 292. It permits one
Arcane admission and, only after success, one Duriel admission; stop on the first
nonwin, with a 180-second execution allowance. Actual execution uses only the
Arcane admission: three waves, two victories and one defeat, 6,960 earned XP,
24,372.044 ms combat. The complete retained chain is 293 admissions, 1,136 waves
and twelve defeats. Every earlier failure remains intact.

Six owned equipment transfers raise hero lightning resistance 23→46 and cold
48→65. Hero Life maximum changes 506→480, defense 158→166 and maximum mana
297→302. These property changes do not establish an improved win rate: this
attempt has a different native ordinal from the earlier failed attempt.

Wave one ends with 475 Life. Wave two ends with 206 Life after 184 direct damage
(161 physical, 12 fire, 6 arcane, 5 poison) and 102 periodic damage, with native
orbs included in resource accounting. Wave three deals 124 lightning and 134
physical damage, including a 131-point critical hit; reported damage includes
overkill. The hero is stunned at 2,264 ms and dies at 3,240 ms after one basic
attack, before the next Lightning Strike. Mana remains available. The retained
flayers have 225 attack, or 337.5 before mitigation on a 1.5× critical hit. The
current 120-raw physical probe does not represent that burst, and the policy
does not model whole-area periodic attrition.

Next compare actual eligible owned mitigation against those physical hit sizes
and the full-area fire/status pressure, before freezing another adaptation.
Do not use repeated seeds alone as an adaptation, repeat completed training, or
claim this exploratory chain meets first-attempt/within-three acceptance.

## Accounting and preserved failures

The first launcher stopped during historical-readback preflight, before any
admission or journal creation; its driver, policy and failure record remain.
The corrected launcher records the actual retry. Its economy and quest audits
pass, but its scratch audit incorrectly expects no training checkpoint when a
target is already earned. The maintained controller correctly emits a successful
zero-admission checkpoint. The original receipt keeps both accounting errors.

Readback 1 also refuses a missing historical first-stage prefix. Readback 2
uses the retained first stage and production campaign auditors to reconcile the
new zero-admission stage and route recovery, without new combat or save edits.
All failure receipts remain. For future continuation, pair the raw result with
readback 2 rather than treating the raw audit errors as a gameplay failure or
rewriting that receipt.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Authoritative files are `p15-javelin-act2-elemental-continuation-v2.json`, its
frozen driver/policy/native journal, `p15-javelin-act2-elemental-readback-v2.json`
and `p15-javelin-act2-elemental-diagnosis-v1.json`. Cleanup and terminal checks
are recorded in `p15-javelin-act2-elemental-artifacts-v1.json`.

Accepted balance cells remain zero. Full fourteen-build/five-act acquisition,
economy/fairness, 30–50 active-hour pacing, disjoint holdouts, retry/manual/idle,
G0–G7, soak/review and owner playtest requirements remain active. Browser works,
CI is excluded and no answer is pending from the owner.
