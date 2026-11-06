# ORMU-20 — Claim the exact charm with conserved participating ownership

Status: bounded functionality accepted locally; current25 integration checks pass.
Depends on protected clear and Talk. Scope: ormusClaim.ts, common claimReward.ts
minimal guard/publication wiring and focused tests. Authored activation follows.

Both preview and execution require actual validated clear/Talk before allocation.
Reuse the exact unique constructor/private deterministic roll/whole-bag preflight
and retained overflow. Grant5000 hero XP and3750 XP to the captured merc when
present. Claim last. Recheck source, hero, recipient, reward ownership after each
publication, including the final setter. Restore deep participating values on
failure. Follow the reward identity through stash/equipment transfers, restore
displaced charm ownership and cache, preserve unrelated journals and independent
gear writes, and report failed restoration explicitly. A missing captured merc
must not lose its baseline authoritative gear when restored.

QA: corrected RED-v3 has10 causal failures before implementation. Earlier RED
variants contain invalid merc cumulative-XP/overflow/duplicate-ID fixture
expectations; exclude them as causal evidence. Initial GREEN86/3 covers15 Ormus,
68 generic claims and3 boundaries. Independent review found cache/gear mismatch
and removed-recipient gear loss. Real unrelated equip silent/throw RED2 plus
pre-equipped removeMerc RED1 precede their repairs. Existing charm displacement
control passes. Repaired GREEN90/3 (19 Ormus,68 generic,3 boundaries) and
zero-warning targeted lint pass; independent re-review APPROVE. Full strict
types and lint now pass; full ordinary units22,247/1,057 pass.
Root evidence packet: d2-ormus-urhb34ei/ormus-claim*.log.

Local checkpoint: 2026-10-29, full units22,247/1,057, typecheck/lint/build
pass; independent bounded browser ADEQUATE. No commit/push. Owner playtesting,
earned balance and full-v1 acceptance remain open.
