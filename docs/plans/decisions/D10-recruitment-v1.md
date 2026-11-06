# D10 — Complete recruitment rarity, pity and duplicate progression

Implementation contract, 2026-11-02. Root owns all writes. This refines the
locked gacha GDD and BUG594; it does not accept F07/P13 or remove any full-v1
requirement. Existing earned wallets, rosters and historical evidence are kept.

## Mechanics

Base SSR/SR/R rates remain the GDD's2/13/85%, with uniform selection within
the authored5/8/12 pools. Ten pulls cost90, one costs10. A counter records
completed consecutive misses. Therefore SR+ is forced on the10th draw after
nine R results, and SSR on the50th after49 non-SSR results. SSR resets both;
SR resets only SR. The forced SR slot retains the base2% SSR chance. SSR's
floor takes precedence when both apply. Old SSR counters above49 are retained
on migration and force the next paid draw, not a free grant or a load-time reset.

Each draw consumes one tier roll and one uniform identity selection, including
forced draws. A ten-pull equals ten singles under one continuous seeded stream,
threaded counters and ownership, apart from the authored bulk price. A newly
obtained identity counts as owned for every later draw in the same batch.
Duplicates produce15/5/2 merc-specific shards by SSR/SR/R, never another merc.

Every100 shards buys one star, up to five upgrades above base. Stars add8% of
natural base stats each, excluding equipment bonuses, and one signature rank
per star up to base+5. Star upgrade is an explicit atomic action. Remaining
shards stay owned at the cap; v1 does not exchange them into another currency.
All signature families must consume the resulting rank in real combat.

One history of the last100 draws serves both UI and persistence, resolving the
GDD's100/200 conflict to the existing authored uiHistoryCap100. Store timestamp,
identity, rarity and new/shard outcome; use a monotonically increasing ordinal
for stable ordering. Both pity counters, duplicate quantities and stars are
visible in zh-CN/en; history can be copied/exported. Animation is skippable.

Signature rank tuning uses the authored `signatureEffectPerRank=.12`: rank6
has1.60× the rank1 primary effect, within the GDD's50–80% target. Direct attacks
scale their authored base and weapon contribution; Minor Heal scales its seeded
integer range; War Cry scales finite control duration; Inner Sight captures its
Defense reduction; Frozen Armor captures personal Defense. Native aura magnitude
and Pilfer currency-find scale independently of cadence. Target counts, costs,
cooldowns, arrow composition/splash shares, fixed Chill limits and secondary
skills stay as authored. Paid finite potency survives source death. The natural
stat projection includes core/derived stats once and preserves current HP/MP;
gear deltas and percentages are then applied once. Persist only stars/shards,
never a multiplied actor baseline or transient signature authority.

## Durable integration

The existing SSR counter remains the sole owner of its value. Version33 adds
`meta.recruitmentState` for SR misses/ordinal/history and
`mercs.recruitmentProgress` for canonical shards/stars; it does not duplicate
SSR state inside either field. Add independent
SR misses and bounded history through a versioned save migration, without
inferring an unavailable legacy SR result history. Initialize unknown SR misses
to0 and empty new history. Never infer past duplicate shards or stars from
roster membership or spending. Freeze predecessor validation before extending
native save state, reject reserved fields in historical inputs and validate
raw own data before normalization. Preserve the canonical earned source file;
validate migrated disposable copies through ordinary import/Continue/export.

Merc-specific shards/stars belong with the merc domain, keyed by canonical
identities. Receipt and upgrade transactions require actual roster ownership;
progress remains earned through dismissal and re-recruitment. Wallet payment, pity/history, roster and shard progress
publish under one existing material transaction lease; refusal and rollback
preserve all participants. Upgrade updates projections without healing,
duplicating base growth or applying equipment bonuses twice. Block operations
during combat, active admissions, hydration and save replacement as now.

## Probability correction

With p=.02 and a hard50th-draw SSR, E[draws per SSR]=(1-.98^50)/.02
=31.7915159956, so the exact long-run SSR rate is3.1454932823%, not2.4%.
Finite enumeration of the joint10/50 counters gives SR16.2187389886% and
R80.6357677291%. Keep the base rates and guarantees; correct the contradictory
2.0–2.6% long-run test instruction. These are mathematical rates, not measured
funding/active-hour acceptance. The retained exact enumeration is
`bug594-pity-math-v1.json` in the ongoing evidence packet.

## Ordered implementation and acceptance

1. Pure dual-pity banner model: rank boundaries, uniform concrete identity,
   same-batch duplicate receipts, fresh/legacy counters, seeded replay and
   ten-versus-single equivalence. No live change claimed until integration.
2. Closed authored banner validation and rate/floor corrections, with pool/
   identity/rarity references validated. Do not copy tuning into engine code.
3. Versioned native state and conservative historical migration; independent
   counters, shard/star ownership and capped history survive import/reload.
4. Atomic public payment, duplicates and upgrade actions; projected stats and
   signature ranks work with existing equipment, leveling and combat.
5. Both locales, visible counters/shards/stars/history, full disclosure, skip
   and copy controls; real desktop/mobile earned transactions and roundtrips.
6. Acquisition/funding distributions, failures/variance and all14 builds remain
   required. Full G0–G7, holdouts, retry/manual-idle,30–50 active-hour pacing,
   two-hour soak, independent review and later ownerplaytest stay open.

Plan review: ready for step1. It is an engine foundation, not F07 acceptance.
Independent review is still required for final integration. Security check:
first-party deterministic local code/data, no external messages or publication.
No pending user decision; no agents/installs/commits/pushes.
