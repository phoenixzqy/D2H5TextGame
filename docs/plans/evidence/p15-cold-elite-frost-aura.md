# P15 — Cold Enchanted passive Frost Aura

Locally implemented and verified 2026-11-05; uncommitted. BUG785 connects the
existing monster-spec §9 affix to the existing passive scheduler. Only Cold
Enchanted authors 15 base cold damage, 5000ms interval and 2000ms Chill. Its
first pulse occurs at five seconds; living player-side hero, mercenaries and
summons receive ordinary mitigation/status handling. Frost Nova and the +50
cold-resistance bonus remain. No combat scheduler, affix planning/cardinality,
reward, archetype tuning, save-version or Lightning specialization change.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-cold-affix-aura-4m1h0abv`.
Root retains this exact packet through full private-v1 acceptance and removes
it after all consumers finish. It contains original preimages, plan, exact
increment, source hashes, RED/GREEN reports, type/lint/browser drivers, screenshots
and cleanup receipt. Prior resistance/pilot evidence remains historical evidence
for its recorded source; this increment does not replay those campaigns/pilots.

## Verification

- Two causal native REDs report absent passive metadata on champion/rare Fallen.
  Both turn GREEN after the five-file production correction. The initial report
  read was premature; the same running handle was polled to its actual exit 1.
- Eight explicit files pass 98 distinct cases: 19 factory aura, nine existing
  factory, six native affix aura, eight native resistance, three native Duriel
  aura, 21 elite aura schema, 17 existing elite schema and 15 resistance schema.
  These cover actual data, strict invalid/missing/extra fields, default/override
  precedence, immutable copy, rejection before RNG, custom metadata without ID
  inference, champion/rare and manual/idle carrier-only integration.
- The native party fixture and its no-aura control demonstrate 12 pulses per
  recipient through the inclusive 60-second deadline: hero takes five after
  50% cold resistance and two flat magical mitigation; merc/summon take 15.
  All three receive Chill. The control has no cold hits; enemy action times
  remain identical. Inputs stay unchanged. These are constructed mechanics
  fixtures, not earned progression, representative power or balance evidence.
- Initial causal runtime testing passes five of six cases; the party fixture
  incorrectly spreads native enemy combat metadata into player targets. Its
  corrected independent player units pass. This initial failure remains in
  `green-causal.json`; it is not misreported as a successful complete run.
- Initial scoped types flag four test event-union accesses and lint flags two
  associated unsafe returns. Splitting discriminant filtering from predicate
  filtering restores proper narrowing without suppression or oracle changes.
  Final six native cases pass again. Final strict types import 930 files with
  zero diagnostics; eight changed TS/test files lint clean. Initial logs/results
  remain under `initial-*`; 98 denotes distinct cases, not repeated passes.
- Chromium 147 passes en/zh-CN at 360×640 and 1280×800. Each runs the actual
  authored factory/scheduler plus no-aura control, strict schema acceptance/
  rejection and manual/idle planner controls; 34 enemy actions remain identical.
  The actual CombatLog renders all six first-pulse damage/Chill entries through
  the existing localized event mapper. No horizontal overflow, browser errors,
  warnings or failed requests. The zh-CN mobile screenshot was visually inspected.
  This verifies the actual log component in a fixture, not the full CombatScreen
  or a player-earned encounter. The existing generic damage wording is retained.

## Review and remaining scope

Root self-review: optional supplied aura metadata is strictly validated before
RNG, copied immutably and preferred over archetype metadata once. Missing
metadata preserves the archetype; ordinary Frozen Terror retains its active
skill, and Duriel retains its native passive. Two earlier exact resistance
expectations now explicitly include the intentionally added aura. No weakened
assertions, skipped tests or independent-review claim.

The Cold Enchanted aura gap is closed; full affix acceptance and full private
v1 remain unfinished. Historical 14/14 intended Normal completions, 210 retained
contexts and formal balance acceptance 0/210 are unchanged. Gameplay/content,
attained power/acquisition/crafting economy, retry/population balance, 30–50
active-hour pacing, higher difficulties/endgame and integrated bilingual/mobile/
a11y/save/PWA/performance/soak and independent acceptance remain. No completed
campaign, pilot or exhausted sample/retry allowance was restarted. Browser works;
CI stays excluded; owner playtest follows implementation. No pending question
or external blocker.

All command handles are terminal. Browser PID 391522 is absent, port 5173 is
unbound, and the exact packet-owned `vite-cache` is removed with absence verified.
`cleanup.json` records no cleanup failures. Only the required root-owned evidence
packet remains through umbrella acceptance; no disposable process/cache remains.
