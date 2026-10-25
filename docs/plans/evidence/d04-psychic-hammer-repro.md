# D04 — Psychic Hammer native Knockback reproduction

2026-10-25; [BUG212](../../../production/bugs/BUG-212-psychic-hammer-inert-knockback.md).
Root author investigation only; independent/earned acceptance remains open.

The actual native L30 Assassin learns Hammer at ranks1/2/20 and selects only its
authored ID. For seeds7/19/41/97, isolate one hero action at1700ms and one enemy
action at2000ms using explicit synthetic holds after each first action. Keep
the ordinary registered Arcane30–45/+3rank,6MP/CD1/single-enemy attack. Compare
with an otherwise identical registered attack whose `applyStatus` alone is
removed. Inputs stay immutable and exact same-seed replay agrees.

Twelve cases pay6MP exactly once. Nine landed cases emit Knockback; three misses
emit none. All twelve actual/control enemy action arrays equal `[2000]`; neither
snapshot has a grid position. No control consequence is observed. The final
probe assertion intentionally exits1 after writing the complete observations.
This establishes the missing timing effect on this path; absent positions do
not establish behavior for every hypothetical spatial layout.

The data and bilingual description declare Knockback. Source inspection finds
no runtime consumer under `src/engine/combat`. The project prohibits movement
and range stats. Prior Twister/Sanctuary contracts do not authorize copying an
arbitrary duration into Hammer. A new explicit author adaptation contract must
precede its repair; no specific replacement is accepted in this reproduction.

The [Cloak evidence packet](fixtures/cloak-of-shadows/raw.tar.gz) retains
`psychic-hammer-repro.ts`, `psychic-hammer-observations.json`, `next-hammer.log`,
and its live/terminal command receipts. Runtime5.97s, intentional exit1.
Hammer's data and adapter are unchanged from `178e69c0`; Cloak changes were
present during the probe and will be identified by the packet's source audit.

No skill credit, earned campaign action, balance verdict or remote action.
Genuine Ancients/Rite remainsL33/nextNormal402/Baal uncleared. Full C2–C4,
G0–G7, all213skills, earned builds, pacing/economy/endgame/privatev1 remain open.

## Subsequent delivery

The original defect above remains preserved. An explicit
[author adaptation](../decisions/D04-psychic-hammer-v1.md) and
[locally verified repair](d04-psychic-hammer.md) follow at `884b0839`.
Real landed-hit Stun interrupts enemy actions, with finite ordinary/boss expiry.
Independent design/QA and earned balance remain open.
