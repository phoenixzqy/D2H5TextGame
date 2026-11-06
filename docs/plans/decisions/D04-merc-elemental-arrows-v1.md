# D04 — Mercenary elemental arrows v1

Status: bounded native mechanic implemented; broader acceptance remains Open.
Scope: `mskill-fire-arrow` and `mskill-cold-arrow` only.

## User choices

- Fire preserves the full physical hit and adds50% Fire:30physical+15Fire.
- Cold splits the total equally between physical and cold, with30% chance to
  Chill for2seconds. No further user question is pending.

## Implementation defaults and boundaries

Both use base22–36 plus100% snapshot Attack,0MP,2s cooldown and flat ranks1–20.
P denotes the one rolled base plus Attack before increases/crit/mitigation.
Fire components are explicit1P physical and0.5P Fire; Cold uses0.5P each.
One physical accuracy/base/critical roll serves both primary components;
type-specific modifiers and mitigation follow. These defaults are not claims of
user-approved balance tuning or finished campaign calibration.

Fire captures up to2 additional hostile IDs in the original primary's
cross-adjacent cells before settlement, in existing priority. Each independently
attempted Fire splash uses unrounded0.5P, ordinary magical accuracy and its own
critical, with no second Attack/base roll, Aim/contact/recursive splash. Preserve
center after lethal primary; an absorbed landed primary triggers splash. Stop
when the source dies; revalidate each captured recipient's life/hostility and do
not refill. Existing registration supplies missing/invalid grid positions.

Primary authored Fire and splash Burn use canonical ignite for3000ms at
max(1,floor(.1*final Fire damage)) HP/second per stack. Separate paid Enchant Fire
is excluded. Cold has one.3 proc on its cold component,2000ms canonical.5 speed.
Use existing status eligibility/death/stacking/refresh behavior. Ranged primaries
retain native delivery/Aim authority; splash is auxiliary contact-none. Preserve
Basic/Pierce resolution and Lightning-only impact-bolt metadata.

Strict exact-ID schema/resolution, unique rows, explicit costs/ranks and copied
immutable runtime definitions replace the placeholders. Both languages' skill
and recruitment text and the gacha design row agree. No save-version change,
new dependency, projectile timer, movement/range stat or Attack Rating system.

## Verification and retained acceptance

[Native evidence](../evidence/merc-elemental-arrows.md) records intended causal
RED, transparent V2 canonical-ID and V3 typing-only primary supersessions, reviewed
runtime/fixture corrections and final mapped checks. The corrected frozen
primary SHA256 is
`77619973d1ea4b3d122bcbdb3c0b794a74df57493358e52c3811d69b61859f46`.
Original RED applies to unchanged damage assertions; V2 and V3 were not executed
in the original RED. Reviewed Vengeance list migration and lint-only typed status
assertions preserve every damage/status expectation. Imported survivor fixtures do not establish earned play.

Final ordinary units pass 21,883/21,883 tests across 1,032 unique permitted
files, including all 11,942 engine tests / 443 files; zero failed/pending/todo.
Focused245/7 and Vengeance16/1 pass. Strict types, full zero-warning lint/engine
purity and boundary audit pass on unchanged2,129-input map
`c15fef6eee49a18560aabb01e77c9dded26e77dd0778a4bb18e0ada7d98f4953`.
The production build passes on predecessor map
`4d68bbff7765ded4a60dc51c279582075d3a2d0ff0e2b59cb2cb3211da17e726`;
only the three approved test files changed afterward. No fresh build, timing
budget, browser, earned-play or full-v1 acceptance is claimed.

No broader campaign, economy,14-build, pacing, defeat/retry, browser/device,
a11y/performance/PWA, actual CI, human/soak or full-v1 acceptance is established.
The inherited H3 terminal-no-app/protected-fixture/diagnostics/closed-matrix/
lineage/remote/worktree/new-agent restrictions remain. BUG180/366 timeout
recurrence stops source continuation. Root remains sole writer in the existing
claimed worktree, preserving required evidence and uncommitted changes.
