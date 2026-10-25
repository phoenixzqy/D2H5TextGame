# D04 — Sorceress direct fire attacks

2026-10-25. Root sole implementation/review; independent design/QA and earned
balance remain open. This batch implements the advertised direct attacks;
Hydra, Inferno, Blaze and Fire Wall retain separate unresolved mechanics.

| Skill | Fire base / growth per additional rank | MP / cooldown | Recipients / landed payload |
| --- | --- | --- | --- |
| Fire Bolt | 30–45 / +4 | 8 / 1s | One hostile; Burn |
| Fire Ball | 70–100 / +7 | 20 / 1s | One hostile; Burn |
| Meteor | 100–150 / +10 | 50 / 4s | All living hostiles; Burn then Armor Melt |

Existing JSON damage, costs, cooldowns, unlocks1/12/24, cap20 and prerequisites
are preserved. Existing legacy Melt-metadata opt-out remains schema-valid;
the production row retains its explicit secondary payload. The §3.1 design table promises All for Meteor; BUG229 reproduces
its box exclusion. Select all-enemies in JSON and the legacy builder, removing
the unused shape. Fire Ball remains the design's single-target explosion;
no extra splash, channel, delayed impact or periodic meteor hits are invented.

Each selected target has one independent ordinary hit/base/critical decision.
Each cast pays once and starts one cooldown; misses apply no Burn or Melt.
Fire resistance then ordinary Defense mitigate direct fire hits; flat Magic
Resist does not. Personal Fire Mastery/matching increases retain normal rules.

Burn is the shared ignite alias:3seconds, up to5stacks. Each new stack uses
the first active stack's source/type/DPS, with initial DPS=max(1,floor(final
mitigated hit×10%)); reapplications add a stack and refresh expiry without
replacing an active rate. Expired stacks start afresh. Periodic damage is
integrated over time, with no second mitigation. Melt applies after Meteor's
direct hit, reduces ordinary Defense30% for3seconds, refreshes without
stacking, and can improve later Defense-mitigated fire/physical/poison hits.
It does not amplify the first hit retroactively or bypass resistance.

The existing native active projector owns class, level, rank, aliases and
transitive prerequisites. Verify native allocation, current recording isolation,
next-wave no-refill and real import. Keep save22 and genuine Ancients401 exact.

Delivery: reproduce BUG229; fix data/schema/legacy registration; verify actual
damage/recipients/payment/Burn/Melt at ranks1/2/20 and fixed seeds; reuse the
existing pure Burn preview; show truthful bilingual damage/payment/targeting
and Melt descriptions at current/next/MAX; validate public en/zh mobile/desktop
casts and ordinary/offline Continue. Preserve failures and exact terminal
receipts; full quiet regression follows other expensive work. Credit inventory
only after proof, retain evidence and clean verified task-owned output.

Browser visual review additionally reproduced BUG230: shared combat status
translations omitted Armor Melt, exposing its raw ID in logs/chips. Add its
existing player-facing names in en/zh combat resources and two literal log
regressions. Final browser proof must observe localized Melt as well as Burn.

Security check: pass. Local first-party gameplay/data/UI/tests only; no
credentials, dependencies, CI/permissions, remote actions or save-schema change.
Plan review: ready after including overflow/separation, Fire's Defense path,
post-hit Melt, live periodic HP loss and stack/expiry semantics, native authority
and public persistence. Scope does not accept independent gates or full v1.
