# BUG-225 — Require real bodies before corpse searches or Grim Ward

- Status: all three skills locally repaired and verified; independent design/QA and earned acceptance remain open.
- Original severity: High — corpse-dependent skills paid without real bodies/outcomes.
- Owner: root, engine/data/UI; independent design/QA and earned balance open.
- Original reproduced build: `98ad7970` plus frozen warcry-control implementation; these three
  skill definitions and their generic self-buff/debuff routes are unchanged.
- Environment: Node24 native combat, seeds7/19/41/97, legal native L30Barbarian
  ranks1/2/20; no browser viewport. Both locales advertise corpse searches or
  a corpse-created ward. The game invariant prohibits red/blue potion items.
- Affected systems: Find Potion, Find Item, Grim Ward, shared corpse supply,
  recovery/material outcomes, finite fear and truthful descriptions.

## Original reproduction

1. Allocate each skill and its full native prerequisite chain, then prioritize it.
2. Declare synthetic million-HP/100MP pools,200Attack/100Defense, hero100Attack
   Speed and enemy50Attack Speed. Hold the hero only after2701ms.
3. Run each rank/seed case. The first hero action is1700ms and the first enemy
   action is2000ms. No unit dies at any time, so no eligible corpse can exist.
4. Verify unchanged inputs/exact replay. Retain all36observations before the
   deliberately failing final assertion. No state is treated as earned.

Expected: a corpse-dependent skill cannot cast, debit MP, start cooldown or
produce an effect with no eligible body. A successful future implementation
must consume the shared body exactly once and yield its explicitly defined
recovery/material/ward consequence. At reproduction, Find Potion also needed a
no-potion adaptation; its name does not authorize adding prohibited items.

Original result: all36cases cast at1700ms and debit MP despite zero deaths/bodies. Find
Potion/Find Item produce self markers; Grim Ward produces an enemy marker,
with no spawned ward and ordinary enemy actions still occurring at2000ms.
No corpse consumer exists for these generic effects. This reproduction proves
the missing body gate; it does not establish earned economy or outcome tuning.

Evidence: `next-corpse-skills-probe.ts`, `next-corpse-skills-observations.json`
and its intentional failed terminal receipt in the retained
[warcry-control packet](../../docs/plans/evidence/fixtures/barbarian-warcry-control/packet.json).
The original reproduction preceded repair; no genuine campaign or remote action.

## Find Potion repair

Source `ef6e8dfc` supplies native-authorized shared FIFO consumption, paid capped
HP/MP recovery without potion items, pure no-body/no-useful-gain fallback, native
wave refresh and truthful bilingual UI.112 new regressions, engine8261/308,
full16656/751/two existing skips, types/lint/build/precache and production4/4 pass.
[Bounded evidence](../../docs/plans/evidence/d06-find-potion.md) retains raw failures,
source/build identity and cleanup. Author tuning remains provisional; independent
QA/design and earned balance are open. Find Item is subsequently repaired below. At that stage Grim Ward still lacked its
real corpse-dependent outcome; its subsequent local repair is recorded below.

## Find Item repair

Source`d8171e71`/strict defaults`ba279f7a` replaces the inert MF marker with a
real shared FIFO search, one paid seeded draw and private immutable successes.
Guarded wave victory validates original slain bodies and grants ordinary salted
bonus loot together with normal loot; no extra XP/quest credit, log-driven payout,
partial grant or replay duplication.144new tests; engine8324/309, full16800/755/
twoexisting skips, types/lint/build/precache and final production4/4 pass.
[Bounded evidence](../../docs/plans/evidence/d06-find-item.md) records exact loot
ownership, online/offline persistence, raw failures/cancellation, visual limits
and cleanup. Root author review only; chance/earned economy and independent
acceptance remain open. Grim Ward was still unfinished at that stage; see below.

## Grim Ward repair

Source`e67f0349`and production tests`775fc1aa`consume one shared FIFO corpse
with ordinary payment and native learned authority, then create one private
finite wave-local ward/caster. Real timed Howl pulses interrupt current hostiles;
boss duration, source death, exact expiry and no active recast are enforced.
No summon/reward identity, incoming-marker authority or saved paid state.
75new regressions; engine8350/310, full16875/759/twoexisting skips, final types/
lint/build/precache/bridge and production4/4 pass.
[Bounded evidence](../../docs/plans/evidence/d06-grim-ward.md) records exact
production save/ownership checks, original failures, author review and cleanup.
All three original corpse-skill defects are locally repaired/verified. This is
not independent design/QA, earned economy/balance or full campaign acceptance.
No forge closure/approval is claimed. Battle Command is separately reproduced
in BUG241 and remains unimplemented/uncredited.
