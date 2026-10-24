# BUG-162 — Supply a legal base for the shipped Obedience recipe

Severity: High. Status: open. Affected systems: content-designer / engine-dev /
QA, F06/P12 and G4. No fix, balance or campaign acceptance is claimed here.

Build: production source `59f2590`, runtime `22bc93c`. Deterministic Node/Vite
SSR use of the actual public `matchRuneword`/`recipeFromData` functions; browser,
locale and RNG seed do not affect this closed catalog mismatch.

1. Load all75 authored item bases and all35 authored runewords.
2. For each base whose authored socket ceiling supports a recipe's exact count,
   call the public matcher with its actual type/slot/weaponType and the recipe's
   exact ordered canonical runes, using only that recipe as the injected pool.
3. Collect compatible base witnesses for every shipped recipe.

Expected: every shipped recipe has at least one legal authored base which can
hold its required sockets, with an attainable source. Obedience retains its
five-socket polearm restriction and exact Hel→Ko→Thul→Eth→Fal sequence.

Actual: Obedience alone has zero witnesses. The generic polearm caps at3 and
Giant Thresher at4; neither admits five sockets. Reducing its sequence/count,
ignoring its weapon restriction or forging an over-capacity item is not a fix.
The other34 recipes have base witnesses; that does not prove their earned
acquisition, affordability or complete effect/UI acceptance.

Evidence: [complete public-matcher enumeration](../../docs/plans/evidence/fixtures/earned-tyrael-and-river-through379/catalog-audit.json),
its retained `catalog-audit.mjs`/log in the linked archive, and
`src/data/items/{bases,runewords}.json`. Preliminary direct JSON enumeration and
the subsequent engine enumeration independently expose this same empty set.

Root cause: recipe support was validated separately from the authored base
catalog's attainable capacities. Add a compatible source-backed base and a
cross-catalog regression for all35 recipes, preserving existing base/history
rules and recipe identity. Confirm legal acquisition→ordered insertion→effects→
equip→Save/Continue; don't substitute a constructed item for earned proof.
There is no ordinary player workaround for this recipe in the current catalog.

Separate correction: Insight is **not** missing a target. It is legal on the
level35 four-socket Giant Thresher. The genuine level31 hero cannot equip that
base yet; this progression restriction must remain distinct from BUG162.
