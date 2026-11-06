# ORMU-08 — Native25 ownership and literal24 recovery

Status: implemented and independently reviewed; integrated feature acceptance remains open. Root implementation; producer-reviewed dependency order.
Depends on literal24 freezes and ORMU-07A/B. Approved design and ADR-014.

Five-file scope: types/save.ts, save/validate.ts, new native-charm-state.ts,
migrate-v25.ts and charm-save-v25.test.ts. Register migration25 and preserve
three difficulty profiles. Literal19–24 keep frozen bases; literal24 keeps
frozen quest authority. Validate literal24 before recovery. Recover hero charm
then merc charm keys in sorted merc-ID order, including orphan maps, retaining
backpack overflow and exact item data except detached ownership flags. Existing
hero key becomes null; absent stays absent. Remove all merc charm keys, including
null. Rebuild only affected mirrors. Only nonnull hero recovery recomposes hero
cache using restored affix Maps and existing quest entitlements, preserving or
clamping resources; merc-only recovery leaves hero cache exact, all merc bare
stats/resources unchanged. Infer no quest/proof/item/reward or recovery ledger.

Native25 requires exact charm base in hero charm only, rejects noncharm reserved
slot and every merc charm key, and preserves stricter existing duplicate-owner
rules. Use the typed shared predicate only after raw structure/accessor and item
validation. Test native/JSON parity, conservation, sparse legacy rows, unknown
fields, repeated decode, malformed raw graphs and every replay profile. Test-only
current-version fixture updates follow without altering literal predecessors.

## Outcome

Implemented; independent technical review APPROVE. Corrected legal personalization fixtures: save25-green-v2.log22/1 passed; wider save25-compat.log1144/32 passed, exit0. Two invalid personalization failures in initial RED are excluded as causal evidence.
Evidence is retained in the root-owned Ormus packet; quest/catalog/UI/browser acceptance remains open.
