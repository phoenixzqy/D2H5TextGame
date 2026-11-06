# Intended Holy Bolt: prioritize the fully invested signature

## Decision

BUG-647 identifies a campaign setup defect, not a production engine defect.
Only the intended Holy Bolt profile selects `holy-bolt-at-target-v1`. Once
learned Holy Bolt reaches the highest rank declared for it in that profile's
targets (currently 20), and Hammer is learned, promote Holy Bolt before the
other declared skills. Preserve their relative order. Below that investment
boundary, and without the opt-in policy, preserve the declared order.

This retains Hammer's early area bridge and does not change learned ranks,
point allocation, skill coefficients, gear, resources, companions or limits.
The condition uses actual native investment rather than hero level, because
held points, quest awards and sequential/batched growth affect acquisition.
Existing native level 12/32 signature and growth assertions remain intact.

## Retained-input comparison

The level 51 Plains training draw at ordinal736/wave4 leaves Izual at 7,146 HP.
The hero is healthy, with 1,049 life / 540 mana and minimum observed mana 515.
Hammer casts 20 times and Holy Bolt 19 times. At rank 20, their current base damage is
288–318 to all enemies versus 2,520–2,540 to one enemy, respectively.

Exactly one control and one candidate were frozen before execution. The
control reproduces every retained event and both final parties exactly.
Changing only hero order to Holy Bolt > Hammer > Sacrifice wins at
36,054.09523809524ms, with hero 1,049 life / 540 mana, 24 Holy Bolt casts and no living
enemies. No additional candidate, seed search or native admission ran.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-holy-bolt-signature-order-v1`. Frozen plan SHA256:
`752693bf9962ed0e65c244e03129187d967e6fda0f28337ef22c62370362202a`.
Both production and campaign inputs remain identical throughout the comparison.

## Verification and limits

Two sequential native-growth cases reproduce the wrong order before correction.
After correction, all 23 selected cases pass: target-rank transition, five early
growth boundaries, opt-out, actual arcane damage and 15 mana payment, full store
identity, existing Holy Bolt signature delivery and sequential/batched budgets,
neighboring Fire/Javelin policies and the fourteen-profile registry. Strict
TypeScript and explicit four-file lint pass. No broad suite or route replay ran.

The first test preparation assumed the same full-investment level for batched
and sequential growth. Its two fixture failures are retained; after correcting
that assumption, the genuine RED run fails only on the two wrong-order cases.
Initial external type/lint command setup failures are also retained separately;
the corrected scoped checks pass before combat. Policy receipts use prefix
`p15-holy-bolt-signature-policy-v1`.

The comparison establishes one conditional training-wave win. It does not
establish a River clear, dense-wave population viability or balance acceptance.
River's original 200-entry allowance remains exhausted, with every prior cost
and failure preserved. The genuine saved successor remains 52 / next 906, export
SHA256 `8d29b835e070deb68604e1b20d16d684f7f8740172b0915117899275b5e0fcec`.
Later earned progression, independent review and full private-v1 acceptance
remain open. No renewed continuation is authorized by this diagnostic.

Root retains the claimed human2 worktree and required packet through umbrella
review and owns their eventual cleanup/release. Final closure authenticates
the recorded inputs, checks, native export, changed campaign paths, terminal
processes and removal of the exact disposable configs/cache.

Earned follow-up, 2026-11-04: [Act IV clear and partial Act V](../evidence/p15-holy-bolt-act4-and-act5-checkpoint.md)
records separate prospective continuations: River906/Chaos907 clear, all Act IV
actions complete; Act V's first three areas clear before Ancient's Way911 wave4
draw. The exact successor is52/next912. Historical failures and exhausted
preparation remain spent. Dense-wave viability and formal balance remain open.
