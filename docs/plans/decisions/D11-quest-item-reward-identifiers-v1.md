# D11 v1 — Quest item reward identifier grammar

Status: producer/QA plan and genuine public-loader frozen RED APPROVE; schema
correction and unchanged frozen GREEN complete; independent final producer/QA
APPROVE/ADEQUATE. Exact task-owned artifacts removed after both releases;
absence verified.

Only the reward-local `itemDrop` grammar changes. Preserve historical flat
`items/<slug>` with its existing initial alphanumeric and later dot/underscore/
hyphen rules. Add `items/base/[a-z0-9-]+` and `items/unique/[a-z0-9-]+`, anchored
at both ends exactly as their authoritative definition schemas. Canonical
suffixes may start with a hyphen; canonical dots/underscores/uppercase reject.
Historical flat `items/base`, `items/unique` and `items/sets` remain valid legacy
strings. Unknown nested namespaces, empty slugs and deeper paths reject.

Do not widen shared objective item IDs. Sets/runes/runewords have separate
identifier/reward contracts. Structure validation neither resolves templates
nor grants rewards; syntactically valid nonexistent IDs may pass. Preserve
all existing loader identity/ordering/nonmutation and safe whole-bag refusal.
No content, reward handler, save migration or economy change. Actual Andariel
reward mapping/roll count/context, earned victory and broader D11/C1 remain open.
