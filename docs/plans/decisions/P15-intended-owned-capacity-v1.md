# P15 — Recover intended owned equipment capacity

Status: planned. Date: 2026-11-02. Owner: root.

BUG612 reproduces a native backpack_full refusal at original pre1232 (4272bag/498stash). Existing normal-only salvage cannot recover. Add opt-in capacityPolicy: owned-shortlist-v1 to all14 intended profiles; historical policies remain unchanged. Housekeeping precedes owned socket preparation. It changes campaign choices only, not production capacities or combat.

At idle hydrated boundaries, retain all special, inserted, equipped, quest/IronGolem-reserved, personalized and non-gear items. Among ordinary gear, retain canonical projected hero and actual fielded mercenary scalar/resistance/offense/net/monotone-upgrade leaders per equipment slot, weapon class and eligible/future requirement group, using lexical IDs on score ties. Future candidates are retained without waiving native equip requirements. Retain a highest-capacity/highest-ilvl normal socket base per base ID. This is a declared finite equipment shortlist, not a claim that every possible stat tradeoff is preserved.

Salvage surplus ordinary items from bag and stash through one native action, retaining exact consumed payloads, protected IDs, ordinal and yield before fallible logging. Never delete or consume special gear. Move remaining bag overflow into real stash space using native transfers; if protected ownership exceeds total room, report protected-capacity-blocked without bypass. No grants/crafts/build reset or extra campaign attempts.

Affected checks only: constructed capacity/native transaction/economy tamper regressions,14-profile registration, scoped types/lint. Then a new frozen zero-combat native preparation from authenticated original pre1232, preserving the failedv1 proof and exhausted original1235. No campaign replay in this slice.

Plan review: ready; both containers and actual capacity are covered, salvage remains restricted to ordinary gear, native protection is authoritative, partial committed sinks retain costs. Security check: pass; authorized local isolated game-save diagnostics only; no external user save writes, network, install, credentials, publication or CI changes.

Native refinement: all owned gear, including protected gear, competes for extrema. Retain ordinary candidates only for strictly positive tracked-stat/offense/net/monotone gains over current canonical hero/fielded-merc loadouts (MF/GF against current slot). A group with no improvement retains no ordinary fallback. Normal base preservation remains separate. Protected items always survive; no special salvage is authorized by this decision. Plan review ready; fixes non-upgrade retention at its source, without count-specific trimming.

Superseded before acceptance by P15-intended-owned-capacity-v2.md: v1 native proofs v2/v4/v5 all stop for capacity. No v1 prepared campaign was admitted. Failed proof artifacts remain retained.
