# BUG-548 — Dragon Tail rank growth falls below campaign mitigation

2026-11-01. Severity: High. Status: fixed locally, uncommitted; full balance acceptance pending.
Owner: root (game design/content/engine QA). HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce, inherited dirty worktree.
Environment: Node24.21.0 production-store simulation; browser/viewport/locale not applicable to this engine reproduction.

1. Restore retained p15-martial-act5-route-native-v1.json: actual29/XP39716/next366, Tail14/Talon20, original Rogue25, no available points.
2. Admit Frigid Highlands at ordinal366. Seed and exact native wave teams/events are retained in p15-martial-frigid-owned-forecast-v1.json.
3. Compare already-paid skill orders, owned full Isenhart and full Arcanna, shield wards, and native funded perfect-Diamond crafting.
4. Even the discarded37/40 party projections fail wave3. At cap Tail184–214 is reduced by the champion Succubus190Defense; native normal fire hits are near the floor. MagicResist does not mitigate Fire.

Expected: investing in the martial Fire AOE produces useful damage through ordinary on-chapter mitigation, preserving target, resource, burn, charge and death rules.
Actual: +6/rank leaves even cap-rank hits negligible against these packs; additional levels/life alone do not repair the damage floor.
Evidence packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1. See p15-martial-frigid-{owned,orders,capacity}-forecast-v1.json and source pins bug548-before-pins-v1.json. Forecasts discard all rewards. Earned source remains unchanged.

Root cause: provisional data-owned rank growth, not target selection or a global mitigation defect. Author security check: pass; local JSON tuning/tests only, no credential/network/permission/save change. Proposed correction and limitations: docs/balance/2026-11-01-dragon-tail-growth.md.

Validation: original RED10fail/134pass; initial GREEN161pass/2fixturefail; corrected Tail-only fixture preserves both Phoenix exact HP expectations. All163 affected cases now pass across engine data/preview, native Burn/mitigation, bilingual UI and charge settlement; scoped strict types/lint pass. Engine schema validation is included in actual-data tests (package has no validate:data script). All original failures are retained. The bound data edit changes only one JSON parameter. Frigid29 clear is a joint tuning/order/ward result, not an isolated global balance claim. Current Crystalline continuation remains open.
