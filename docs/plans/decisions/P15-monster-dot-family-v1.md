# P15 — Seven monster elemental DoTs

Adopted2026-10-30 by root under authorized complete private-v1 implementation,
after read-only design advice. New provisional extension of existing tuning;
this is not recovered historical approval or campaign balance acceptance.

Sources: D04-sorceress-direct-fire-v1§Burn, D04-poison-dagger-v1§Poison,
D06-mage-signature-effects-v1§Elemental effects and D04-combat-timing-v1b.
Fire uses10%final mitigated direct hit/second for3000ms; poison/plague5%for
5000ms. Both apply one stack per landed hit, chance1. Existing caps remain
Ignite5/Poison10/Plague10, retaining first positive potency on refresh. Existing
rounding max(1,floor(hit×fraction)), integration/carry, no second mitigation,
promotion, Cleansing and Plague death spread remain unchanged.

| Authored monster skill | Native direct range | CD | Target | Status |
| --- | ---: | ---: | --- | --- |
| fire-bolt |25–40|2|single-enemy|ignite|
| fire-ball |40–60|3|area-enemies|ignite|
| fire-arrow |20–35|1|single-enemy|ignite|
| inferno |40–60|3|all-enemies|ignite|
| poison-cloud |15–25|3|all-enemies|poison|
| poison-dagger |20–30|1|single-enemy|poison|
| plague-spit |20–30|2|single-enemy|plague|

All rank1/minLevel1/maxLevel1/MP0. Preserve500msflight on Bolt/Ball/Arrow/Spit
and none on the other3; Arrow ranged, Dagger melee, other5spell. No native
combo tags are added. Normalize JSON's five divergent range/CD entries to the
native values above; fire's catalog burn→ignite and Spit's poison→plague preserve
the native emitted IDs and death-spread eligibility. Descriptive tags stay
catalog-only. Replace exactly7stubs with a copied frozen validated JSON resolver;
do not duplicate numeric tuning in TS. Require positive finite rate/duration,
one matching status/type, zeroMP, finite valid range and no unsupported payload.

Controls: custom BloodRaven arrow, FireBreath, PoisonSpit, mercenary arrows and
all unselected catalog rows. Projectile projection may copy installed effects;
immutability claim covers resolver-owned tuning, with installed values and
delivery separately tested. Do not broaden registry projection behavior.

Verification: actual failing native positive-potency tests before mutation;
aliases, input isolation, schema rejections, real periodic damage, mitigation,
dodge exclusion, expiry/refresh, poison/plague identity, native consumer orders,
replay and plain/recorded parity. Scoped regressions, strict types/lint follow.

Frozen bounded diagnostic: seven real L20trash consumers (Salamander,
SerpentMagus, DarkRanger, MegaDemon, SwampDweller, Fetish, Infector), seeds0–31,
native skillOrder plus a declared single-skill probe per consumer; two unchanged
controls Tainted and DarkArcher. 16cells/512fights per arm. Synthetic hero2000HP,
80Attack, AS100, no gear/skills/defense/resistances/dodge/crit; no earned build
claim. Native60s/1000actions,240swall,128MiBcompressed cap; full inputs/recordings,
source hashes stable within arms, replay/immutability, controls exact and all
outcomes/DoT/direct sources recorded. No outcome-driven reruns or tuning; no
reward/drop/pacing inference. Capture baseline before production mutation.

Plan/root-cause review: existing OnHitStatus/periodic engine is sufficient;
JSON-authoring fixes the zero-rate cause without a second DoT subsystem.
Security review: local pure-engine/game-data work only, no credentials/network/
permissions/publication/installs; existing worktree/packet retained, exact owned
cache/process cleanup. CI excluded and browser launch resolved.
