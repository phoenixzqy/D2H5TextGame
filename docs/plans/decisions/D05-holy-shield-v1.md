# D05 — Paid Holy Shield

Local repair contract, 2026-10-25. Root is sole writer and author reviewer;
independent design/QA and earned class/build balance remain open.

## Mechanic and reconciliation

Consume both existing JSON coefficients: ordinary Defense +4% per allocated
rank and postmitigation absorption2% per rank (rank20: +80%/40%). Defense adds
over the fresh ordinary Defense base alongside other percentage bonuses, before
existing armor debuffs. It does not increase flat magical resistance.

The current engine has no block statistic/roll and JSON authors neither block
chance nor finite shield capacity. Follow the established paid Cyclone Armor
adaptation: deterministic reduction of all mitigated direct/periodic/reflected
damage, not an invented block roll. This is an explicit provisional v1 adaptation,
not canonical D2 blocking or earned balance. Explain it in both locales.
No shield-equipment requirement is authored; do not add one.

Preserve unlock24, Smite→Charge prerequisite chain, cap20, base35MP/4s,
cost−0.2 and cooldown−0.05 per rank above1 with existing cost rounding/CD floor.
One scheduled paid action, no extra RNG, no recast while paid. Run-long paid
carry follows current legal rank at fresh wave boundaries; reset/class/prerequisite
loss removes power. Imports/new runs/retries are unpaid. Current recording and
original-resource explicit replay remain immutable. No HP/MP/max-resource refill.
No persisted paid state; Save22 unchanged.

## Authority and settlement

Use native class-active projection with complete transitive prerequisites and
strict positive integral ranks within cap. Aliases combine by MAX once.
Only a living original hero with a native transient rank and source-bound paid
payload gains power. Markers alone, foreign roles and contradictory registered
effects/costs/cooldowns cannot grant power or charge a failed cast. Independently
validate/copy authored primitives rather than trusting mutable registry tuning.

After ordinary mitigation, settle Cyclone→Holy Shield→Energy Shield→Bone Armor
for trusted synthetic combinations. Native classes do not normally combine them.
Direct packets absorb floor(damage×rank×0.02). Periodic settlement uses cumulative
quota differences, starting at the paid cast, with no retroactive absorption or
partition-dependent rounding. Lethal-time prediction uses the same splitter;
Shatter stays lethal even with layered shields. Events/logs distinguish Holy
Shield prevention from finite Bone Armor and show actual HP loss. Base stats,
status potency, ordinary RNG/order and reward/provenance rules remain intact.

## Ordered plan and validation

1. Retain native rank1/20 RED before runtime edits; file BUG199.
2. Add paid definition/authority/state, native projection/refresh, registered
   effect and shared mitigation/damage consumers. Unit/native tests cover real
   HP/MP, full prereqs, forged markers/overrides, no recast, rank/lifecycle changes,
   periodic cast boundaries/partitions/lethal instant, reflection and Shatter.
3. Add bilingual current/next/MAX previews and clear lifecycle/prevention copy;
   verify public learning/configuration and production combat en/zh×desktop/mobile,
   five geometry sizes and exact five-domain Save-close-new-page-Continue.
4. Focused tests→engine→types/lint→explicit `VITE_E2E=false` build/bridge/precache
   check→final full tests. Freeze source/build/Git/genuine save before full and
   verify before staging. Review actual committed blobs. Preserve failures and
   exact cleanup ownership; keep genuine L33/next402/Baal-uncleared save unchanged.

Security check: pass — first-party local mechanic/UI repair, strict authority;
no network/credentials/permissions/CI/dependency/publication change.
Plan review: ready after requiring separate post-Cyclone periodic baselines,
exact Shatter/lethal settlement and source-bound carry. Root self-reviews only.

Conversion, other unverified skills, earned builds/Baal, C2–C4/fullG0–G7 and
complete privatev1 remain required. This packet does not reduce that scope.
