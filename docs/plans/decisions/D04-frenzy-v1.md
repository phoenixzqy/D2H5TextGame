# D04 — Frenzy dual attempts and hit-earned speed

2026-10-25. Preimplementation author contract for [BUG216](../../../production/bugs/BUG-216-frenzy-inert-speed.md).
Root sole writer/reviewer; independent design/QA and earned balance remain open.

## Player behavior

One paid Frenzy cast makes two independent ordinary attempts against the same
original single enemy. Misses consume attempts; stop on original target or caster
death, no replacement. Preserve Physical85–120/+8rank per attempt,12MP/CD1 once,
unlock24/cap20, Double Throw prerequisite and existing equipment eligibility.
Two attempts is an explicit author resolution of the existing dual-wield promise.
No new weapon stat/equipment restriction is introduced.

Every positive hostile direct Frenzy HP loss grants the surviving native hero
one speed stack; blocked/absorbed-to-zero, missed, basic, periodic, reflected,
aura or unrelated hits never grant/refresh stacks. Both landed attempts can
stack. Provisional JSON tuning:+5% of base Attack Speed per stack, cap5,+25%max,
6000ms lifetime refreshed by each qualifying hit including at cap. This tuning
is author-selected, not measured earned balance. Rank scales existing damage;
speed tuning is constant. Ordinary additive speed composition/clamps, Chill,
stuns and scheduler progress reconciliation remain authoritative. Never mutate
base stats or multiply a previously modified speed; expiry reverses the bonus.

## Runtime and boundary contract

Add optional typed frenzy tuning/effect marker, native frenzyRank and authenticated
finite self status. Native class/unlock/prerequisite/rank/selected-priority capture
is wave-local. Only living original player heroes with valid fresh Frenzy authority
can gain/use stacks; mercs/enemies/summons/foreign or malformed markers confer none.
Use one generic internal finite hit-speed stack lifecycle for Feral Rage/Frenzy;
keep existing Feral exports/data/8s behavior and markers unchanged. Exact owner,
marker, integer stack/cap, finite lifetime and no-extra-payload validation matter.
Copies must preserve input immutability and isolate mutable status arrays.

Carry valid paid statuses across waves with ordinary clock rebasing; refresh fresh
native authority at the boundary. Removing Frenzy from configured skills/respeccing
to0 stops carried potency next wave; current recording stays immutable. No saved
combat payload, migration/version/dependency or resource refill. Closed schema
owns Frenzy-only capability, exact two default attempts/single-enemy/Physical and
existing eligibility/cost. Reject per-original mode, foreign statuses, recovery,
shape and contradictory metadata. Generic speed helpers do not grant skill access.

## Proof and delivery

Write REDs before behavioral implementation. Prove ranks1/2/20 ×four seeds, actual
two attempts/one payment and HP loss; independent miss/crit/mitigation, original
and caster death/reflection, zero-HP-loss no stack, cap/refresh/exact expiry,
changed action timestamps and unchanged base stats, cooldown/basic fallbacks,
Chill/stun interaction and Feral compatibility. Prove malformed/foreign/duplicate
markers do not amplify; native class/unlock/prerequisite/rank/aliases/MAX and
current-wave/next-wave/respec/save lifecycle preserve resources. HP/MP/living
active-status playback and exact seeded replay must match authority.

Actual zh-CN/en UI shows damage per attempt, total attempts, per-hit speed/cap/
duration, payment and expiry, current/next/unlearned/MAX. Production public
allocation/priority/cast, desktop/mobile and exact five-domain Save-close-new-page-
Continue; five-size geometry and individually inspected screenshots. Synthetic
fixtures are mechanical proof only. Focused/compatibility/real loader/engine/types/
lint/build/browser and full suite before delivery. Only Frenzy gains inventory
credit after full local validation; independent/earned gates stay open.
No genuine campaign/remote action; preserve umbrella worktree/claim and clean only
verified task-owned artifacts after retaining raw receipts and source/build hashes.

Author security check: pass; first-party local combat/schema/display, no external
network/credentials/CI/permissions. Author plan review: ready; reviewed existing
Feral lifecycle, native rebase and action-period reconciliation. Shared lifecycle
extracts the existing behavior and preserves Feral public interfaces while adding
a separate optional Frenzy capability. No required finding; not independent approval.
