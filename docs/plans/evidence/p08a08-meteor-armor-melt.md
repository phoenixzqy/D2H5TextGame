# P08a08 — Meteor Armor Melt

Status: accepted engine slice in `4ab0c14`; independent source and whole-packet
producer/QA approval complete; GD/TD contract/source approval complete. Full private-v1/C0–C4/G0–G7 remain open.

The exact player Meteor now applies ordered Burn→Armor Melt after its direct
hit. Authored JSON supplies chance1, defense reduction30% and duration3000ms,
flat ranks1–20. Its existing level24, MP50, CD4, fire damage100–150/+10rank,
area/box3x3 and Burn10% remain. This is engine acceptance, without an ordinary
acquisition/browser route, campaign clear, pacing/balance or new coverage claim.
No causal relationship to the previous level-six Moor draw is established.

## Contract and changes

[Approved D04 contract](../decisions/D04-armor-melt-v1.md) freezes exact closed
schema metadata and excludes mixed Freeze/Melt, wrong identities/type/order,
extra fields and invalid numbers. `8dd0653` adds representation only.
`0353da5` authors the exact metadata and independent frozen primitive definition.
`b148812` files [BUG-057](../../../production/bugs/BUG-057-meteor-armor-melt.md)
after reproduced failures and before any runtime patch.

`4ab0c14` fixes the adapter, shared damage projection, ordered status duration
transport and overlapping fire combo at their sources. The adapter enables
only exact Meteor/fire/two-entry Burn→Melt; Burn retains its separate DoT
metadata. The existing landed-hit loop applies statuses after damage and before
lethal finalization. A miss skips both status draws. Each landed target consumes
its ordinary Burn chance1 draw followed by Melt chance1. Explicit duration flows
through canonical status policy once; no current Melt boss multiplier exists.

Shared active pre-hit ordinary defense is
`max(0, defense * meltFactor * innerSightFactor)`, retaining fractions.
Defense21 becomes11.025 with both factors, so fixed100fire deals88. Physical,
fire, poison and thorns use armor; cold/lightning/arcane retain magicResist.
Neither authoritative stats nor periodic damage rates change. Burn/ignite,
Melt or both yield one physical bonus1.25 (boss/chapter1.125); other combo
branches remain. No status subsystem, save format or migration changes.

## Reproduction, frozen tests and control

Producer/QA independently review concrete tests before each stage. Stage A
loader RED has6failures/286controls, then292pass. Stage B authored RED has
2failures/64controls; its separate missing-module capability failure collects
zero tests and is not gameplay RED. Definition/schema/registry GREEN totals395.

Original C RED has28failures/74controls. Review finds three fixture-affected
tests: shaped AoE grid ordering differs from assumed labels in two cases, and
an indefinite refresh updates the legacy remaining counter to3 while preserving
no expiry. All originals remain. Reviewed explicit cells preserve intended
summon→first→last and missed→hit ordering, seeds and damage/RNG expectations;
exact refreshed-object/no-expiry/late-activity assertions preserve the canonical
lifecycle without a status.ts patch.

The corrected pre-runtime RED reaches27 genuine behavioral failures/75controls,
102 tests in2.346s/exit1. It precedes BUG-057/runtime changes. Final combat
test SHA256 is
`a457e24500fee382a986c983f1f9e4664b9244652973875b41c91c5b026f2276`;
it remains unchanged through GREEN. Registry retains the complete strict authored
opt-in inventory FrostNova+Meteor, and runtime plural inventory adds exactly
Meteor to FrostNova without narrowing/filtering the assertion.

The original RED captures the complete2517-byte no-Melt/no-fire-status recording.
Before runtime edits, independent review freezes its exact serialized SHA256:
`bc410c62608c3265818f4f00473705edca576549f4fc6321574ac5e7c05d3484`.
The final test compares the entire timed events, result events, final teams,
winner and rounds to that digest, passing both before and after the fix.
Its deliberate stun/poison scheduler scaffolding is not a literal no-status
battle. Same-head replay additionally checks determinism, not baseline parity.

Thirty-six combat cases cover actual JSON→registry→recorded battle, ranks1/20,
all tiers, unchanged triggering hit, already-active Melt, ordered AoE real seeded
RNG and next draw, natural miss/resource/level/lethal boundaries, duration1234
transport, ordinary-defense/MR controls, fractions, duplicate markers, half-open
activity/future/expiry, one combo/other branches, unchanged periodic rates,
critical hits, refresh/replacement/source death, replay and input/data/registry
immutability. Engine fixtures are explicit, not ordinary acquisition evidence.

## Validation

All commands run sequentially in the claimed worktree, Node24.21.0/npm11.19.0.
Command logs and exact per-process metadata are indexed in the packet.

| Stage | Focused GREEN | Engine | Full unit | Typecheck | Lint | Production bridge/build |
| --- | --- | --- | --- | --- | --- | --- |
| A representation | 292 /3.517s | 1224 /7.368s | 3508 /166files /61.905s | 11.017s | 27.695s | 8.545s |
| B definition | 395 /3.617s | 1262 /7.926s | 3546 /167files /62.330s | 11.131s | 27.980s | 8.745s |
| C runtime | 431 /3.404s | 1298 /64files /8.272s | 3582 /168files /64.575s | 10.821s | 27.927s | 8.925s clean retry |

These passing commands have no stops/signals/survivors. Existing engine3s and
full-unit15s targets remain exceeded. Existing Browserslist, chunk-size and
optional art-precache warnings remain. No new coverage run/coverage claim.
Production bridge guard scans four chunks successfully with VITE_E2E unset.

Initial C build is interrupted at0.292s by the unchanged artifact monitor's
stat race while the bridge guard removes the previous task-owned dist before
launching Vite. Exit−15/stop reason
and two exact owned SIGTERM identities remain; neither is counted as a pass.
After readers release,493 remaining output files are inventoried/deleted with
absence verification, then the unchanged command/source/limits pass from a clean
output directory. No broad process termination, limit increase or runner change.

Bounds: focused30/engine120/unit120/types90/lint90/build210seconds, plus2s
exact-owned cleanup. Caps32MiB per log/report,64MiB total RAW/dist/.vite.
No gameplay pilot, seed search, recipe strengthening or remote action.

## Durable evidence and cleanup

[Packet](fixtures/p08a08-meteor-armor-melt/packet.json) indexes153 safe regular
records,2,317,415raw bytes and the adjacent356,617-byte raw archive. It preserves
all frozen/original tests, before/final sources, failures, review/ownership
records,24commands,467source fingerprints and2535observed PID/birth identities,
verified nonlive. Final generated output inventory covers760dist files and one
Vite cache file. Original source-only ownership is preserved alongside explicit
final ownership. Archive records precede final whole-packet review/cleanup.

Packet SHA256:
`b4c5b263083aaccc263e6f8f5b1f741a31cc77ab95fee289b0d2cbdce4fccb42`.
Archive SHA256:
`fc48f4fd6b8ae550b6eba6ff1ecc75a20d0f32c656fc989bd25a5ccc1471e842`.

Root owns retained RAW until all independent packet readers release:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-armor-melt-jcabtz3k`.
Exact RAW/dist/.vite cleanup and verification follow independent final approval.
Post-archive QA clarifies older RAW wording: the bridge guard removes dist
before launching Vite; the interrupted attempt had not launched the Vite build.
Pre-existing emptycoverage, tools/dependencies/shared caches/source/history stay.
The umbrella worktree claim continues; original checkout remains clean.

## Final independent review

Producer and QA independently verify all153records,467current source hashes,
24sequential commands and2535absent process identities, approving the complete
packet and qualified engine acceptance. All source/RAW/archive/dist readers
are released. Exact root-owned cleanup follows; this review does not itself
claim deletion.

## Exact cleanup closure

After every independent reader releases, root revalidates153RAW/archive records
and2535nonlive identities, then removes exactly153RAW files,760dist files and
one.vite file. Absence is verified; no cleanup signals.
[Cleanup record](fixtures/p08a08-meteor-armor-melt/cleanup.json) preserves the
exact inventories. FormerRAW no longer exists. Pre-existing emptycoverage,
installed tools/dependencies/shared caches/source/history remain. Root transfers
the hash-verified bounded runner and cleanup evidence to next source-only RAW
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-frozen-armor-wtwinptx`,
owned by root until its contract/tests/implementation/evidence review completes.
The umbrella worktree claim continues; original checkout remains untouched.
