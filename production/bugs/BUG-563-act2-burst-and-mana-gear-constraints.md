# BUG-563 — Represent Act II bursts without locking surplus mana

- Severity: Medium; ordinary manual equipment changes remain available.
- Status: Fixed locally; uncommitted. Full campaign survival remains open.
- Owner: campaign equipment policy, root sole writer.
- Build: `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`,
  production hash `e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a`,
  supplemental campaign authority 9.
- Environment: Node native campaign service in WSL; viewport/locale inapplicable.

## Reproduction

1. Read the authenticated earned level-24/ordinal-293 successor of
   `p15-javelin-act2-elemental-continuation-v2.json`, paired with readback 2.
2. Compare owned equipment with canonical projections, without combat or mutation,
   using `p15-javelin-act2-owned-burst-comparison-v1.policy.json` and v2.
3. Examine the retained physical attacks and candidate exclusion reasons.

Expected: the Act II preparation policy represents the region's 225-raw physical
hits and 337.5-raw critical hits, alongside its elemental spells, and permits
declared resource tradeoffs that retain sufficient casting capacity.

Actual: its 120-raw physical probe is already at the armor floor. All swaps must
preserve 302 maximum mana, excluding useful defensive alternatives although mana
stays available during the defeat. The maintained policy selects no upgrade;
broader damage probes alone select only five armor. A declared 150-mana reserve
permits better owned mitigation without reducing Attack or Attack Speed.

Evidence: the two pure owned-state comparison results and their policies in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Both prove zero admissions and unchanged stores/source. The retained failed
native journal authenticates the attack sizes and wave-two attrition. A separate
level-25 eligibility forecast finds no useful extra choice under current floors;
no level or XP was actually granted or farmed for that forecast.

Proposed fix: preserve the generic helper's default floors; allow a validated
optional mana reserve. Act II Javelin uses 150 (six 25-mana Lightning Strikes),
keeps Attack/Attack Speed floors, and scores physical normal/critical probes at
95%/5% weights plus fire/cold/lightning/arcane/poison spell probes. Other acts
retain their policies. This does not model periodic/control chains or prove a
campaign win rate. Freeze any new native continuation before execution.

Security check: pass; local owned-state policy only, no source-save edits,
credentials, installs, network, permissions, CI or publication changes.

## Verification

Eight new checks fail before the change and pass afterward. All 34 affected
survival/Javelin tests, scoped strict types and maintained-file lint pass. The
generic helper preserves its original default; only the declared Act II Javelin
caller opts into the validated 150-mana reserve. Native continuation
`p15-javelin-act2-burst-reserve-continuation-v1.json` makes seven owned transfers
and reaches Arcane wave four; all audits pass. It still loses after wave-three
attrition. This establishes the policy behavior, not campaign balance acceptance.

The next separate adaptation reuses existing bounded gem-insertion transactions
for the actually fielded companion. Its new transaction regression fails before
the wrapper exists and passes afterward; all 29 affected socket/dispatch checks,
scoped strict types and maintained-file lint pass. Native continuation
`p15-javelin-act2-owned-sockets-continuation-v1.json` pays one Normal and twelve
Flawed Diamonds, with 13 exact audited insertion deltas and no resource fill or
XP grant. Magic Resist becomes 42 and wave three ends at 431 Life. Wave four
still defeats the hero under physical curse pressure. Preserve that failure;
do not equate an elemental mitigation fix with full-area or holdout acceptance.
