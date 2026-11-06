# P15 — Andariel and Mephisto refuse poison statuses

2026-11-05. BUG750 fixed locally; full private v1 remains incomplete.

The chapter units now inherit explicit `statusImmunities: ["poison", "plague"]`
from their archetypes. The existing factory copies/freezes metadata; the shared
status boundary rejects applications before state mutation. Ordinary skills
already log only accepted applications. Venom now follows that same rule.
Death spread already uses the boundary and observes actual resulting state;
its production implementation needed no change.

## Verification

Native chapter loaders/plans/builders, seed13 and ordinal450, cover manual/idle
Catacombs and Durance. Diagnostic heroes are deliberately durable and are not
earned builds or balance evidence. Positive Poison Nova/Plague Javelin carriers
still deal direct poison damage; the bosses acquire neither Poison nor Plague,
emit no false application events and take no periodic damage. Positive Venom
physical carriers likewise produce no poison states/DoT/success events.

Poisoned add deaths spread two captured stacks to a susceptible ally while the
real native boss refuses them. Removing only immunity on diagnostic boss clones
restores native skill/Venom statuses and Venom DoT. Separate factory/status checks
cover both Poison and standalone Plague spread, unchanged RNG/inputs and independent
frozen arrays. Chapter stats remain Andariel1200HP/90Attack/40Defense/AS110 and
Mephisto33600HP/300Attack/360Defense/AS120. Native wave provenance and immutable
construction, plain/recorded parity and re-record determinism pass.

- `red-native.log`: eight native forbidden-status failures and one schema failure.
- `red-venom.log`: metadata restoration passes13cases; four Venom success-event
  failures remain, proving the separate feedback defect.
- `green-focused.log`:19new cases pass (two engine,17native/schema).
- `green-final-native.log`: final17native cases pass after correcting a test's
  nonexistent top-level DoT damage-type field to reject all boss DoT events.
- `related.log`:40existing Venom/Plague/Duriel-Freeze cases pass. The Freeze
  cases cover the same extended immunity schema; no campaign is replayed.
- `types-final.log`: strict scoped599implementation/data files, zero diagnostics.
- `lint.log` and `lint-final-native.log`: four changed TypeScript files pass,
  with the corrected native file checked again. All check handles are terminal.

Earlier typing failure remains in `types.log`. No compiler option, assertion,
test or lint rule is disabled. Bundled data is validated by the actual loader;
supported arrays and malformed casing/types/duplicates/unknown IDs are covered.
No broad suite, build, browser run, CI or spent campaign/sample/retry renewal.

## Review and limitations

Root self-review compares five production files to retained pre-change hashes.
Only the two intended archetypes gain immunity arrays. Schema/type changes add
the two explicit IDs; combat changes only Venom acceptance-aware publication.
No boss stats/rewards, shared spells, resistance/damage pipeline, save format,
status logic or spread rules change. No material source finding remains; this
is self-review only. Final independent/owner acceptance remains open.

This establishes **status protection**, not zero poison damage. The old Poison100%
entry still conflicts with the explicit75% player/monster resistance cap; it is
kept explicit in the decision/spec. Mephisto's older three-stack Poison Cloud
requirement, Duriel challenge, progression/acquisition/economy/pacing, difficulty/
endgame and integrated app acceptance remain open. Historical14/14Normal,
210checkpoint sources and formal balance0/210 remain unchanged.

## Custody

Exact retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-boss-poison-immunity-uuc3e_8x`.
Root retains baseline/final snapshots, hashes/production diff, plan/security
review, original REDs, final logs and closeout inventory through full-v1
acceptance, then removes this exact path. No task browser/server was started;
all checks are terminal, and no disposable task cache or process remains.
Shared caches are preserved. Browser works; CI remains excluded; no user answer
is pending. The previous goal turn was status-only and made no progress.
