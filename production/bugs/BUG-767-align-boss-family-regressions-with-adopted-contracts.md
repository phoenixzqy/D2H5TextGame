# BUG-767 — Align boss family regressions with adopted Duriel and Izual contracts

- Status: Fixed locally; uncommitted.
- Severity: Medium — stale family regressions hide later failures and contradict accepted mechanics.
- Owner: root, solo, existing feat/playable-foundations worktree.
- Requirements: P15-duriel-passive-frost-aura-v1 and BUG507 ordinary Izual escorts.

## Reproduction and expected behavior

Run only Duriel rows in boss-signature-family.test.ts and the Izual roster case
in monster-curse-arcane-family.test.ts. The old Duriel expectations still require
active Frost Aura, and their physical-only assertions incorrectly include passive
cold damage. The old Izual test still requires two boss-tier escorts/Attack479.
Current accepted source instead has Charge plus ordinary actions and independent
15cold/5s passive pulses, and two ordinary L49Knights/Attack299. Reproduce current
failures before changing tests. Preserve literal curves, cadence, source/roster,
replay, immutability and RNG assertions. Assert passive damage separately; do not
retune production or weaken the intended native contracts.

## Custody and scope

/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-boss-family-current-contract-7jgb36g2 is retained by root through full-v1 acceptance,
then root owns cleanup. Exact preimages and scope precede mutation. Only two
existing test sources may change; production/data and all spent budgets stay exact.

## Resolution and verification

All four stale failures reproduced before edits. Duriel now expects only Charge
as an active skill and preserves its exact ordinary-action cadence. Mana Burn
suppresses active actions while twelve passive cold15/Chill pulses still occur at
5000ms intervals through60000ms. Ordinary physical damage is174 outside the2s
Chill windows and182 inside: the copied tank retains boss tier, which halves the
Chill combo bonus. Both literal amounts and each window are asserted. Izual's
ordinal0 roster now expects one boss and two ordinary L49Knights/Attack299.

Four actual selected cases pass;86 unrelated cases remain filtered. Scoped strict
types cover715source files with zero diagnostics; two-file lint exits0. Literal
curves, immutable input, recorded/plain replay and RNG controls remain. The four
retained production/data preimages are byte-identical. Original failures and
intermediate type/lint failures remain in the packet, alongside source hashes,
the exact test diff and final verification. All handles are terminal; no disposable
process/build/cache was created. This repairs regression expectations and earns
no campaign or balance credit. Full privatev1 remains unfinished.

## Follow-up — chapter numeric Mana Burn assertion

2026-11-05, same HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce and inherited
working changes. The selected Act II row of `boss-caster-numeric.test.ts` also
retains the physical-only/no-Chill assumption. Its failure at line131 is
retained as `act2-numeric-stale-failure.json` in root's
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-pressure-rya4f_2i`.
Reproduce only that row with `-t 'areas/act2-tomb-of-tal-rasha'`; engine seed13,
factory seed7, native Mana Burn and permanently stunned copied boss-tier tank.
Node/WSL; locale and viewport do not apply to this numeric test.

Expected with provisional BUG731 tuning: physical350 outside each2sChill
window and367 inside, plus12cold15pulses at5000ms intervals. Actual runtime
matches that contract; the old assertion includes cold pulses and rejects
the physical bonus. Constructed Chromium147 native recording confirms it
(`browser-result.json`), after fixing the diagnostic script's Ajv import.
This follow-up expands test scope only to the chapter numeric assertion;
retain every other chapter's expectation, recorded/plain replay and input
immutability. Production/data need no repair for this stale test. Root owns
the packet through full-v1 acceptance; no earned attempt budget is renewed.

Follow-up fixed locally, uncommitted: the one selected numeric case passes with
26unrelated cases filtered. Scoped strict935files/zero diagnostics and final
numeric-file lint pass. Exact pulse/Chill windows, ordinary actions and both
physical350/367amounts are asserted; all other chapter assertions are preserved.
Initial stale failure and intermediate type error remain in the packet. Its
browser drivers/server are closed, PIDs/port/cache absence verified. See the
[paired tuning evidence](../../docs/plans/evidence/p15-duriel-pressure.md) for
the separately implemented provisional production tuning and its limits.
