# P15 — Holy Bolt caster earned Act II completion

Act II is complete for the retained Holy Bolt caster. Act III is unlocked.
Seven/14 full five-act routes remain complete; this caster still needs Acts
III–V, and advertised identities/full private v1 remain open.

Worktree: `/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2`.
Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root is the sole writer; original checkout stays read-only. Previous goal turn
was a status-only report with no progress. The current slice preserves all
earned Radament/Lost City progress and resumes only Arcane/Tomb.

## Authoritative lineage

| Artifact | Result |
| --- | --- |
| `p15-holy-bolt-act2-radament-continuation-v1.json` | Inherited24/59502/next455,16 canonical Act II actions,24 paid insertions |
| `p15-holy-bolt-act2-arcane-caster-reset-forecast-v1.json` | First candidate qualifies all six Arcane waves using actual restored reset/preparation |
| `p15-holy-bolt-act2-arcane-continuation-v1.json` | Earns Arcane455, journal/Claim, staff insertion; retains Tomb456 boss draw;24/96582/next457 |
| `p15-holy-bolt-act2-arcane-readback-v1.json` | Passed:12waves/11wins/1draw,37080XP,12 insertions and one native skill reset |
| `p15-holy-bolt-act2-tomb-growth-forecast-v1.json` | Fresh whole Tomb457 qualifies with the new authored growth and Holy Bolt first |
| `p15-holy-bolt-act2-complete-continuation-v1.json` | Earns all six Tomb457 waves; Duriel40880ms, Seven Tombs Claim once; Act III unlocked |
| `p15-holy-bolt-act2-complete-readback-v1.json` | Passed:6wins/29710XP,zero new sockets/reset; all21 canonical Act II actions |

Final report SHA256:
`d86be5447033c16ea95565530cba433afb0703f4a047376caeb3993c44f94f4b`.
Resume that report at **level24/XP126292/next458**, Holy Bolt20/Hammer9,
Prayer1/Cleansing1; Cleansing selected. Original Rogue23 stays owned with
242093XP toward443233. Stat reset allowance3, skill reset allowance2.
All36 paid insertions remain owned. No previous rewards/actions are replayed.

## Native preparation and retained loss

Cleansing1 shortens finite Amplify Damage but the original damage allocation
still draws at Summoner. Moving the unused Zeal rank to Hammer7 without
Cleansing loses earlier; both comparisons remain diagnostic only. The chosen
native skill reset refunds30 points and allocates Prayer1/Holy Bolt20/Hammer8/
Cleansing1. It removes unused Sacrifice, Zeal and Holy Fire investment while
retaining Holy Bolt at cap. Native subsequent growth earns Hammer9.

Owned hero boots get two Nef and the new kite gets two normal Diamonds. Merc
leather/boots get four Nef, scimitar two Eld and war hat two Thul. One native
flawed-Sapphire dismantle and two flawed-Diamond fusions pay the gem costs.
All12 insertions and the reset are retained exactly once. No Sol, projected
level28 gear or priority permutation is selected or paid.

Native Arcane455 reproduces all six forecast HP/MP/time values; Summoner is a
narrow59991.954ms win. Tomb456 earns its first five waves, loses the Rogue in
W3, then draws at Duriel. That partial income and consumed staff remain earned.
The successor has20 canonical actions; only the final Seven Tombs Claim is left.

## BUG-535 and primary caster throughput

The native boss trace deals2805/25600HP in60s. The capped primary's old145–165
range is reduced by93 flat magic resist; the hero survives. Hammer's bypass
works. This identifies capped spell throughput rather than another armor need.

`P15-holy-bolt-growth-v1.md` records the numerical candidate: Holy Bolt growth
5→55, rank1 unchanged50–70, cap1095–1115. Payment, cooldown, healing fraction,
mitigation, rank cap, other skills and engine code are unchanged. The isolated
patch and exact before/current source hashes are in the packet binding.

Same native terminal input, same tuning seeds1–100 per policy:

| Policy | Before wins/deaths/draws | After wins/deaths/draws | After victorious p50/p95 |
| --- | --- | --- | --- |
| Hammer first | 0/0/100 | 1/0/99 | 54.02s/54.02s, victorious n=1 |
| Holy Bolt first | 0/0/100 | 100/0/0 | 45.26s/54.02s, victorious n=100 |

This is tuning evidence, not holdout acceptance. The before/after input basis
and all200 policy/seed pairs match exactly. Then a fresh whole-area forecast
from earned24/96582/457 qualifies; native457 matches all six pools/times and
Claims the final quest once. No further farming, gear, sockets or reset is used.
The scalar damage preview remains data-driven in both locales. Early-rank
power/healing, later acts, gear/pacing and independent balance review remain open.

## Verification and scope

The two new native continuations total3admissions/18waves/17wins/1draw,
66790XP,158added/217native-salvaged items,12insertions and one reset. Their
514099.026logical ms are about8.57combat minutes. This excludes inherited work
and diagnostic projections and does not establish30–50active-hour pacing.

Existing affected schema/combat/preview checks:33/33 pass. Final scoped strict
types/lint pass for12 new/recent helper methods, including the preceding turn's
unfinished helper checks. Screening v1's implicit row type and redundant access
are corrected in v2; emitted-code equivalence after its already-proven terminal
guard verifies the type-only repair without repeating400 combats. Original
executed v1, failed checks and exact method hashes remain retained.

Independent reader v6 extends reset support with exact native allowance debit,
refund, prerequisite/rank allocation sequence and final skill conservation.
Three in-memory corruptions—free allowance, unpaid rank and missing reset
journal—are rejected. No fixture save or native combat is replayed for those
negative checks. Existing custody, material, merc XP, quest, timing and terminal
export checks still pass.

The successor `p15-holy-bolt-act2-complete-artifacts-v1.json` retains source
transition, readers, all new diagnostics (including the preceding Arcane/Sol/
chain comparisons), results, terminal receipts and exact cleanup. Disposable
configs are captured in that manifest and removed; exact Vite caches are absent.
Root retains required packet evidence until umbrella acceptance consumers release
it. The existing worktree claim stays active for the unfinished umbrella goal.

Next: qualify Act III from the exact complete successor; do not replay Acts I–II,
the partial Tomb loss, reset, crafting,36 insertions or21 canonical actions.
Remaining routes/build identity matrix, holdouts/29-area contexts, economy/pacing
and final mobile/PWA/endgame/stability/soak/review/owner acceptance remain open.
Browser works; CI excluded; no pending owner answer or external blocker. No
agent, installation, commit, push or publication occurs in this slice.
