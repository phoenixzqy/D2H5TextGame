# Retained acquisition costs and currency tuning controls

Full v1 remains incomplete. The previous goal turn made progress: exact
Javelin1195→1314 completes ActV with authenticated cumulative training. This
turn reuses that earned history, closes a currency data-boundary defect and
records acquisition/pacing pressure without replaying combat.

## Continuous earned chain

A read-only reconciliation follows18pinned report segments back to the fresh
level1character. Initial currencies/materials are empty. Every reference hash
and complete predecessor-successor→continuation-initial state matches. Native
per-segment economy audits and the paired original pilot correction remain
linked. Three injected junction faults (currency, ordinal, item) are refused.
Historical training audit errors remain visible; this does not replace their
required paired readbacks or establish a representative acquisition sample.

The full chain retains1314admissions/7020waves/23defeats,74,964awarded gear
items,67,893native salvage removals and17audited socket insertions. Combat
totals20.333h; native execution totals36.071min across these adaptive segments.
First chapter-boss victories occur at cumulative combat hours1.029/2.011/6.283/
9.274/20.333. Combat/farming in another act is attributed to its actual area,
not duplicated as both training and chapter time. No stage's cumulative
checkpoint is counted a second time after resume.

Terminal balances are49,114,796rune-shards and98,607wishstones. The latter
funds1095current90-cost ten-pull batches (10,950pulls). Net retained wishstones
are a lower bound on gross income:4849.533per combat hour. This Normal1–55
exploratory chain is not the L70Hell80wishstone/h target cohort and does not
establish a population rate or a new chosen rate. The D10 decision already
corrects the old timing error:80/h makes a90-cost batch67.5minutes, not8.

The backpack ends6545items, including6476rares; stash499. The existing normal-
only sink preserves this surplus. Lowering a drop count without checking
build acquisition would be speculative, so no sink/rate is silently changed.
This pressure must inform the upcoming versioned acquisition/economy policy.

Combat-only20.333h needs9.667/19.667/29.667additional measured decision hours
to produce30/40/50active hours—equivalent to26.484/53.881/81.279seconds per
admission. These are sensitivity values, not a calibrated menu policy or human
pace claim. Ordinary-session calibration and build fairness remain open.

## BUG574 implementation

Wishstone amounts/champion probability/boss difficulty multipliers and shard
base/tier/variance values were embedded in the engine, contrary to JSON-driven
tuning requirements. They now live in required closed Ajv-validated
`material-economy.json.currencyRewards`. The existing loader exposes typed
rules and the existing secondary-drop origin consumes them. No persisted state
or currency identity changes; no save migration is needed.

Champion defaults explicitly award1in every act after the existing0.4gate. The
old unused act1/2zero entries are not accidentally activated. Variance remains
min+draw×span, retaining exact arithmetic and draw consumption even at span0.
Boss-only difficulty scaling and currency-find scaling keep their owners.
Other material pool/chance settings are exactly unchanged.

Five meaningful configured-rule tests fail on the original hardcoded values.
After the fix119affected currency/material/award checks pass with zero pending,
as do scoped strict types and explicit lint. The production1680case matrix
(7tiers×5acts×3difficulties×16seeds; levels1/25/70,find0/50/300) matches complete
outputs and the following RNG value before/after, digest
`71df2c14fc4c077beb37c75789db4d1089789af46f1e73a37679bc9f865e30d3`.
This verifies default compatibility, not a win-rate/balance population.

`validate:data` is absent from package scripts. The focused checks invoke the
production Ajv loader with authored data and refuse missing/invalid tiers,
negative amounts, nonfinite variance, invalid chance, act lengths/fractions,
missing difficulty and unknown keys. No replacement tool/install is introduced.

Authority20 records4production-input changes and2new engine test inputs,2093
total. Source/data hashes change; do not claim the old hashes still describe
current files. Default compatibility bridges this extraction to retained
outcomes; subsequent tuning needs its own declared evaluation. Campaign
helpers/manifest are unchanged. No completed act/build/browser or broad-suite
run occurs. Accepted balance cells remain0.

## Custody and next action

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Retain `p15-javelin-chain-economy-readback-v1.json`, both
`p15-currency-default-baseline-v1/v2` drivers/launchers/receipts,
`bug574-currency-red/green-v1.json`, authority20 and prior native evidence
through root/full-v1 review consumers. Exact scoped type config was archived
with contents/hash and removed after terminal tools; both task caches are
absent. Cleanup receipt: `bug574-currency-artifacts-v1.json`. Root retains
the active claimed worktree and owns removal after consumers finish.

Next freeze bounded reward-acquisition/faucet candidates using the retained
farm contexts and intended gear/merc goals before another expensive campaign
batch. Full14build funding distributions, fairness, disjoint populations/
holdouts, within-three/manual-idle, calibrated30–50active hours, integrated
G0–G7,soak,review and later owner playtest remain. Browser works; CI excluded;
no pending question or external blocker.
