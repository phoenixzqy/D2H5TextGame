# First-clear and starter quest wishstones

Ordinary area victories now grant five first-clear wishes, and Den of Evil,
Blood Raven and Andariel quest claims grant 15, 15 and 25 wishes. Future numeric
quest wishes reach the existing recruitment wallet. This implements the
[early recruitment contract](../plans/decisions/P15-early-recruitment-budget-v1.md);
the remaining quest economy and final P15 balance requirements stay open.

## Native reward behavior

The required JSON first-clear amount is a nonnegative safe integer. Native
settlement adds it to the final victorious wave's reward bag before preflight,
inventory publication and run totals. Normal, Nightmare and Hell each use
their existing persisted clear array. The admitted run's profile and area own
the award even when the map UI selection changes during playback.

Intermediate waves, repeats, defeats, optional quest encounters and endgame
runs receive no first-clear component. Direct map progress writes still mint
nothing. Currency and clear flags share the existing rollback. Loaded clear
flags suppress retroactive grants; no save fields or migration are added.

Numeric quest `wishstones` now credits `currencies.wishstone`, which recruitment
spends. Historical plural `currencies.wishstones` remains opaque and untouched.
The three explicit new bonuses retain every old reward field. Kill coins,
equipment/material RNG, prices and other authored economy data are unchanged.

## Recruitment budget and limits

| Qualifying source | Guaranteed wishes |
| --- | ---: |
| Den claim | 15 |
| Blood Raven claim | 15 |
| Andariel claim | 25 |
| Six ordinary Act I first clears | 30 |
| Total, if all these actions occur | 85 |

A first single pull is affordable by the qualifying Den claim. These sources
alone do not guarantee a 90-cost bulk pull before Act II. Ordinary Blood Raven
merc access remains available independently.

The retained completed pilot has 23 Normal clear flags and claimed Den and
Andariel, with no Blood Raven claim. Applying only this slice prospectively
would add 115 clear wishes and 40 quest wishes, totaling 155. This arithmetic
does not modify the old save, establish an early affordability timestamp or
replace its earned history. No combat or reward generation was replayed.

Later main/side/specialized quest budgets are still required. Their existing
exact bundles must be handled individually; this change does not convert
removed gold or substitute wishes for their services/items/merc rewards.

## Affected verification

Three intended behavior assertions fail before implementation. Final current
results cover 160 distinct passing assertions across eleven affected suites.
They exercise the native first-clear boundary, separate profile ledgers,
selection changes, repeats, loaded flags, defeat, safe sums and rollback;
quest payment/refusal/rollback; and starter claim persistence through save,
import and hydration. Countess and both endgame modifiers stay excluded.

Exact comparisons retain all prior main-quest fields and all prior material
economy settings. Chapter tests retain raw source checks while checking the
current seed's missed kill coin plus the separate five-wish clear award. Zero
earned wishes may leave the canonical wallet key absent. Starter inventory
assertions retain every unrelated field and add only their exact 15/25 credits.
No snapshots were regenerated. A missing empty material ledger in the first
implementation attempt was corrected before the final passes. Scoped strict
types and explicit lint pass; completed campaigns and unaffected suites were
not rerun.

Evidence remains in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`bug578-579-red-v1.json`, the affected green/exclusion/starter-claim receipts,
`p15-campaign-harness-source-audit-v23.json` and `bug578-579-artifacts-v1.json`.
Authority23 checks 2,097 source inputs, fourteen deliberate transitions and an
unchanged campaign helper manifest. BUG578/579 are implemented; accepted
balance cells remain zero. Root retains the worktree and required shared
evidence for full-v1/review consumers; disposable type configuration is removed.
