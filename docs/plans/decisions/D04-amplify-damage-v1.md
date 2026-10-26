# D04 v1g / P08a02 — authored Amplify Damage resistance curse

Status: root design/technical contract; producer PLAN-REVIEW APPROVE.
Input854e88f (includes09fe00f and accepted P03b05b).
Design agent read-only investigation found actual production curse inert and
missing duration/potency. This card accepts neither fullP08/C1 nor all curses.

## Sources and explicit design choice

skills-spec.md:85 promises -50% physical resistance; combat-formulas.md:148–159
defines resistance before defense and clamp[-100,75]. Actual Necromancer JSON
144–167 targets all-enemies, cost15/CD3, ranks1–20, cost growth-0.2 and CD-0.05;
registry production override emits amplify-damage debuff without duration. Locale
copy only says several turns. No source establishes an exact duration. Root
records **3000ms at every rank** as an explicit v1 design choice, not a recovered
authority or the accidental unknown-status1s fallback. Author duration/potency
in JSON; preserve current rank-scaled mana/CD including rank20cost11/CD2.0.

Subtract50 percentage points once per direct physical hit before existing act
penalty/clamp/defense. No combo multiplier, stat mutation, double mitigation,
stack/duplicate summing, resistance rescaling, thorns/elemental/periodic change.
Physical100,defense10/resistance50→40normal/90cursed;res0→90/140;
res-75→165/190;res100→15/40. Negative floor and subtraction-before-cap are required.
Trash/boss/chapter-boss share potency/duration; freeze/stun boss policy unchanged.

Canonical status amplify-damage; recognize legacy amplify, keep amp-damage as
tag only. New/replaced applications canonicalize. All-enemy living targets,
no hit/damage/RNG on curse application; current recast while active and mana/CD
rules remain. [start,expiry) activity; active refresh preserves original stored
ID/source/start/potency and max finite expiry, indefinite stays indefinite.
First stored family match refresh/replacement follows existing D04 policy; never
deduplicate or rewrite other records. Damage reads first ACTIVE family match,
so pending/expired earlier records cannot mask a later active record. After
replacement the new earlier record is authoritative. Explicit removal matches
family. Rebase/expiry/death/immutable/replay semantics remain unchanged.

Legacy matching records without modifier payload use the authored family default
50points without inventing clocks; explicit0 stays0. This is an explicit legacy
semantic choice making existing intended curse identities functional. New
applications carry complete scalar potency; refresh never replaces it. Resolve
authored defaults through a small pure JSON definition module, not the skill
registry (avoid cycles), duplicated tuning literals or live mutable stats.

## Sequential bounded implementation

Worker must claim its own isolated human-pool worktree from latestmain, then
deliberately integrate input854e88f plus this reviewed control. You are not alone:
preserve other agents' edits and never revert them. Root owns shared control,
BUG031 and ledger/integration; worker may own required BUG031 if explicitly
assigned. No remote publication. Each child needs independent source review
before integration/next runtime stage; final combined validation required.

1. P08a02a metadata, five files: src/data/schema/skill.schema.json,
   src/engine/types/skills.ts,src/engine/skills/effects.ts,
   src/engine/skills/dataCatalog.ts,src/engine/skills/registry.test.ts. Add optional
   statusEffect.durationMs and physicalResistReductionPct, emit them only on
   the exact production Amplify debuff. No invented metadata for other skills.
2. P08a02b authored definition, five files: src/data/skills/necromancer.json,
   src/data/schema/skill.schema.json,src/data/loader.test.ts,
   src/engine/combat/amplify-damage-definition.ts,
   src/engine/combat/amplify-damage-definition.test.ts. Set3000/50 for actualID;
   schema conditionally requires both for
   it when data lands. Export pure immutable authored defaults, no registry cycle.
3. P08a02c runtime, five files: src/engine/combat/types.ts,
   src/engine/combat/status.ts,src/engine/combat/combat.ts,
   src/engine/combat/status.test.ts,src/engine/combat/skill-resolution.test.ts.
   Propagate complete scalar into new statuses; use
   active alias family in physical damage preflight; preserve aggregate refresh.

Shared schema/dataCatalog changes are serial.
No save migration, generic effect rewrite, other curse/heal/passive/aura/gear/MR
or player-copy changes. Stop/review if a correct implementation requires expansion.

## Required proof

Genuine RED before each corresponding runtime/data change, structured BUG031
before fixing confirmed behavior. Metadata/schema negative cases may be new
acceptance gaps rather than independent gameplay bugs; identify them honestly.
Literal actual-registry ranks1/20 curse at400ms, fixed100-physical ally attacks
1700/3400ms, targetHP500/res50/def10,seed1:HP500 aftercast,410active,370exactexpiry;
uncursed460→420. Pin no crits/intervening damage and exact draws/HP/times. Both
recorded/unrecorded replay and input immutability; real HP assertions, not events
alone. Cost failure14/rank1 and10/rank20 fallback/no curse/no mana spend; CD/recast,
all living enemy targets/dead exclusion, bosses, explicit0, duplicate/pending/
expired/indefinite/missing-payload/alias first-match, subtraction/clamps/defense,
elemental/thorns/periodic negative controls. No browser acceptance in engine card.

Each worker runs focused then engine/related, fullU/T/L/build, changed-module
coverage and schema validation appropriate to changes. Record exact outcomes,
timing misses/warnings. Root+producer independent source/evidence review before
integration. Clean exact owned dist/.vite/coverage/scratch after all consumers,
verify, commit selectively and release claim; preserve small durable evidence.

Security check: PASS. Trusted local deterministic combat/data work; no external
publication, credentials, dependency, permission or validation-bypass request.
Producer read-only P08a02-D04-PLAN-REVIEW APPROVE: explicit authored duration,
legacy defaults/zero/duplicates, physical-only boundary and serial slices accepted.

## 2026-10-26 — Missing native/public acceptance continuation

Existing authored duration/potency/legacy-family semantics remain unchanged.
Root is sole author;no new independent approval is attributed to historical
reviews. Four test/config paths add actual native projection/allocation/fresh-wave
resources/active-curse seven-domain import and production public actual casting/
network-disabled Continue. Canonical focused145/5filesPASS;external draft native7
and browser4prechecksPASS. Canonical browser4/4/213.057s/types136.961s/full lint232.225s now PASS;full/source/
evidence/retention/cleanup remain pending. [Current evidence](../evidence/d04-amplify-damage-native.md)
records exact numerical checks,test-authoring corrections,limits and root-owned
active paths. No Amplify skill credit or earned campaign/balance change yet.
