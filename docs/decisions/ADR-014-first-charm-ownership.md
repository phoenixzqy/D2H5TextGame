# ADR-014 — Own the first charm in one hero equipment slot

## Status

Accepted for bounded implementation, 2026-10-29. Independent design/technical
review approves the contract; producer approves scope and dependency order.
This establishes no measured balance or completed runtime acceptance.

## Context

[D10](../plans/decisions/D10-material-economy-v1.md) requires concrete charm
ownership with a reviewed capacity contract. The advertised Ormus quest has no
executable objective/reward and the catalog has no authored charm base. Existing
equipment, stat composition and exact-unique Claim already provide the required
mechanisms. [The bounded design](../design/ormus-charm.md) defines mechanics.

Literal24 currently rejects unknown active base IDs but accepts arbitrary
equipment keys and unknown unique IDs on known bases. A new slot/catalog must
not overwrite old ownership or make previously inert unique strings active.
Historical campaign/endgame validation also consults live quest data, which must
be frozen before new objective/proof identities are introduced.

## Decision

Add one canonical hero `charm` equipment slot and reuse ordinary item ownership,
equipment transactions, comparison and stat composition. Charm contributions
require exact charm base and canonical hero slot; no passive bag or actor-mirror
scan. Mercenary charm equipment remains unavailable. Use save25 for the expanded
active slot/catalog/proof domain, after freezing literal24 quest/campaign and
item-base admission through all nested validation paths. Migrate old occupied
hero/mercenary `charm` keys once into retained-overflow backpack ownership,
preserving all concrete item data except intentional detached ownership flags.
Rebuild affected mirrors, conditionally recompose the hero without healing,
and preserve mercenary bare stats. Add no recovery ledger: existing unknown
inventory namespaces remain inert. An existing hero charm key becomes null; an absent key stays absent. Remove
all mercenary charm keys, including null entries. The version transition prevents
re-recovery.

## Alternatives considered

- Passive carried charms: every bag/stash transfer or reward becomes a stat
  operation; requires another capacity rule and duplicate-effect boundary.
- Another charm bonus cache/currency: duplicates concrete item ownership and
  risks disagreement after import, equipment replacement or rollback.
- New quarantine for old reserved-key items: these items are already valid
  concrete owners; direct accessible backpack recovery avoids an opaque second
  ownership store and another colliding persisted namespace.

## Consequences

The first quest path can use existing transactional reward and equipment code.
The hero gains one explicit equipment choice; backpack copies stay inactive.
Historical raw validation, migrations and source-bound quest admission need
focused compatibility tests. A recovered old reserved-key item stops contributing
until deliberately equipped in a legal slot; current resources only clamp when
the resulting capacity is lower. The first fixed charm does not establish a
complete random charm catalog or measured campaign balance.

## Compliance

Verify literal24 accepted/rejected examples before live catalog changes, including
unknown unique IDs, occupied arbitrary `charm` keys and unrelated unknown fields.
Test raw/normalized/nested predecessor validation against frozen domains. Verify
single-slot native admission, exact-base stat activation, inactive copies and merc
exclusions. Migration tests prove concrete item conservation, retained overflow,
no reward/proof inference and stable second decode. Integration/browser evidence
proves clear/Talk/Claim, reversible native effects and exact persistence.
