# Fresh native17 campaign screening

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
