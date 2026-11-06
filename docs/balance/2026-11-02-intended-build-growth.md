# Intended build growth — 2026-11-02

Fourteen separately registered `-intended-v1` campaign profiles now implement
the intended identities' later growth. The existing native allocator reads
ordered JSON targets; prerequisite and unlock purchases precede early filler.
No additional allocator, free reset, point grant, XP grant or equipment injection
was added. Supplied XP is confined to the allocation test fixtures.

| Identity | Newly explicit later growth |
| --- | --- |
| Cold control | Glacial Spike → Blizzard; Cold Mastery and Static Field |
| Fire spells | Inferno → Blaze → Fire Wall → Meteor; Fire Mastery |
| Bow volleys | Multiple Shot, defensive prerequisites and Decoy |
| Spear/lightning | Lightning Bolt → Charged Strike → Lightning Strike; Impale |
| Undead army | Skeletons, mages, golem and both summon masteries |
| Corpse/curses | Ranked Corpse Explosion, Teeth and Decrepify prerequisites |
| Double Swing | Double Swing with Battle Orders/Command and defenses |
| Double Throw | Double Throw/Throwing Mastery with warcry support |
| Zeal/auras | Ranked Zeal and a selected learned Might |
| Holy spells | Holy Bolt → Blessed Hammer and selected Prayer |
| Elemental fire | Firestorm → Fissure; Elemental Mastery |
| Animal companions | Spirit Wolf → Dire Wolf → Grizzly and support summons |
| Martial combinations | Fists of Fire/Cobra and Dragon Tail/Talon |
| Traps/blades | Charged Bolt → Lightning Sentry and Blade Sentinel |

The [growth decision](../plans/decisions/P15-intended-build-growth-v1.md) defines
this increment. This is executable evaluation preparation, not a new automatic
player allocation feature. It makes later intended-build evaluation possible;
it does not establish earned access, actual casts or damage, survivability,
weapon acquisition, funding fairness, active-hour pacing or role acceptance.

## Verification

There are **93 distinct passing affected cases** across retained runs:
30 new allocation/configuration cases, 44 existing profile cases and 19 existing
action cases. Each of the fourteen builds is tested through native sequential
level gains to 50 and one batched level grant. Checks cover every native
allocation result, monotone ranks, skill/stat conservation, native prerequisite
ordering and required levels, eligible combat-order projection, idempotence,
unchanged reset counters and exact non-player domains. A separate Cold fixture
holds three points at level 5, then spends them on level-6 unlocks and growth.

`p15-intended-growth-green-v1.json` contains 92 passing cases. The subsequently
added held-point case passes in `p15-intended-growth-held-v1.json`; its 29 other
cases were filtered from that invocation, not disabled. Count actual assertion
statuses: this Vitest version's aggregate passed count includes filtered cases.
Final lint fixes change only numeric assertion formatting and the equivalent
four-stat sum, so those passing allocation runs were not repeated.

The original RED reports retain 28 unimplemented-profile failures. The initial
lint command followed the repository's test-file ignore rule and did not verify
those files. Explicit `--no-ignore` then exposed test typing/style findings;
the corrected final explicit lint and scoped strict types both exit 0. No
suppression or assertion weakening was used. No old campaign or unrelated suite
was replayed; production browser behavior was not changed by this increment.

Source authority 75 freezes 2,142 production inputs, with only the campaign
Vitest discovery list changed from 74. All production game source and authored
data are exact. The 110-input campaign manifest changes exactly five paths:
three new intended-profile/config/test files and two additive registry/profile
changes. Removing only the new import/spread and new registry entries reproduces
the previous files' exact hashes, proving all 22 historical definitions remain
unchanged. The retained managed Bow profile also matches its prior frozen value.

## Evidence and remaining work

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Index: `p15-intended-growth-closure-v1.json`; immutable profile snapshot:
`p15-intended-growth-frozen-profiles-v1.json`; source authority:
`p15-campaign-harness-source-audit-v75.json`.

Next implement attainable weapon/gear selection and declare companion, training,
funding and role-rotation policies before fresh populations or holdouts. These
growth targets remain candidates; no campaign outcome was promoted. Full private
v1 is unfinished and **0/210** build × act × encounter-role cells are accepted.
The remaining economy/retry/manual-idle/pacing/performance/integrated G0–G7/
soak/review and later owner-playtest requirements remain in force.

All new consumers are terminal. The exact task-owned collector cache is absent;
required reports, scripts and configuration remain in the evidence root for
umbrella review. Root retains the worktree and evidence and owns eventual
cleanup/release. Browser works; CI is excluded; no pending answer or external
blocker.
