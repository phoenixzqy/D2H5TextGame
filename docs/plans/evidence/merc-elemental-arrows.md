# Native mercenary Fire/Cold Arrows — BUG-381

Bounded native repair implements the user's two damage choices on parent
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, preserving the retained native
changes. BUG-381 and broader feature acceptance remain Open.
[Mechanic contract](../decisions/D04-merc-elemental-arrows-v1.md).

## Behavior and authority

Let P be one ordinary base roll22–36 plus100% snapshot Attack. Fire retains
physical P and adds0.5P Fire on the primary; Cold splits P equally between
physical and cold. Each primary shares one physical accuracy/base/critical
roll, with ordinary type-specific increases, resistance, flat mitigation and
flooring per component. Fire fractions are explicit1/.5, never normalized2:1
shares of P. Unrelated normalized component skills remain unchanged.
Both arrows cost0MP, have2s cooldown and flat ranks1–20. These numbers and
accuracy-channel choices are implementation defaults; the two damage splits
are user decisions.

A landed Fire primary, including an absorbed hit, captures up to2 additional
living hostile body IDs in cross-adjacent cells around its original center,
using existing target priority. The primary is excluded; hostile summons
qualify. Each splash carries unrounded0.5P through its own ordinary magical
accuracy, critical, increases and mitigation, with no second Attack/base roll,
Aim, melee contact or recursive splash. Primary death preserves the captured
center; source death suppresses remaining auxiliary hits. Captured recipients
are rechecked for life and hostility without replacement. Native registration
normalizes missing/invalid grid positions before damage; distant9,9 is a valid
unbounded grid center with no adjacent test recipients.

Authored primary Fire and landed splash apply Burn through the canonical
`ignite` status,3000ms at max(1,floor(.1*final mitigated Fire damage)) HP/second
per stack. Separately paid Enchant Fire contributes neither Burn nor splash
budget. Cold attempts one30% Chill proc on its cold component,2000ms with the
canonical0.5 speed multiplier and existing eligibility/expiry rules.
Authenticated ranged primaries may use Blessed Aim; splash retains ordinary
accuracy. Genuinely paid mercenary Frozen Armor receives positive native arrow
damage without chilling the ranged attacker. Delivery authority still rejects
custom same-ID replacement. Basic/Pierce and Lightning-only impact bolts retain
their separate contracts. No persistence version or dependency changes occur.
Both locales, recruitment lore and gacha specification describe these mechanics.

## Primary lineage and retained failures

The four actual pool→factory→projection→recorded battle cases use ranks1/20,
Fire seed7 and Cold seed3, with imported survivor pools rather than earned play.
At Attack10, the primary base22 gives P32: Fire32physical+16Fire with two16Fire
splashes; Cold16physical+16cold with one seed3 Chill proc.

Original primary SHA256
`0e60c70c6492850fff72962224e9a575839659bc16210f5609fe93123fd7552d`
causally fails all4 damage arrays before repair: the old stubs emit only25Fire
or25cold. No collection/setup/timeout failure occurs. RED map
`fc2342e2728aa13e5713a71242d20ea2cf4b12b42668a2b06f4bef15f39655a6`;
report SHA256
`41032c910b04b5ce541b14a6b98ede4112c94ee6e80a71f6255c8d15ad240276`.
BUG-381 is filed before production repair.

First GREEN passes both Cold cases and all literal damage arrays, but both Fire
cases then fail a mistaken committed-status filter for `burn`. Independent
review approves only that filter's correction to canonical `ignite`, explicitly
superseding the original freeze requirement. V2 SHA256
`770d2beff4242b71c71779fe86e9a8b15e05701375d0f28c1e759380f4796c06`
passed the four cases. Full lint then identifies an unnecessary optional chain
on required `skillOrder`. A second independently reviewed, typing-only freeze
supersession removes only that chain. Final V3 SHA256
`77619973d1ea4b3d122bcbdb3c0b794a74df57493358e52c3811d69b61859f46`
is frozen for final runs. Original RED remains evidence for unchanged damage
assertions; neither V2 nor V3 was executed in the original RED. Original candidate, freeze, RED and
first-GREEN failure remain retained; there is no production alias workaround.

Initial schema checks expose strict-Ajv declaration/conditional mistakes,
corrected before the33-case final definition suite. First combat passes12/16:
one real premature fractional-splash rounding defect is fixed only at the
private derived-payload input boundary. Independent fixture corrections account
for seeded misses, flat defenses and valid source-bound Bone Armor. A reviewed
candidate also catches the extra enemy target-selection draw (P46, absorbed
46/23, splash23). Extended first focused passes243/244; the remaining oracle
incorrectly expects no splash after missing-position normalization. Its exact
reviewed correction asserts normalization and separately tests a distant valid
center. All failed candidates/logs/maps remain. Historical stub assertions are
migrated only for the two replaced arrows, retaining unrelated assertions and
adding explicit native reference checks. Broad engine then passes11941/11942
cases across442/443 actual files: the sole failure is an outdated Vengeance
component opt-in list. Independent review approves only its title and addition
of the two native arrow IDs; all Vengeance math/status assertions stay intact.
Full lint fails three test-only rules: two nested Vitest matchers assign `any`
to a property, and the primary uses an unnecessary optional chain. Reviewed
typed status-state assertions retain targets, clocks, IDs, rates and expiries;
primary V3 removes only the chain. No suppression or skipped test is added.

## Validation and input binding

| Check | Result | Elapsed | Retained receipt |
| --- | --- | ---: | --- |
| Final focused (primary V3 included) | 245/245 tests, 7 actual files | 23.968s | `arrows-focused-v3-result.json` |
| Vengeance migration | 16/16 tests, 1 actual file | 9.753s | `arrows-vengeance-final-result.json` |
| Ordinary full units | 21,883/21,883 tests, 1,032 unique permitted files; zero failed/pending/todo | 1509.840s | `arrows-unit-final-result.json` |
| Engine subset of ordinary units | 11,942/11,942 tests, 443 files; included above, not a separate rerun | included above | `arrows-unit-final.json` |
| Strict types | exit0 | 251.895s | `arrows-types-v3-result.json` |
| Full lint / engine purity | exit0, zero warnings, 8GB heap; 443 engine files | 403.087s | `arrows-lint-v3-result.json` |
| Test-boundary audit | exit0; 1,032 tests / 1,626 source modules | 4.778s | `arrows-boundary-v3-result.json` |
| Production build on predecessor map | exit0; only three test files changed afterward | 19.928s | `arrows-build-final-result.json` |

Final focused, Vengeance, ordinary unit, types, lint and boundary checks bind
the unchanged2129-input map
`c15fef6eee49a18560aabb01e77c9dded26e77dd0778a4bb18e0ada7d98f4953`.
The successful build binds predecessor map
`4d68bbff7765ded4a60dc51c279582075d3a2d0ff0e2b59cb2cb3211da17e726`;
`final-source-delta.json` proves only three test files changed afterward. No
product runtime changed, and no build rerun is claimed.
Definition33 includes all29 authored mercenary rows and metadata rejection on
unrelated rows. Native combat27 covers literal typed totals, unrounded odd-P
criticals, independent accuracy/criticals, mitigation, primary miss/death,
absorption, source death, geometry/cap/order, native paid Enchant, paid Armor,
Aim exclusions, Burn integration, actual Cold cadence, replay and fresh factory
projection. Primary4 and historical controls complete focused245/7 files.

Independent producer reviews approve the contract, primary/supersession,
implementation, precise fixture migrations, strengthened actual Armor-wearer
assertion and bilingual descriptions. Exact review/install receipts, source
maps, reports, commands, environments and terminal process records are retained.
Build warnings remain: stale Browserslist data, chunks over500kB, external output
not automatically emptied and the2.57MB generated asset manifest excluded from
precaching. Build success establishes no browser/offline acceptance.

Root retains required exact candidates, failures, reports, commands,
environments, maps and reviews at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-elemental-arrows-kuokdas2`
through unfinished acceptance and owns eventual exact-path cleanup.
`final-native-audit.json` recomputes the map, verifies all reported paths are
unique/permitted, zero failed/pending/todo, and the complete engine subset.
Full report SHA256
`45ac81659cbe4421fa80e8f82fe1641a47d2063cbfb38b48eced6841e071b9a1`.
All23 recorded checks are terminal; all46 recorded child/driver PID observations
are absent. No process termination occurs. The disposable build is already
removed:762files/42,329,441bytes, exact root absent; `build-cleanup.json` retains
digests and the receipt. No unregistered files or cleanup failures remain.
Required evidence, deliverables and uncommitted source stay retained; no commit,
push, remote action or worktree release occurs.

## Limits and retained boundary

These are constructed native checks, not earned acquisition, balance calibration
or evidence for30–50 active player hours. Campaign/economy/14-build viability,
pacing/defeat-retry/devices/locales/a11y/performance/PWA/actualCI/human/soak and
full-v1 acceptance remain unresolved. The separate two-hour soak is unverified.
BUG-377/378/379/380 and BUG-381 remain open beyond their bounded native evidence.

H3 remains terminal `H3_PREREQUISITE_FAILED_NO_APP`: no app/browser/alternate
launch/retry. Protected earned-endgame4 retained-final fixture access/replay,
diagnostics discovery/read/execution, closed P15/default-earned/modes/rune/
fusion/runeword matrices, new acquisition/lineage/gameplay replacement runs,
remote/deployment/worktree operations, new agents, dependencies/watch mode,
broad process termination and shared-cache cleanup remain outside authorization.
BUG180/366 timeout recurrence stops source continuation. Native simulation
deadline is60000ms; maxRounds is not a runtime limit.
