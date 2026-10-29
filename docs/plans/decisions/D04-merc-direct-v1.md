# D04 — Seven native mercenary damage skills

Status: scoped native contract approved by independent producer plan review.
Parent checkpoint: `217552eb288bd137e390d3f0d9787847220b3a2d`.

`docs/design/gacha-spec.md` §4.1–4.3 advertises seven attacks that still execute
hardcoded placeholders. BUG-374 records causal real-loadout failures before repair.
Resolve the exact seven JSON rows as one immutable catalog, without changing
shared combat runtime, persistence, equipment gates or recruitment.

| ID suffix (`mskill-`) | Flat base / type | CD | Recipients and payload |
| --- | --- | --- | --- |
| fire-ball | 50–80 fire | 4s | First two prioritized living enemies; landed Burn10% mitigated hit per second, canonical3s/max5 stacks; retain actual Fire Mastery |
| glacial-spike | 40–60 cold | 5s | One ordinary selected enemy; 30% landed canonical2s Chill/50% attack-speed multiplier |
| charged-bolt | 12 lightning per attempt | 4s | Five independent attempts rotate original prioritized living pool; retain landed Paralyze1s and existing diminishing returns |
| smite | 22–35 physical | 2s | One ordinary selected enemy; 25% landed Stun1s/boss0.5s |
| chop | 16–26 physical | 1s | One ordinary selected enemy; +25 percentage points critical chance for this effect only, ordinary overflow |
| pierce-thrust | 20–32 physical | 2s | First two distinct prioritized living enemies; ordinary Defense |
| basic-swing | 18–30 physical | 1s | One ordinary selected enemy |

All have zero MP, min1/max20, no rank growth or Attack contribution, one action
and cooldown per cast. Existing damage, status, sequence, targeting and critical
primitives settle each attempt. Dead originals are skipped; a dead caster stops
the bolt sequence. No forced hits or Defense/resistance bypass.

The two-target Fire Ball, cold proc interpretation, flat scaling, explicit zero
cost, bolt distribution and canonical control durations are reconciled scoped
choices. The short gacha table's omission of Burn/Paralyze does not remove those
authored payloads. This does not add a global elemental status rule or promise a
new Paralyze after-slow mechanic. Native actual-loadout tests preserve factory
secondary skills/passives. Reconcile both locale descriptions to this contract.

Validation: frozen actual-loadout RED→unchanged GREEN, strict schema/resolver
identity and immutability tests, native combat/status/sequence/resource cases,
public recording publication/playback, ordinary unit/types/lint and external
build. Evidence remains constructed mechanics, not earned acquisition or balance.
Browser, devices, localization rendering, accessibility, campaign pacing and
full-v1 acceptance remain unresolved under terminal H3 failed-no-app. No browser
retry, protected retained-final fixture access, diagnostics or replacement gameplay
experiment follows from this decision.
