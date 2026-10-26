# D06 — Grim Ward shared-corpse fear ward

Source `e67f0349`, production browser tests `775fc1aa`. Implemented locally;
full unit16875/759passes with two existing skips. Root is sole author/reviewer. Independent design/QA,
earned balance and campaign acceptance remain open.

## Behavior

A learned native level24+Barbarian with the Find Potion/Find Item chain consumes
one oldest eligible shared corpse and pays ordinary scaled MP/cooldown to raise
one private ward. It is an indestructible wave-local area effect, not a unit,
tank, summon-cap occupant, damage source or reward identity. No body, invalid
rank/role/projection/registry, insufficient or nonfinite MP, either cooldown
alias, no current hostile or an active ward refuses without payment/consumption.

JSON duration is6000+500*(rank-1)ms; pulse interval2000ms, immediate first pulse,
strictly before expiry. Ranks1/2/20 last6/6.5/15.5s and pulse3/4/8times. Each
pulse applies actual timed Howl through ordinary status application, refreshing
without stacks;1000ms ordinary fear and500ms for bosses. It interrupts actions
and uses the shared channel-cancellation path without damage or RNG draws.

Periodic death/expiry precedes ward pulses, which precede paid spell pulses and
ordinary same-time actions. Owner stun leaves a paid ward running; owner death
stops it immediately, including exact pulse ties. An active ward blocks recasts
even after cooldown and with spare bodies. Incoming markers confer no authority;
paid state and owner marker are cleared at battle termination. No corpse/ward
carry or save-format change. Native staging recomposes current learned authority
next wave. Both locales describe current/next/MAX timing, fear, scaled payment,
one-active and wave-local limits; the owner chip shows the paid ward.

## Verification

75new tests:26definition/schema/authority,36causal,7native and6UI; focused75/4.
Direct coverage includes ranks1/2/20, input purity/replay, no-body/fallback RNG,
FIFO shared-body contention against recovery/explosion, exact MP, malformed
registry refusals, boss duration, active recast, source stun/death/expiry, marker
forgery, current next-wave rank/prerequisite/class/selection and save purity.
Engine8350/310, final typecheck and repository lint pass. Build, actual755-URL
precache guard, five-final-chunk debug-bridge scan and explicit browser lint pass.
Full unit16875/759passes with two existing skips (1494.68s Vitest/1496.679s process); final36causal and26definition cases are included.

The full run began before two assertion-equivalent test lint-style corrections
and14additional causal review cases. Final definition26/26, focused75/4, targeted
lint and final typecheck cover the final test sources. Production/build/browser
sources were unchanged throughout these final checks. No assertions, thresholds,
timeouts, retries or skip settings were weakened.

Production en/zh-CN ×1280×800/360×640:4/4, retries0. Public create/export/import,
equip, allocate19→20, Blood Moor,4xplayback, repeated fear, actual enemy blocked
actions, full run victory, collected rewards, Save and fresh online/offline
Continue. Four continuous DOM observers saw enemy Fear and owner Grim Ward chips,
blocked actions and repeated pulse messages; log buffers did not overflow.
Eight exact six-domain save pairs, four actual service-worker offline Continues
and20geometry checks pass. Each imported diagnostic case collected34new unique
items/855rune shards with both prior owned items exact. Page and console errors
are asserted empty across initial/fresh pages. Synthetic imports establish
mechanics/persistence, not earned builds or campaign/economy acceptance.

Eight representative screenshots were inspected and retained, covering both
locales and device sizes. Ward copy, raised messages and owner chip are readable.
The paused battlefield images do not themselves show fear chips; that claim
comes from DOM observation and timed causal state. Existing fixed header/bottom
navigation overlap mobile previews/battlefield; tall reward captures show only
part of the list and can obscure heading/currency. Exact quantities/ownership
come from DOM/export assertions. No broad UX/accessibility approval is claimed.

## Failures, review and limits

Original five causal REDs proved no-body casts and absent real fear/ward;13native/
UI REDs preceded native projection and truthful copy. First definition RED lacked
the module; the first GREEN attempt failed Ajv strictRequired until the schema
conditional declared its referenced property. A guarded schema edit first counted
nested allOf entries and asserted before writing; its corrected edit was anchored
to the root. Initial explicit browser lint hit default ignored-file warnings;
the unchanged files pass with--no-ignore. Initial repository lint found only
two test-style errors, both corrected without altering assertions or behavior.
All raw outcomes remain distinct from final passes; no browser failures/retries.

The root review checked correctness, simplicity, engine/store boundaries,
projection/registry authority, bounded scheduler state and actual evidence. It
added14direct payment/registry/contention cases. Ward-specific enemy conversion/
channel combinations are not independently exercised as live enemy channels in
this slice; shared hostility/status/channel handlers are reused. JSON timing is
provisional author tuning. Independent design/QA/pillar alignment and earned
balance remain open. Existing BUG180/237, test/build/bundle budgets and mobile
layout issues remain open; entry bundle is2000.82kB/gzip505.02kB with the existing
large-chunk warning. The generated2.57MB asset manifest remains outside precache.

## Integrity and remaining scope

The other29raw Barbarian objects, genuine Ancients401 save,761build files and
1497frozen source/config/test/contract files are exact; frozen sources match
committed blobs at`775fc1aa`. The later`1c837a80`adds only the next bug reproduction.
GenuineL33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared
remains unchanged; decompressed SHA256:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign or remote action. Only Grim Ward gains credit:148bounded/63unverified/one engine-only/one review-needed; Barbarian29/30. Other212raw CSV rows and all213IDs/order are exact. BUG225 is locally repaired/verified for all three corpse skills; independent and earned acceptance remain open.

C0/C1 retain narrow historical acceptance; C2 underway; C3/C4/fullG0–G7,
all-class earned builds,30–50hour pacing, economy, endgame and full privatev1
remain unfinished. Battle Command was separately reproduced at ranks1/20 and
four seeds: actual payment/self marker but no caster/allied rank-dependent
benefit versus an action/payment-matched inert control. BUG241 and its
[observations](fixtures/battle-command-reproduction/observations.json) preserve
that intentional RED; it is not implemented or credited. Cold Mastery remains
review-needed. Umbrella goal, branch, worktree and claim stay active.

[Contract](../decisions/D06-grim-ward-v1.md),
[BUG225](../../../production/bugs/BUG-225-barbarian-corpse-skills-ignore-bodies.md),
[packet](fixtures/grim-ward/packet.json),
[terminal results](fixtures/grim-ward/terminal-results.json),
[browser audit](fixtures/grim-ward/browser-audit.json),
[author review](fixtures/grim-ward/author-review.json),
[source](fixtures/grim-ward/source-delivered.json),
[inventory audit](fixtures/grim-ward/inventory-audit.json).

## Retention and cleanup

Raw archive: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-grim-ward-retained-bjimq__6.tar.xz`

SHA256:`5f543d8085b88bf9c86bf8ef47cbf6a6cf4c9d0d4e90d3529e22b0382ff4ab8a`; 4423232bytes; all172regular members
byte-verified. It preserves original failures, final receipts/report/screenshots,
source/build identities, exact cleanup plan and the BUG241 probe/dependency map.
Owner: root. Root removes this exact archive after original-failure diagnosis
and all full-v1/BUG241 evidence consumers finish. Disposable build/runtime are
excluded; archive ownership/removal condition is also in
[retention](fixtures/grim-ward/retention.json).

Exact cleanup removed1482files/27directories; scratch is absent.
All819recorded PID/starttime identities and2observed browser profiles are
absent; port4522is free. Remaining task scratch paths: none; cleanup failures:
none. No processes were signalled. Shared caches/tools/browser binaries, source/
history, genuine save, prior archives and active umbrella worktree/claim remain.
[Cleanup](fixtures/grim-ward/cleanup.json).
