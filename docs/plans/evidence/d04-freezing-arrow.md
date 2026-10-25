# D04 — Freezing Arrow actually applies secondary Freeze

2026-10-25. BUG201 is locally repaired and verified. Runtime/native32c5918c,
presentation/contract9104ea3c. Exactly one local functional mechanic credit. Root is sole writer/author reviewer; independent QA and
earned class/build balance remain open.

[Contract](../decisions/D04-freezing-arrow-v1.md),
[original reproduction](d04-freezing-arrow-repro.md),
[bug](../../../production/bugs/BUG-201-freezing-arrow-unreachable-freeze.md).

## Final behavior and scope

The minimal runtime fix adds explicit `additionalStatusEffects.freeze.chance`
to the actual Amazon JSON row. The existing closed schema, adapter and ordered
combat status loop already support it; no duplicate runtime path is introduced.
Probability is15%, preserving the existing skills-spec value. An initial10%
draft borrowed Frost Nova's value unnecessarily; source review superseded it.
The original draft source/build/browser checks remain retained as superseded
and receive no final-build credit. The accepted spec now describes actual3×3
geometry and the controlling lifecycle rather than a stale cone.

A landed Cold hit applies ordinary Chill and independently rolls15% Freeze per
target. Chill lasts2seconds/half effective attack speed; Freeze lasts1second
ordinary or0.5seconds for boss/chapter-boss, with exclusive expiry. Probability
and duration do not scale with rank. Cold50–70/+5rank,20MP,2second cooldown,
unlock30/cap20, Cold Arrow→Ice Arrow chain and normal crit/miss/target/death
behavior are preserved. Misses pay but draw/apply no status. The extra Freeze
roll intentionally advances this skill's RNG; nonopted sibling paths stay exact.
No new stat, save field/version, resource refill or genuine campaign action.

Both locales now show actual area/chance/durations, reading probability from
loaded JSON and lifecycle values from `STATUS_DEFAULTS`. Current/next/MAX damage
previews remain. The shared UI template exposes the existing typed secondary
metadata rather than hardcoding a second tuning constant.

## Verification

Three new files contain43cases: native27, schema/registration8, bilingual UI8.
Native fixtures use real Player projection/default registrations at ranks1/20;
no skill replacements. Successful seed5 casts cause66/161Cold, ordered Chill/
Freeze, suppress the target's actual1770.588ms opportunity and preserve hero
HP2000. Failed-proc seed1 causes50/145Cold, leaves only Chill and permits actual
100HP loss. Seed4 misses pay20MP and apply neither status. Ordinary/boss exact
expiry, continued Chill, actual3×3 with outside target, independent procs,
lethal status/death order, dead exclusion,2second cooldown, exact aliases and
class/unlock/prerequisite/mana/cooldown refusal all replay identically without
mutating inputs. These are synthetic resources/opponents, not earned balance.

Final focused compatibility/data:505PASS/9files. Engine:7499PASS/270files,
102.703s wrapper. Final strict types45.783s and full lint119.395s pass.
Explicit VITE_E2E=false production build passes11.825s; four bridge-free chunks
and all756precache references validated. Final full:14332PASS/637files, two existing skips;518.344s wrapper.

Final15% production browser cases pass4/4, en/zh-CN×1280×800/360×640. Public
new-character/import/allocation/configuration and actual localized Freeze chip/
log pass. Eight exact player/inventory/map/mercs/formation Save-close-new-page-
Continue pairs preserve rank1 and public rank2 allocation.20geometry samples
cover360×640/412×915/640×360/1280×800/1920×1080; no horizontal overflow and checked
Allocate controls>=44px.20screenshots retained/eight individually inspected;
mobile detail and actual frozen enemy are visible after ordinary scrolling.

Browser inputs explicitly import a synthetic L30 Amazon and large-resource
helmet. Combat Date.now is fixed at2026-10-25T12:30:00Z, preserving ordinary
timers and producing deterministic real area combat. No test bridge or private
store injection. Native causal tests establish actual suppression; browser
chips alone are not causal proof. Existing icon fallback/fixed bars and full
accessibility/PWA/device-performance gates remain open.

Original missing-effect native/definition/UI REDs, cooldown-unit fixture error,
strict-type/lint assertion errors, two stale exact registration enumerations,
server-label startup error, superseded10% runs and all three deliberately
interrupted full runs are retained. No interrupted run is a pass. Exact owned
process trees were stopped before source corrections; assertions were neither
weakened nor skipped. All1369source/test/config hashes, two controlling design hashes,760build hashes,
genuine digest and HEAD stay exact through the final full run. Actual committed
source/design blobs and disk bytes at9104ea3c match the tested snapshot.

## Remaining acceptance

Genuine Ancients/Rite save remains L33/XP149261/nextNormal402/Nightmare0,
Baal uncleared. Decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain their narrow acceptance; C2–C4/fullG0–G7, remaining skills,
earned all-class builds,30–50hour pacing, economy/endgame and independent
acceptance remain unfinished. Local only; no remote operation or deployment.

Inventory preserves213IDs/order and credits only Freezing Arrow:
100bounded-functional/111unverified/one engine-only/one review-needed.
Amazon7/30 locally integrated plus one engine-only is not earned class/build
acceptance. The separate Impale row gains reproduction/contract links but stays
unverified; no second mechanic credit.

A separate [Impale reproduction](d04-impale-repro.md) retains real inert Bleed
and Defense/copy contradiction; it receives no functionality credit.

[Raw archive](fixtures/freezing-arrow/raw.tar.gz),
[member manifest](fixtures/freezing-arrow/packet.json),
[committed-source audit](fixtures/freezing-arrow/committed-source-audit.json) and
[cleanup receipt](fixtures/freezing-arrow/cleanup.json) retain the terminal results and exact source proof. All286raw archive members
and37terminal receipts are hash-verified. Cleanup removed1806exact task-owned
files after all validation consumers finished; scratch/PIDs807924+851573 absent,
ports4487/4488closed, remaining[]/failures[]. Older roots/shared caches preserved. Umbrella goal/worktree/branch/claim stay active.
