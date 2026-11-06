# Intended Bow: prioritize the fully invested volley

## Decision

BUG-649 identifies a campaign setup defect. Only intended Bow selects the new
`bow-volley-at-target-v1` policy. Before Multiple Shot is learned, retain Magic
Arrow. Until its actual learned rank reaches the highest target declared for it
in the profile (currently 20), retain declared support priority. At that boundary,
promote Multiple Shot and preserve the relative order of the remaining skills.
No target means no promotion. The legacy volley policy remains unchanged.

This changes preparation of the campaign profile, not production combat rules.
It does not change learned ranks, point budgets, equipment, resources, companions
or attempt limits. Rank-based selection also handles held points and quest
awards without assuming a fixed hero level for acquisition.

## Retained-input comparison

The exact retained Plains training input at ordinal 735 / wave 4, runSeed
1383837708 and battle seed 1164890233, originally draws at 60 seconds with
Izual at 2,027 HP. The hero retains 1,109 life / 332 mana, minimum mana 323.
Decoy prepares once; Slow Missiles casts nine times, Multiple Shot 21 times.

The prospectively frozen comparison permits exactly one original control and
one order-only candidate. The control reproduces every event and both final
parties exactly. Multiple Shot > Decoy > Slow Missiles then wins at
57,794.28571428571 ms with hero 1,109 life / 322 mana, 23 Multiple Shot casts,
nine Slow Missiles casts, one preparation Decoy and no living enemies. All
production and campaign inputs remain identical throughout the comparison.
Slow Missiles intentionally includes melee opponents; no targeting rule changes.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
comparison prefix `p15-bow-volley-order-v1`, plan SHA256
`0821b3c7bf63927a9f909a77af4700e204141120266f3ab17ae79f794d11b57e`.

## Verification and limits

Subsequent [earned Act IV/V evidence](../evidence/p15-bow-post-priority-and-owned-weapon.md)
now clears River908/Chaos909 and claims Hellforge/Terror's End. Act V reaches
the Ancients at52/next914; a separate owned-weapon preparation omission is
locally corrected as BUG693. The original comparison and closed limits below
are historical evidence, not the current frontier. No population/pacing or
formal balance acceptance is implied by these later route clears.

Before correction, two native-growth cases reproduce support-first order at
levels 32 and 51. After correction, all 30 selected regressions pass: actual
rank-20 volley priority, rank-19/high-level guard, maximum declared target,
five early boundaries including the Magic Arrow bridge, missing policy/legacy
policy/missing-target opt-outs, Decoy preparation, physical damage and 15 mana
payment, full native store custody, existing Bow growth/signature/defense cases
and the fourteen-profile registry. Scoped strict types and explicit four-file
lint with zero warnings pass. No broad suite or completed-route replay runs.

Initial test-name filtering selected no tests; that receipt is not a pass.
Three overlength character fixture names were corrected before the genuine RED
run (two wrong-order failures, nine passes). The first default lint invocation
ignored campaign files; explicit `--no-ignore --max-warnings 0` replaces it.
Those receipts are preserved. Policy receipts use the unique prefix
`p15-bow-target-volley-policy-v1`; an older occupied prefix was left untouched.

Final closure authenticates all 2,151 production inputs unchanged and exactly
four campaign paths changed. All 22 recorded wrapper/child process observations
are absent; exact disposable configs and comparison cache are removed. Root
self-review is complete; independent umbrella acceptance remains open.

The comparison establishes one conditional training-wave win. River's original
200-entry allowance remains exhausted, with every prior cost and failure
preserved. The genuine saved successor remains level 51 / next 908, export
SHA256 `428a898a68b214fbb3dfea33acf825a284945fde2df78c8163ca603b98e425d7`.
No additional candidate, native admission, earned River clear or population,
fairness or pacing acceptance follows. Formal balance remains 0/210; full
private v1 is incomplete. Root retains the human2 worktree and required evidence
through umbrella review and owns eventual cleanup/release.
