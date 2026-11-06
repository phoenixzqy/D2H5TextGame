# ORMU-11 — Activate the quest-only charm catalog

Status: implemented and independently reviewed; integrated feature acceptance remains open. Producer review revised scope to retain catalog integrity.
Depends on ownership/Save25/cache guards and bilingual item names.

Scope: bases.json, uniques.json, cardAssets.ts, catalog integrity test and new
ormus-charm.test.ts. Exact approved base/unique; no treasure-class entry. Reuse
existing amulet icon via charm slot metadata and authored-base unique fallback,
preserving art overrides. Exempt only this exact quest-only base/unique from
ordinary drop reachability, explicitly test their absence from every treasure
class, preserve all other reachability checks and historical74/affixable84 counts,
update current total85. Adjust three injected-catalog tests to replace the now
authored unique once, preserving numeric fault injection and existing assertions.

Causal RED:3 catalog/icon/constructor failures and1 no-TC control. Integration
checks include full catalog integrity, literal predecessor/current binding,
Save25 ownership/cache and existing icon behavior. Quest activation follows later.

Independent review APPROVE. GREEN245/11 passes. Authored content, construction,
icons, reachability and no-TC tests pass; no earned reward acceptance is implied.
