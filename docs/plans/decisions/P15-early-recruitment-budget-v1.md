# P15 — Early recruitment and first-clear wishstones

Status: implemented and verified with affected checks, 2026-11-02.
Full campaign economy and L70 Hell acceptance remain open.

The 2% kill coin leaves the retained Normal trace's first 90 wishes at 291.259
combat minutes in Act III. Drop-tables §9 also promises five wishes per first
area clear and 10–25 per quest. Neither currently supplies this trace. The
generic numeric quest grant writes `wishstones`, while recruitment spends
`wishstone`; an authored positive wish reward would be unusable.

## First clear

Add required `currencyRewards.wishstones.firstClearAmount = 5` to the validated
material economy. On the final accepted victorious wave of an ordinary area
run, add this non-kill amount to the existing native reward bag if that area is
absent from the selected profile's existing clear ledger. Normal, Nightmare
and Hell use their separate persisted arrays, one reward per area/profile.
No difficulty multiplier, probability coin or new save field applies.

Use the frozen run profile, not current map selection. Intermediate waves,
draw/defeat, optional quest encounters and endgame runs do not grant it.
Direct `markCleared` calls remain progress-only. The ordinary settlement
transaction must restore currency and clear flags together on failure.
Historical cleared areas receive no retroactive grant and retain their flags.

## Starter quests and canonical wallet

Future positive numeric `wishstones` quest rewards credit `currencies.wishstone`,
the existing recruitment wallet. Preserve historical `currencies.wishstones`
and all other old keys as opaque balances; do not convert or spend them.
This explicitly supersedes the older D11 numeric compatibility mapping for
future wish awards, while retaining its preflight/reentry/rollback rules.

| Quest | New guaranteed wishes | Other rewards |
| --- | ---: | --- |
| Den of Evil | 15 | Existing XP and skill point |
| Sisters' Burial Grounds | 15 | Existing XP and merc unlock |
| Sisters to the Slaughter | 25 | Existing XP and unique |

These are explicit new P15 rewards, not conversions of removed gold or
substitutes for Cain, Charsi, Countess or other specialized reward contracts.
Claims retain the existing completion checks, claimed flag and rollback.
They bypass the kill coin, as other quest rewards do.

The starter quests total 55 wishes. Six ordinary Act I areas would add 30,
giving a guaranteed 85 independent of kill RNG; a first pull is available by
the first qualifying Den claim. A guaranteed bulk pull is not claimed before
Act II without another legitimate source. Ordinary Blood Raven merc access
remains an independent campaign path.

## Verification and full remaining scope

Verify actual native final-wave-only/one-time/loaded-clear/rollback behavior;
profile ownership; canonical quest credits, safe sums, repeats and real
recruitment payment; required JSON data and exact unchanged other rewards.
Use retained records to calculate prospective non-kill budgets, without a new
campaign or granting compensation to the old save.

Later quest budgets across Acts II–V and specialized/side bundles still require
explicit authored amounts and their existing transaction contracts. This does
not remove that full P15 obligation or accept the L70 Hell rate, all-build
acquisition/fairness, active pacing, retry, integrated gates or owner playtest.

## Implementation receipt

[Report](../../balance/2026-11-02-early-recruitment-wishes.md). The native grant,
canonical future quest credits and three authored bonuses are implemented.
160 distinct affected assertions across eleven suites pass, including actual
starter claims at save/import/hydration boundaries, profile ownership and
rollback. Scoped strict types and explicit lint pass. Authority23 records the
exact source transition; no completed campaign was replayed.

The retained campaign has 23 Normal clears and claimed Den/Andariel, without
Blood Raven. Its prospective non-kill addition is 115 + 40 = 155 wishes; none
are credited retroactively. The 85-wish starter total above requires all three
starter quests and six clears, and is not this pilot's observed opening.
