# P15 — Eight monster signature priorities

Root adopts the design adviser's eight-row proposal on2026-10-30under the
existing private-v1 scope. These are new bounded role decisions following the
signature-before-generic precedent, not recovered numerical approvals.

| Monster | Native encounter level | New exact skill order |
| --- | --- | --- |
| monsters/act2.claw-viper | 15 | `["monster-poison-spit", "monster-weak-melee"]` |
| monsters/act2.vulture-demon | 14 | `["monster-charge", "monster-strong-melee"]` |
| monsters/act3.jungle-hunter | 27 | `["monster-leap", "monster-weak-melee"]` |
| monsters/act3.spider | 27 | `["monster-poison-spit", "monster-weak-melee"]` |
| monsters/act3.swamp-dweller | 29 | `["monster-poison-cloud", "monster-weak-melee"]` |
| monsters/act3.doom-ape | 30 | `["monster-charge", "monster-strong-melee"]` |
| monsters/act4.abyss-knight | 42 | `["monster-charge", "monster-strong-melee"]` |
| monsters/act4.oblivion-knight | 45 | `["monster-bone-spirit", "monster-strong-melee"]` |

Preserve every other row/field, native registry/selector, affixes, maps, rewards
and boss overrides. Charge remains physical60–90/CD4, Leap physical40–60/CD3
single-target without stun, Spit poison20–30/CD2with500msflight/status, Cloud
poison15–25/CD3all-enemies/status, BoneSpirit arcane40–60/CD2with500msflight.
Weak/StrongMelee remains physical10–15/30–50,CD1. All cost0MP. BoneSpirit does
not implement Oblivion Knight's separate advertised curse; Izual's accompanying
knights also gain this signature and later earned balance must include them.

Native Charge sequences are signature→generic→generic→signature; other rows
are signature→generic→signature at base cadence. Generic skills still suppress
ordinary fallback. No ordinary-growth numbers are authored;101numerical rows
remain outstanding. Other already reviewed rows and excluded multiple-signature,
trigger/buff/flee or boss-linked roles keep their contracts.

Validation: genuineRED, native functionalGREEN, schema loader, related controls,
types/lint and independent review; one frozen paired diagnostic with exact
list-only delta and full raw retained evidence. Threat changes must be reported;
functional success does not accept earned campaign/build/pacing balance.
