# D04 — Sorceress cold attacks

2026-10-25; root sole writer/reviewer. Source/tests/contract dc489cb1 deliver
four bounded functional checks. Independent design/QA, earned builds and
balance remain open. [Contract](../decisions/D04-sorceress-cold-attacks-v1.md).

## Actual combat and targeting

Ice Bolt makes one single-target attempt; Frost Nova and Blizzard make one
independent attempt per living enemy. Frozen Orb now uses the existing cone:
one apex cell and three adjacent cells in the next row, choosing the densest
occupied footprint, then foremost row/leftmost column, with row-major targets.
Duplicate occupants, clipped edges, defaults and overflow positions remain
eligible. These four-cell dimensions remain an explicit provisional author
adaptation. Blizzard reaches every living hostile, including overflow rows.
No extra shards, periodic hits or implicit penetration are introduced.

Existing Cold damage/rank growth, costs10/20/30/35MP, cooldowns1/3/2/4s,
unlocks1/6/30/24, prerequisites and cap20 remain unchanged. Each cast pays once.
Landed hits apply2s Chill, reducing Attack Speed50%; Frost Nova then makes an
independent10% Freeze roll for1s, or0.5s for bosses/chapter bosses. Misses apply
neither effect. Ordinary Cold resistance, flat MR, criticals, personal Cold
Mastery and matching increased damage retain their formulas. Save22 is unchanged.
The other28Sorceress data objects are byte-exact; only Orb/Blizzard targeting
changes. Both locales show actual damage/payment/control and current/next/MAX.

## Verification

174 new tests cover production registration/schema/display models40, native
causal combat94, real allocation/next-wave/import8 and bilingual React32.
Ranks1/2/20 across seeds7/19/41/97 prove actual recipients, HP loss and one
payment; additional cases prove natural misses, dead/friendly exclusion,
lethal targets, MP/cooldown refusal, exact cooldown eligibility, Cold resistance
and MR, criticals, native Cold Mastery composition, exact Chill action cadence
and expiry, independent Freeze/boss timing and interruption. Immutable input,
exact seeded replay, ordinary runBattle and resource/living-status playback
match. Native authority rejects wrong class/unlock/missing transitive
prerequisites/invalid ranks and accepts canonical aliases. Real allocation
leaves the current recording intact; next wave adopts it without pool refill.
Real validation/import retains learned ranks/priority without transient power.

Engine7933/296, actual data loader292/1, final typecheck, full lint plus final
changed-file lint, production build and actual-output precache checks pass.
The final quiet full passes15610tests/711files/two existing skips, wrapper
622.938s. It starts only after all118then-recorded task PIDs are absent
and port4510is closed. Source/config/test/contract1449files and761build assets
remain exact; committed source blobs are verified. Existing broad bundle and
generated-art-manifest cache warnings remain; application JS/CSS are cached.

## Public browser, persistence and layout

All four final group receipts exit0: en/zh-CN ×360×640/1280×800 ×four skills
=16cases. Each creates/exports a real character, publicly imports a declared
synthetic L30/prerequisite/resource-helmet save, allocates rank1→2, sets normal
active priority, enters real combat and observes the public cast, MP decrease
and visible enemy Chill before Pause/Flee. No browser store bridge is used.

There are32exact ordinary five-domain Save-close-fresh-page-Continue pairs and
16additional actual network-disabled fresh-page Continues.80five-size geometry
checks show zero horizontal overflow and allocation targets≥44px.48screenshots
are retained; four individually inspected views cover English Orb/Nova mobile,
Chinese Blizzard mobile and English Ice Bolt desktop. Lower mobile rows scroll;
existing missing navigation glyphs remain. Geometry is not a full a11y audit.
Imported level/resources/equipment and fixed combat Date.now establish mechanics
and public flows, not earned builds, campaign completion or pacing.

## Failures retained and acceptance limits

The original geometry RED has12Orb and12Blizzard failures with24Ice Bolt/Nova
controls passing. Contract/schema and UI REDs, initial wrong effect-field
assumptions and their corrected tests remain separate. Typecheck/lint catches
readonly fixture mutation, event narrowing, optional-property construction,
matcher typing and a redundant UI guard. These are corrected without changing
combat assertions, timeouts or game tuning.

The first browser harness incorrectly copied a warcry-only prose expectation;
the cold contract and native next-wave checks do not require that sentence.
The failure script, screenshot and full trace are retained. Two intermediate
collectors finish143after case output and leave no terminal receipts; their
observed child PIDs are absent before rerunning. They are not accepted passes.
The final browser groups run under one bounded collector, all receipts exit0,
and all source/build/genuine hashes match. The full regression has no overlap
with browsers/build/typecheck/lint. No genuine campaign or remote action occurs.

[Packet](fixtures/sorceress-cold-attacks/packet.json),
[terminal checks](fixtures/sorceress-cold-attacks/terminal-results.json),
[browser audit](fixtures/sorceress-cold-attacks/browser-audit.json),
[save pairs](fixtures/sorceress-cold-attacks/save-pairs-audit.json),
[committed source](fixtures/sorceress-cold-attacks/source-delivered.json),
[inventory](fixtures/sorceress-cold-attacks/inventory-audit.json) and
[cleanup](fixtures/sorceress-cold-attacks/cleanup.json) retain the delivery.
Only these four CSV rows gain credit;209others and all213IDs/order stay
byte-exact. Totals128bounded/83unverified/one engine-only/one review-needed;
Sorceress12/30. Root author review only; independent/earned acceptance remains.

Genuine Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0/Baal uncleared.
Its decompressed SHA256 remains
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577.
C0/C1 retain their original narrow exits. C2–C4, fullG0–G7,213skills, two earned
builds/class,30–50hour pacing, economy/endgame and complete privatev1 remain
unfinished. The umbrella goal/worktree/claim stays active.

Sorceress cold retention/cleanup terminal: raw539archive members are byte-verified. Cleanup removed1300current exact files plus761verified obsolete build files, 2061task files total. All122recorded PIDs and all8recorded browser profiles are absent;4510closed,scratch absent,remaining[]/failures[]. Shared caches/tools, source/history, retained evidence and umbrella worktree/branch/claim preserved. Independent/earned/full-private-v1 acceptance remains open.
