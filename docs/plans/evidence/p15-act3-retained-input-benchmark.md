# P15 — Act III retained-input manual/idle benchmark

2026-11-05. Previous goal turn was status-only and made no progress. This
increment executes the prepared bounded benchmark and reconciles its retained
outputs; no production behavior is changed. Full private v1 remains unfinished.

## Exact scope and source

All 14 retained Act III boss-context saves enter canonical Durance of Hate from
its whole-area start: one manual and one idle attempt per build, restored
separately from identical input bytes. Sample stage is `benchmark`, seed is1,
clock and full Normal ordinal remain exactly saved, and idle pity is explicitly0
for a fresh idle block. There are no allocations, equipment/order/resource
edits, farming or retries. Native entry and prefix carry remain authoritative;
terminal nonwins stop the attempt and leave later waves unreached.

Selection and all original context/failure/noncanonical ancestry fields remain
pinned by `plan.json`, sourced from the prior retained retry selection. These
inputs span levels25–47 and saved ordinals219–956. They are retained power,
not a recommended-power or first-entry cohort. Current resolved enemies are
levels42–47. Ancestral acquisition costs remain unknown where already unknown.

The native adapter is `tests/sim/production/checkpoint-attempt.ts`. Vite loads
its ESM entry with project config, listeners, watchers and HMR disabled. Actual
production source bytes are collected before gameplay import and after all
attempts; diagnostic contracts are hashed separately. Both manifests remain
stable. HEAD is `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production tree hash
`461429d2d11c4adf36fe0f83905d15c2bd4f885c9f51194a84a37be3df3ba341`, data hash
`bf16c72cce96d8a2125cc6f84ae357a4415aba24ddd9faee62f8591b48c7e87d`.
The extensive inherited dirty/untracked source and deliberate CI deletion remain
preserved. Security check passes and the finite plan review is ready; neither
verdict supplies full-game acceptance.

## Results

The following are individual observations, not rates, medians or population
acceptance. Boss HP is measured only after an actually reached boss wave;
`unreached` is not a boss loss. Terminal time includes a full60s timeout for draws.

| Build | Mode | Level | Terminal | Boss reached | Terminal seconds | Boss HP left | Minimum MP | Unreached |
| --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: |
| amazon-bow | manual | 31 | W6 defeat | yes | 40.924 | 11077 | 126 | 0 |
| amazon-bow | idle | 31 | W6 defeat | yes | 33.880 | 12967 | 216 | 0 |
| amazon-javelin | manual | 28 | W6 draw | yes | 60.000 | 21960 | 238 | 0 |
| amazon-javelin | idle | 28 | W6 draw | yes | 60.000 | 21960 | 238 | 0 |
| assassin-martial | manual | 28 | W6 draw | yes | 60.000 | 21805 | 169 | 0 |
| assassin-martial | idle | 28 | W6 draw | yes | 60.000 | 21805 | 169 | 0 |
| assassin-traps | manual | 25 | W6 victory | yes | 30.381 | 0 | 316 | 0 |
| assassin-traps | idle | 25 | W6 victory | yes | 30.381 | 0 | 316 | 0 |
| barbarian-double-swing | manual | 25 | W6 victory | yes | 25.741 | 0 | 195 | 0 |
| barbarian-double-swing | idle | 25 | W6 victory | yes | 25.741 | 0 | 195 | 0 |
| barbarian-double-throw | manual | 47 | W6 victory | yes | 13.543 | 0 | 439 | 0 |
| barbarian-double-throw | idle | 47 | W6 victory | yes | 10.160 | 0 | 439 | 0 |
| druid-fire | manual | 35 | W6 victory | yes | 22.762 | 0 | 388 | 0 |
| druid-fire | idle | 35 | W6 victory | yes | 22.762 | 0 | 388 | 0 |
| druid-summon | manual | 25 | W2 draw | no | 60.000 | unreached | 297 | 4 |
| druid-summon | idle | 25 | W2 draw | no | 60.000 | unreached | 297 | 4 |
| necromancer-bone | manual | 28 | W6 draw | yes | 60.000 | 12033 | 237 | 0 |
| necromancer-bone | idle | 28 | W6 draw | yes | 60.000 | 12033 | 237 | 0 |
| necromancer-summon | manual | 27 | W4 draw | no | 60.000 | unreached | 441 | 2 |
| necromancer-summon | idle | 27 | W4 draw | no | 60.000 | unreached | 441 | 2 |
| paladin-holy-bolt | manual | 25 | W5 defeat | no | 11.060 | unreached | 336 | 1 |
| paladin-holy-bolt | idle | 25 | W2 defeat | no | 15.800 | unreached | 336 | 4 |
| paladin-zeal | manual | 28 | W6 victory | yes | 25.314 | 0 | 231 | 0 |
| paladin-zeal | idle | 28 | W6 victory | yes | 25.314 | 0 | 231 | 0 |
| sorceress-cold-nova-lineage | manual | 30 | W6 victory | yes | 23.910 | 0 | 257 | 0 |
| sorceress-cold-nova-lineage | idle | 30 | W6 victory | yes | 23.910 | 0 | 257 | 0 |
| sorceress-fire | manual | 29 | W5 defeat | no | 6.320 | unreached | 359 | 1 |
| sorceress-fire | idle | 29 | W5 defeat | no | 6.320 | unreached | 359 | 1 |

Six retained builds clear in both modes: Traps, Double Swing, Double Throw,
Fire Druid, Zeal and Cold Sorceress. Javelin, Martial and Bone Necromancer reach
Mephisto but time out. Bow dies against Mephisto. Summon Druid and Summon
Necromancer time out during the prefix. Holy Bolt and Fire Sorceress die during
the prefix; Holy Bolt's idle promotion produces an earlier terminal than manual.
The different mode plans and per-wave contexts are retained without forcing
manual/idle outcome equality.

No attempt observes zero hero MP; the lowest observed MP is126. This does not
establish every skill's affordability or rule out every resource constraint.
All28 source-restoration/migration, exact-plan, contiguous-wave, terminal,
per-wave seed and complete-living-hero-victory checks pass.149waves settle out
of168planned;19suffix waves remain explicitly unreached. Wins do not erase
historical failures or qualify a source's earlier acquisition ancestry.

`readback.json` includes each attempt's exact XP/currency/material/item/merc-XP
changes and entry/final/minimum MP and HP. Every wave retains original events,
engine input, stream seeds, participant contexts and final teams. The reader
separately derives emitted direct damage to enemies by source kind and damage
type, actions by actor/skill, and periodic damage to enemy targets. Original
periodic source/type integrals remain in the native metrics; they are emitted
interval HP-ms, not allocated post-absorption per-source HP. Direct emitted
damage may include overkill. Do not equate these contribution totals with unique
HP lost. Diagnostic rewards/final saves are observations, never published earned
campaign successors.

## Execution cost and separate readback

One native launch completes all28attempts, with13.160s measured native work and
21.526s whole-process wall time. The executed packet is43,353,145bytes before
readback/doc closeout, below its256MiB limit. Maximums were one launch,
28attempts,196settled waves,120native seconds and180process seconds, with no
extension. All historical campaign/sample/retry/diagnostic budgets remain closed.
A separate Python supervisor monitors the exact child and active native budget;
fsynced per-wave files and journal receipts retain partial results on failure.
No watchdog stop was needed, both processes exit0, and stderr is empty.

A separate retained-output reader loads only the authenticated observation codec
through the installed TypeScript transpiler. It imports no gameplay module and
replays no combat. It verifies all file hashes/lengths and journal joins,
paired inputs, fixture identity, waves, outcomes, terminal resources and source
stability. Initial readback exits1 because its raw-format equality assertion
omits the existing v32→v33 migration. The initial script and failure receipt are
retained. Source inspection confirms the only additions are empty recruitment
history/progress and version33. Corrected readback checks that exact migration
for12v32saves and exact preservation of both existing v33saves, then passes with
empty stderr. This correction changes neither native results nor game source.

## Next implementation decision and limits

The benchmark makes execution cost measurable and identifies different failure
modes. It does not justify a shared Durance HP/Defense reduction, a class damage
increase, or a claim that the target boss win bands pass or fail at recommended
power. D02's initial Act III completion reference is47; most retained heroes
are25–35, while Double Throw is47. Recommended power includes attained skills,
equipment, mercenaries and acquisition costs, not level alone.

Next resolve a bounded attainable Act III power/acquisition policy using the
current progression, equipment and currency rules, with prefix survival and
boss throughput reported separately. Preserve this closed benchmark as the
unchanged diagnostic baseline. Any subsequent power/preparation or population
screen needs its own prospectively bounded inputs and scope; do not renew this
launch or any historical allowance. A single seed supplies no holdout,
within-three retry, first-clear, economy or30–50active-hour pacing acceptance.

No unrelated tests, completed-act/campaign reruns, build, browser launch, CI,
new agents, install, commit or push are performed. Current functional browser
work remains available and owner playtest follows implementation. Historical
14/14Normal completions,210retained contexts and formal0/210balance acceptance
remain unchanged. Remaining gameplay/content, acquisition/economy/pacing,
higher difficulties/endgame and integrated bilingual mobile/a11y/save/PWA/
performance/soak/independent acceptance stay open.

## Retention and cleanup

Root retains exact inputs, preimages, driver/supervisor, native source/contract
manifests, journal, per-wave observations, initial reader failure, corrected
readback and hashes at:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act3-retained-benchmark-v4noerxt`.
Root removes this packet after full-v1 acceptance and all review consumers finish.
It is required diagnostic evidence, not a disposable cache. The exact native
child and supervisor are absent, all command handles are terminal, Vite closes
and its packet-local cache is removed and verified. No task-owned disposable
process, cache or cleanup failure remains. The existing session keeps its
claimed human2worktree during ongoing full-v1 work. No user question or external
blocker remains.
