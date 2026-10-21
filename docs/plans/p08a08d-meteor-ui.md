# P08a08D Meteor truthful bilingual Skills detail

Approved bounded child of existing D04-armor-melt-v1/P08a08. Root sole writer and
executor in claimed umbrella worktree; existing GD/TD/QA/producer read-only. Meditation receipt increment `d50f124` is committed before this child. Every increment at
most5repositorypaths, commit before next; serial bounded gates/no edits during.

Observed root cause: SkillsScreen.dynamicDescription returns generic direct damage
for Meteor before its locale description can communicate ordered Burn/Armor Melt.
Old authored locale prose only says melting armor without potency/duration. Runtime
and immutable METEOR_ARMOR_MELT_DEFINITION already implement exact30% ordinary
Defense reduction/3000ms, flat ranks1–20. No gameplay correction or tuning needed.

Smallest fix follows existing authored-specific description formatters: import the
immutable JSON-derived definition in SkillsScreen, interpolate existing computed
damage range plus translated damage/status labels and reduction/duration into both
locale descriptions. Preserve numeric precision when ms→seconds; no rounding to
integers. Say successful hit applies Burn then Armor Melt, ordinary Defense−30%
for3s at every rank. Do not imply triggering hit benefits or MagicResist reduction.
Keep all combat/data/schema/save/selection/combo semantics unchanged. Explicit combo
editing intentionally replays existing current wave; only learning/upgrades must
keep current recording frozen. No new shared status/aura/description framework.

Ordered increments:
1. Structured source-only BUG069 report plus this bounded control (2docs). Baseline
   reproduction is static, not an executed browser failure. Independent GD/TD and producer plan-review READY, 2026-10-21.
2. Exact4paths: SkillsScreen.tsx/newSkillsScreen.meteor.test.tsx/both skills locales.
   Freeze and independently review tests before installation and source edits; run
   actual unchanged-UI RED distinguishing missing prose failures and passing controls.
   Then minimal source/copy. Tests assert literal values from accepted D04, not
   duplicated runtime math: rank1 current100–150/next110–160, rank2 current110–160/
   next120–170, cap20 current290–340/no next; fixed30%/3s bothlocales/unlearned preview.
   Check translated ordered statuses, MP50/CD4/L24/prerequisites, no raw keys; native
   allocate1→2 spends points without resources/combo changes, missinglevel/prereq
   controls, exact current native recording preserved on learning/upgrade. Registry
   mutation control should retain independent immutable metadata; no new mocking of
   runtime behavior. Scope only UI tests; no claim engine RED or earned progression.
   Serial focused≤30s/type≤90/lint≤90/fullunit≤120/cleanbridgebuild≤210, 2s cleanup;
   32MiB individualreport/log and64MiB combinedRAW+dist+.vite. No engine rerun if no
   engine edits. Keep existing timing misses/buildwarnings visible, no perfacceptance.
   Independent finalGD/TD/QA/producer; sourcecommit then exactdisposablecleanup.
3. Separate2path productionbrowser config/spec: no bridge, true native learn1→2,
   activecombo inclusion/exclusion/selection persistence, currentrecording freeze
   specifically during allocation (do not change existing explicit combo replay),
   explicit Save→Saved→close/newPage→Continue entire save equality under same fixed
   Date, two locales/nineCSSviewports/readableChinese and keyboard+44pxtargets.
   ImportedL24/prerequisites/stats/resources scaffold only. Use deterministic native
   event/MP evidence only where it proves a specific accepted mechanic; no contrived
   broad balance/campaign claim. Freeze concrete browser oracles for review first.
4. Bounded docs BUG069/control/evidence/ledger closure only after acceptedbrowser,
   at most4paths; lossless durablepacket and independent byteverification before
   exactRAWcleanup. Preserve failures/drafts/sourcehashes/processbirths and installed
   fonts/tools/sharedcaches; keepemptyRAWroot.

FullD04/P08/C1/private-v1/C0–C4/G0–G7 stayopen. No push/PR/merge/deploy.


## Bounded acceptance — 2026-10-21

Completed source `6af9f39` and productionbrowser `a3bc6bb`; GD/TD/QA/producer APPROVE.
[Evidence](evidence/p08a08d-meteor-ui.md): actualunchangedUIRED10prose+10controls,
final20focused/5444full(201files), types/lint/cleanbridgebuild and2localebrowser
passes. QA personally18screenshots; native learning/resources/pausedDOM/combo and
entireSaveCurrent reload accepted within finiteChromium/CSS/samecontext scope.
ActualV3lintfailure and all preexecutiondraftcorrections retained; no engineedit/
rerun, cast, earnedprogress, balance/performance/fullaccessibility claim. Twelve
commandrecords/968uniqueprocessbirths freshlyabsent,0signals; allreadersreleased.
Exact761outputfiles40,979,191B/10distdirectories removed; sharedcacheparents retained.
Durablepacket/archive verification and exactRAWcleanup follow in separate increments.
FullD04/P08/C1/private-v1/C0–C4/G0–G7 remainopen. Claimcontinues,noremote.
