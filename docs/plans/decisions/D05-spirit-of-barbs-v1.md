# D05 — Actual passive Spirit of Barbs

Local implementation contract for BUG189. Root is sole writer in the existing
umbrella checkout. No independent/earned acceptance or inventory credit yet.
This completes an advertised summon promise; a hero-only stat patch cannot do so.

## Objective and authority

The authored Druid row is a passive, unlock30/cap20, requiring learned Heart of
Wolverine (and its Oak prerequisite). Preserve4% reflected damage and2% summon
Defense per allocated rank. Both locales promise a summoned spirit. The adapter
currently makes only an inert buff and there is no spirit template/creation path.
The native seed7 causal RED at `aca09a8` has2 missing-summon failures/4 controls.

At every nonterminal wave entry, a living eligible original Druid automatically
creates one actual source-owned `spirit_of_barbs` support summon at time0, without
a combo slot, ordinary action, mana payment or cooldown. Capture exact aliases
MAX/cap, integral level, class and full prerequisite authority once per wave.
No implicit rank, manual buff marker, foreign projection or preloaded unit grants
these capabilities. The engine records the newly registered spirit identity;
only that actual creation authenticates its effects. At most one authenticated
spirit is created per wave; death never causes replacement in the same wave.
Arbitrary standalone preloaded units cannot supply this creation attestation.

## Runtime rules

The spirit is a real living, targetable owned summon, uses existing battle-local
identity, grid placement, death/orphan closure, playback and localized summon name.
It neither schedules nor takes ordinary actions and makes no attack. Use a
JSON-owned `passiveSummon` tuning object on its exact authored skill row:
`{summonId:'spirit_of_barbs', stats:{life:80, attack:0, defense:10}}`.
Life80/Defense10 reuse the existing generic summon baseline as explicit provisional
values; they are new template tuning, not earned balance evidence. Other ordinary
summon defaults/mitigation remain existing behavior. Do not invent new artwork.

Both source hero and its authenticated spirit must be living. Crowd control alone
does not disable the effects. Living original hero, original fielded merc and
source-owned living summons reflect4% per rank of actual HP lost to a surviving
hostile physical hit. Use the existing reflection pipeline, thorns mitigation,
integer floor/minimum and no-recursion rules; add to independent existing reflection
sources without a new RNG draw. The2% per-rank Defense bonus applies only to
source-owned living summons (including the spirit), additively with independent
Defense bonuses over the stored fresh Defense. Hero/merc Defense is unchanged.
Do not write boosted stats back into saved units or repeatedly compound them.

Spirit/owner death disables bonuses before subsequent damage/recovery and removes
derived positive chips from survivors. Generic summon-death mana refunds and
cooldown clearing must not run for this free passive spirit. Existing unrelated
prepared/corpse/item-bound summons retain their policies. Oak/Heart can benefit
the real spirit through their current shared party projection/capacity path.

Native recordings freeze the current configuration; allocations/respec/equipment
apply next wave. A new run/import recreates the spirit from current authority.
Original-resource replay remains deterministic and cannot grant duplicate income.
Save22 persists allocations only, with no transient spirit identity/rank/template
state, version bump or migration. Current/next descriptions show actual scaling,
passive creation/no-replacement and source-life requirements in en/zh-CN. Fresh
summon previews use the same JSON baseline. Status/summon presentation cannot grant
engine capability. Existing mobile occlusion remains separate open UI work.

## Implementation and verification

Use existing TS strict/seeded engine and i18next/React/Zustand patterns. Definitions
copy immutable primitives after shared Ajv validation; e.g.
`return Object.freeze({ sourceHeroId: player.id, rank });`.

Sequential increments, each with its own focused validation and commit:

1. Authored tuning/schema/types, immutable definition/eligibility and pure tests
   (up to5 paths). Preserve coefficients, reject malformed tuning/aliases/roles.
2. Real template, engine startup/attestation/Defense/reflection/status paths,
   native wave capture and engine/native integration tests; split source/tests
   into reviewable groups. Genuine native RED must become GREEN. Prove rank1/20,
   unslotted creation, source/spirit death, no action/replacement/refund/RNG draw,
   owned summons/original merc and malformed/foreign/preloaded controls.
3. Bilingual details, summon preview/name and positive-chip playback with actual
   component regressions; then public production browser cases at360×640/1280×800
   in en/zh-CN, required geometry and exact Save-close-Continue domain comparisons.
4. Stable full suite/types/lint/production build/bridge; frozen source/build/Git/
   genuine-save hashes, local review, byte-verified evidence and exact cleanup.
   Only then credit the one Barbs row. Independent QA and earned balance stay open.

Commands: `npx vitest run --project ui src/stores/spirit-of-barbs-causal.test.ts`;
`npx vitest run --project engine src/engine/skills/spirit-of-barbs.test.ts`;
`npm run test:engine`; `npm test`; `npm run typecheck`; `npm run lint`;
`VITE_E2E=false npm run build -- --outDir <exact task-owned build directory>`.
Tests live beside source; retained raw results and scripts live under the named
task scratch until archived under `docs/plans/evidence/fixtures/spirit-of-barbs/`.

Always preserve original failed outputs, old assertions, strict source ownership,
full-v1 scope and genuine campaign save. No new dependency/CI/permission/network
integration, remote publication, genuine campaign action, broad process killing,
validation bypass or unrelated cleanup is authorized in this batch.

Security check: pass — pure local gameplay/data/test/UI work, no credentials or
external side effects. Retain strict source/creation attestation and Save22.
Plan review: ready after explicitly separating actual creation attestation from
untrusted preloaded units and excluding support summons from action scheduling,
including period reconciliation, and from death refunds. Root self-review is not
independent design/QA approval. Full privatev1 remains unfinished.
