# Fresh native17 campaign screening

The separately frozen native17 production-service route earns all **310 Act I
wave victories**, unlocks Act II through the real Andariel clear, and stops at
its **first actual defeat: Far Oasis W3**, before Radament. Across 108 real
challenge launches it records 312 victories and one enemy victory, plus the
40 planned zero-reward preparation Flees. No retry, extra farm, imported
checkpoint, post-failure build change, runtime edit, or data edit follows.
This does not satisfy browser or C2 campaign acceptance.

The [frozen recipe](fixtures/fresh-native17-campaign-screen/native17-frozen-plan.md)
preserves the historical player policy and real earned resources. Its only
item-schema adaptation validates each actual own native `socketCapacity`,
keeps all historical fields and IDs, and preserves the complete native
payload through production transfers. The original refusal below remains
immutable. Production seeds and persisted challenge ordinals continue across
acts; they are never reset to reproduce the historical browser seed.

At clean runtime/harness head `6042bb9de651e6ebc76c7f84889b85229624d04c`:

| Identity | SHA-256 |
|---|---|
| Collected production source tree | `d9435d10b57edacef343fdb5bbecd306acc403428f4447e72e46434904ef7ed8` |
| Data tree | `a1c9be78af566f3c9bd9fd8df22b25d81423fc1ab43e591c07fac3a794eee851` |
| Retained player-policy spec | `bceaab7cb2e1ebf0e3b945c96e3fd1a4959553058871476c42201dbe1f994936` |
| Retained gear helper | `c70ebd227ccf41cfc479377769702367e242eda04e0d9daf9929aac968594f2b` |
| Native17 frozen recipe | `d16c50484765f6acadc659f87810d568fc342bcd0f764a3401eac2298b5dfc75` |

Source identity is identical before import, before execution and afterward;
the raw report retains the exact collection policy and per-file manifest.
Node is v24.21.0 and Vitest is 1.6.1. The route takes 61.927 wall seconds;
the full invocation takes 69.43 seconds with both harness contract tests
passing. A passing observation contract records the campaign defeat.

Preparation uses exactly 40 Blood Moor W1 victories/native W2 Flees, the
mandatory full Den and **61** further full Den challenges to exactly L12
(frozen maximum: 100). Real Den and Sisters claims settle once, and the
actual issued Coif is equipped. Staff and Sun object interactions, assembly,
claims and Staff insertion also succeed. The Act II point-spending ceilings
are Ice Blast 20/Vitality 500; the actual character has Ice Blast 8/Vitality 37
and **zero unspent skill or stat points**. The caps grant no resources.

Far Oasis uses native ordinal **107**, seed **1283116162**, and five authored
waves. W1 and W2 win, awarding respectively 1,980/2,400 hero XP,
1,485/1,800 merc XP, six/four actual items and 996/1,177 rune shards. W3 is
the forced champion wave: nine scarabs and four sand maggots, all L21. It
ends with `winner: enemy` and native `advanceResult: defeat` at
15,232.258ms simulation time. Both original party members have zero combat
HP; all 13 original enemies survive. Radament W5, its claim/Book, Arcane,
Duriel and Act III availability are not reached.

The failure awards zero XP, merc XP, currencies, items or clears. Its complete
before-award, after-award and terminal persistent states are identical, with
observation hash
`e1d8f7d815565d3bf68618d93b0c06798724b101ce63732fcd46fb6048e90b5e`.
The normal persisted ordinal is108. This current service route differs from
the separate historical browser route whose Act II page reload restarted
at ordinal 0 and whose Radament W5 drew; neither outcome replaces the other.

The bounded recording analysis shows substantial W2 attrition. W1 ends at
hero 272/272 and Rogue 279/280 HP; W2 ends at 70/272 and 9/280, which carry
directly into W3 together with cooldowns. In W3 the Rogue dies at 3,820ms and
the hero at 15,232.258ms. All 102 enemy actions are weak melee:79 landed
hits each deal one physical damage and 23 are dodged. No enemy fire-ball
action or fire damage occurs. Hero cold damage totals 191 from four Frost
Nova and six Ice Blast casts; Rogue physical damage totals 758 from one
Pierce Arrow and two Basic Arrows. Hero mana remains 168–188, ending 181;
Rogue mana remains 150. Mana starvation is unsupported by this recording.

The stopped state owns 3,306 unique earned items: 3,291 in the backpack,
eight hero items and seven Rogue items. All 15 prelaunch boundary selections
retain existing gear; the ten new W1–2 drops stay unequipped under the frozen
in-challenge policy. The summary retains actual gear, selection vectors,
scores, native capacities and available points. Large W2 attrition followed
by 13 champions is an observed constraint of this fixed policy. Gear score
priorities, safe-mod exclusions, combo and enemy magic resistance 40 are
possible contributors to damage output, not demonstrated defects or proof
that a different build wins. Party magic resistance 0 cannot explain the
exclusively physical incoming damage observed in W3. No alternative build
projection, replay or combat trial was performed.

The immutable [full report](fixtures/fresh-native17-campaign-screen/native17-first-defeat.json.gz)
retains all actions, successful-wave terminals and the full 464-event first
nonwin recording, opening/played/advanced combat states and award states.
It is lossless inert observation evidence, not a save/checkpoint. The
[compact summary](fixtures/fresh-native17-campaign-screen/native17-first-defeat-summary.json)
contains policy limits, actual milestones, build and damage analysis.
Deterministic gzip (`mtime=0`) round-trips all 22,996,529 raw bytes into
876,721 bytes:

| Artifact | SHA-256 |
|---|---|
| Raw report | `e13e38207891f61a2fac9f6d04d10a3cafac4d1f4f2382a400600b7e5b8c6334` |
| Committed gzip | `c89e2c87c34f72fe27db9e4d75a0c070b7e4fa63b3868f27a924aed832f64e30` |

The two focused smoke tests, opt-in observation contracts, TypeScript check,
scoped ESLint with the tests ignore override, and diff checks pass. The
root's broad baseline validation is reused; the full campaign is not rerun.
Reproduction requires the frozen head, an existing external output parent
and a new output filename:

```sh
FRESH_CAMPAIGN_STAGE=native17-act2 \
FRESH_CAMPAIGN_REPORT_PATH=/absolute/new/output.json \
npx vitest run --project sim-contracts tests/sim/production/fresh-campaign-screen.test.ts
```

No browser, persistence, Save/Continue, supported-idle, full five-act or
active-player pacing acceptance follows from this screen. Logical combat
seconds and automated playback do not prove 30–50 active-player hours.

## Original unchanged literal-schema refusal

The first current-runtime production-service screen stops at a historical
item-schema assertion after **40 genuine Blood Moor W1 victories**. This is
preparation evidence only: Den and Act II were not attempted, and no browser,
persistence, Save/Continue, active-player pacing, or C2 acceptance is claimed.

At clean runtime/harness head `5fcfbe43ae696c2706e208742dd8aeb8772915ae`, a
fresh `Earned Act I` Sorceress hires the ordinary Inner Sight Rogue, spends
her one starting point on Fire Bolt, uses Fire Bolt, and launches exactly
40 Blood Moor manual challenges. Each real W1 reward settles once; the
installed W2 is abandoned through the native Flee sequence for zero reward.
The clock is fixed at `1792497600000`; production chooses every seed and
persisted challenge ordinal. No imported save, seed/ordinal override,
injected stats/items/resources, extra farm, or retry is used.

Observed totals: 11,080 hero XP, 8,310 merc XP, 344 unique earned backpack
items, and 5,157 rune shards. The Sorceress reaches L6 with 67 XP, 5 skill
points and 25 stat points; her original core stats remain unchanged. The
normal challenge ordinal advances from 0 to 40. All 40 W1 attempts win with
the original hero alive; each W2 Flee has zero progression delta.

The accepted historical guard expects `it-8jv2k-1` without a
`socketCapacity` field. Its actually earned current-runtime instance has
the same ID and every historical property plus own `socketCapacity: 1`.
The strict full-object guard therefore refuses before any L6 spending,
equipment transfer, quest start, or Den attempt. The guard has zero earned
delta and identical before/after state hashes. A subsequent read-only audit
finds all eight historically selected items with every historical field
equal; each additionally owns a native socket capacity. This identifies a
stale evidence-harness schema assertion, not a missing item or combat loss.

The immutable [original report](fixtures/fresh-native17-campaign-screen/original-literal-refusal.json.gz)
uses the existing lossless observation encoding, not a save/checkpoint.
Its [summary](fixtures/fresh-native17-campaign-screen/original-literal-refusal-summary.json)
retains source/data/policy hashes, report hashes, the exact refusal, and the
eight-item read-only audit. Source identity is equal before import, before
execution, and after execution. Runtime/data source is unchanged.

The screen's two focused contract tests, TypeScript check and explicit
scoped ESLint check pass. The 40-wave invocation takes 8.45 seconds overall
(2.694 seconds inside the route); 962.892 logical combat seconds are
diagnostic simulation time, not observed player pacing.

Reproduction at that frozen head, with an existing external output parent
and a new output filename:

```sh
FRESH_CAMPAIGN_STAGE=accepted-preparation \
FRESH_CAMPAIGN_REPORT_PATH=/absolute/new/output.json \
npx vitest run --project sim-contracts tests/sim/production/fresh-campaign-screen.test.ts
```

The driver defaults to a one-wave smoke screen; ordinary test discovery
does not repeat the 40-wave experiment. The historical refusal remains
unchanged when a separately frozen native17 recipe follows.
