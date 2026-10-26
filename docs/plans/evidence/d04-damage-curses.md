# D04 — Iron Maiden, Life Tap and Lower Resist

2026-10-26; BUG246; core29191112, presentation/native/publica6f9e19b,
fractional reflectione165a1dd over7883b882. Root author evidence only.
The first full-unit run found one stale Life Tap copy oracle;65d055f7 corrects it.
The corrected full suite passes17513tests/794files/two existing skips. Exactly
three bounded-functional inventory credits are justified by the local evidence.
Independent design/QA, earned builds and balance remain open.
[Contract](../decisions/D04-damage-curses-v1.md),
[original bug](../../../production/bugs/BUG-246-apply-necromancer-damage-curses.md).

## Result and design authority

The original native skills paid their correct mana but applied inert one-second
markers. Authored JSON now supplies three finite3000ms curses: Iron Maiden100%
actual hostile Physical HP-loss reflection, Life Tap25% actual hostile direct
HP-loss healing, Lower Resist30percentage points off all six resistance pools.
These are explicit provisional root-author choices, not recovered numeric source
authority. Existing unlocks/prerequisites, all-living-hostile targets, cap20,
rank costs,3s cooldowns, native ownership and save22 are preserved.

Paid copied/frozen packets refresh without stacking, support Cleansing and
fractional/rebased clocks, survive source absence, and confer power only on
complete matching finite intervals. Bare, future, expired, mismatched and
nonfinite packets grant no effect. No cast hit/proc RNG or direct damage is added.

Iron Maiden uses actual Physical HP removed after absorption and overkill caps;
one RNG-free Thorns reflection settles per direct strike, including composite
hits and lethal victim hits. Ordinary Thorns keeps its living-defender rule.
The reflected recipient's existing Physical resistance/Defense and personal
absorption apply once. No recursive reflection or Life Tap on reflected settlement.

Life Tap captures pre-hit eligibility, then floors/caps healing to the surviving
attacker after ordinary deaths/orbs/reflection. It never resurrects. All direct
damage types share the settlement, including merc/summon hits, composite/coated
hits, pulses and counterattacks. Existing DoT, absorption, overkill, reflection
and self-debits supply no extra recovery. Lower Resist adds with existing aura/
Amplify/Cold Mastery projections before act penalties, clamps and flat mitigation;
Thorns uses Physical. Existing DoT rates stay unchanged; new hit-derived rates
snapshot the modified hit with existing integer floors. Base stats/cadence and
ordinary hit/crit rolls remain unchanged.

## Causal and automated evidence

Original native seed1 RED18failed/12controls,exit1,7.691s. At400ms a legal native
rank1/20 caster pays11/6MP,9/5MP or22/16MP. At500ms the corresponding actual
outcomes change from no reflection to100reflected, no recovery to25healed to
the attacking merc, or40to70damage across all seven damage types against50%
resistance/10flat mitigation. Inert matched controls retain the same native
action, payment, cooldown and RNG sequence. Inputs remain pure and recorded/
unrecorded/repeated runs agree.

Latest focused231tests/eight files pass15.920s, including138new regressions:
45engine/schema/status/consumer,24pure preview,39native causal/authority,
24bilingual component, six native lifecycle/import. They cover complete/invalid
source authoring, copied tuning, exact active boundaries, refresh/Cleansing/
rebasing, all hostile tiers/dead exclusions, mitigation/shields, actual lethal/
overkill HP, no resurrection, composite once-only settlement, seven direct
types, misses, fully absorbed hits, supported Sacrifice self-debit isolation,
resistance composition/clamps and old/new DoT isolation.

Native lifecycle tests legally allocate transitive prerequisites, freeze the
current recording across learning/upgrading, refresh rank/stats next wave
without refilling absolute HP/MP, and roundtrip learned configuration through
real snapshot/import while clearing transient combat. Only persistence I/O is
mocked. Constructed levels, pools and gear do not establish earned builds.

Previews validate their supplied authored metadata, including a changed finite
2.5s/40% input, rather than showing only global defaults. Unlearned/current/next/
MAX costs and rules are localized without player mutation. Chinese Life Tap
status copy now agrees with its skill name.

Fixture corrections retain original failures: eligible player-only Bone Armor;
existing JS114.99999999999999floor114; complete negative heal shape; preservation
of original Physical/amp-damage tags; unsupported target:self damage replaced
by the real onHitSelfDamage debit; absent optional fields represented without
assigning explicit undefined; two redundant conditions removed for lint. No
assertion skip, dependency, policy or global arithmetic workaround is introduced.

The first complete full run finishes1failed/17512passed/two existing skips in
794files,exit1,734.789s. The existing Chinese shared-log table still expects
Life Tap偷取生命, while the intentionally aligned combat label and pre-existing
skill name both use吸取生命. Correct only that table literal, preserving exact
full-message equality, both locales and every case. Retain the original RED.
The source-freeze revision changes onlysrc/stores/eventToLogI18n.test.ts;
all1584other paths and762build files are exact, so engine and production-browser
proof remain unchanged. The corrected shared-log/component suite passes138/2 in9.928s. Latest types
and lint pass96.426s/163.883s; the corrected full suite passes17513/794 with
two existing skips,exit0,737.693s. Actual committed source proof matches65d055f7.
The original failed full run remains retained; no assertion or threshold is weakened.

The final author review found a separate real fractional counterexample:
eligible Bone Armor absorbs99.5of100Physical damage, so only0.5HP is removed.
Pure Iron Maiden inherited ordinary Thorns' minimum1instead of its contracted
floor0. The meaningful RED was1failed/44passed,exit1,3.793s. The correction
applies minimum1only when living ordinary Thorns contributes; pure curse
reflection floors to zero and emits no zero-damage settlement. Two new cases
assert both actual HP outcomes. The earlier12/12browser pass predates this
repair and is retained as superseded proof; production checks usee165a1dd;65d055f7 changes only the shared-log test oracle.

## Production browser and visual evidence

Final public en/zh-CN ×desktop/mobile checks pass12/12,exit0,588.764s,
with no retries/skips/flakies/page or console errors on the corrected production
build. All test saves/gear/pools are explicitly synthetic. Public controls create
a Necromancer, import native prerequisites and rank19, equip, allocate19→20,
cast with a localized hostile chip, win Blood Moor, return to town, Save, close
the page and Continue online and offline. No test bridge is present. Numeric
consequences are established by native/engine tests rather than browser logs.

The separate report decoder checks12actual localized casts/chips,
24exact six-domain save pairs,12actual service-worker offline Continues,
60geometry samples across five sizes and24actual PNGs. The allocation control
is48px high; geometry checks establish no document horizontal overflow.

The initial browser run was deliberately interrupted after lint required a
production conditional cleanup: three passed, one interrupted, eight did not
run; exit130. It is retained as diagnostic evidence and grants no final proof.
All24final PNGs were individually inspected and hash-indexed. The six desktop
previews show complete bilingual descriptions, costs,3s duration/cooldown,
100%/25%/30point potency, MAX and prerequisites. Six mobile element captures
show readable rules/current values but clip the heading/MAX top and omit lower
requirements or next-level sections around header/navigation boundaries.
Navigation glyph boxes remain. All twelve victory captures show clipped
toolbar/loot and large black regions; the victory heading/return control is
not readable in those captures. Actual victory visibility and ordinary return
are asserted separately by the browser. These images do not establish complete
mobile UX, accessibility, hit testing or numeric consequences. BUG063 is already
fixed/accepted in5e4a038 and the current shell reserves HUD height in normal
flow; screenshot clipping alone does not prove that defect returned or diagnose
a new layout cause. Full UX and runtime performance remain unaccepted.

## Validation and integrity

Initial engine8668/325PASS127.551s; pre-fractional engine8689/325PASS159.947s.
Latest engine8691/325PASS142.574s; corrected typesPASS96.426s;
lint/purityPASS163.883s. Latest official build/bridgePASS16.855s,
six JS chunks scanned. Actual precache
verifierPASS756unique URLs, all required assets present,missing[]. All1585
source/test/config paths and762emitted build files are frozen. Original and
corrected type/lint failures and source-freeze revisions remain retained.
Final full-unit17513passed/794files/two existing skips,exit0,737.693s.
All1585actual committed
source blobs at65d055f7 match the tested freeze; all762build files remain exact.

Existing chunk-size/Browserslist and optional2.57MB art-manifest precache warnings
remain. Workbox limits are unchanged. Test-loop budgets are exceeded; no runtime
performance acceptance is claimed. The protected earned save's compressed/raw
SHA256s remain3bbae6c0499844e7423574124326c65c616f8f3912a760aa913ea9eab410022c/
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577.
No genuine campaign action or replay occurred.

## Acceptance, retention and remaining work

Exactly Iron Maiden/Life Tap/Lower Resist gain bounded-functional credit:
158bounded/53unverified/one engine-only/one review-needed; Necromancer16/32.
The other210raw CSV rows, header,213IDs and order are exact.
Independent design/QA and earned balance/builds remain
open. GenuineL33/nextNormal402/Baal uncleared, C2-C4/fullG0-G7,30–50hour pacing,
economy/endgame and full privatev1 remain unfinished.

All validation consumers are terminal. Raw retention verifies184members byte for
byte across41terminal receipts, including the meaningful original failures,
superseded browser runs, source/build freezes, final metrics and24inspected PNGs.
The [versioned manifest](fixtures/damage-curses/manifest.json) verifies38evidence
files; [cleanup](fixtures/damage-curses/cleanup.json) records exact portable deletion
of1059task-owned files/57directories. All71recorded process identities are gone,
no consumers remain,4529is closed, task root and disposable dist are absent,
remaining[]/failures[]. The author review precedes cleanup; this record and the
cleanup receipt provide final artifact closure. No shared cache or tool removed.

Root retains the archive and three sidecars below through BUG246/full-v1 evidence
consumers, and removes these exact paths when all those consumers finish:

```text
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-damage-curses-ef0g_tk9-retained.tar.xz
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-damage-curses-ef0g_tk9-retention.json
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-damage-curses-ef0g_tk9-deletion-manifest.json
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-damage-curses-ef0g_tk9-cleanup.json
```

ArchiveSHA256:46ebf46d226790319b1748a2513effa4f910823e5b8b6841a7f3d40e6fca9c8a.
The archived next Terror contract/test are explicitly unrun drafts, not a fix or
credit. Keep the umbrella worktree claim while full-v1 work continues.
