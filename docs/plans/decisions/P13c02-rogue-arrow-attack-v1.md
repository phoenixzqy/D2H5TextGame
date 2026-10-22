# P13c02 — Rogue arrows consume equipped Attack

Status: GD-DESIGN-REVIEW APPROVE; implemented and source review APPROVE. Root is sole writer
in the claimed human worktree2. Full P13/C0–C4/G0–G7 remain open.

Basic Arrow uses authored16–26, single enemy, CD1s. Pierce Arrow uses26–42,
all enemies, CD3s. Both cost0MP and author `attackDamagePct:100`.
Shared damage input adds `attacker.stats.attack * attackDamagePct / 100`
to existing flat bonus, once, before increased damage/combo/crit/resistance/DEF.
Missing or zero metadata preserves existing calculations, RNG and final rounding.
No rank/level term, growth change, global weapon bonus or identity-specific branch.
The adapter validates and freezes exactly these two JSON rows; other skills keep
their registrations. Schema permits this authored field only on these rows.

This supersedes P13c01's named Basic/Pierce fixed-range policy only. Its gear
authority, saved baseline, no accumulation and fresh-run boundaries remain.
For these two skills this also supersedes the legacy gacha three-target/+60%
Pierce description: all enemies is deliberate; neither legacy rule is implemented.

Attack25 => Basic41–51/Pierce51–67; Attack32 =>48–58/58–74. Minimum roll against
20DEF yields21→28 and31→38. At25% physical resistance, Basic yields10→16.
Verify actual sword+7, unequip/repeated composition, every Pierce target,
unrelated effects, default reload, immutable inputs and deterministic recordings.
Freeze genuine existing-path behavioral RED before runtime changes.

Retained W3 bounded screen: identical paid input/gear and Pierce-first priority;
one exact-seed diagnostic plus preselected0–999 comparison, no rewards or seed
selection. This measures equipment response, not complete balance acceptance.

Earned route: restore the unique original L12 checkpoint. Before combat choose
at most one existing legally transferable backpack weapon maximizing projected
merc Attack, tie by instance ID; keep current if no improvement. Ordinary transfer
only; stop on refusal. Frost Nova2/Ice Blast8; Inner Sight/Pierce/Basic priority.
Attempt ordinals102–105 once, seed2223645302, stop first nonwin. Four-map success
alone qualifies the previously approved identical-input Catacombs comparison.
No farming, points, refills, retries or outcome-based equipment/seed search.

Security check: pass. Scope: metadata/schema/engine and local retained diagnostics.
No credentials/network/dependencies/permissions or external publication involved.
The bounded rules above do not reduce the full umbrella implementation objective.
