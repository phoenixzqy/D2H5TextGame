# P15 — Cold Enchanted passive Frost Aura

2026-11-05. Small correction to existing monster combat; BUG785.

Monster-spec §9 promises Cold Enchanted “Frost Aura (15 cold/turn).” Reuse the
existing passive Frost Aura interpretation from the Duriel decision: first
pulse after 5000ms, then every 5000ms, 15 base cold damage and 2000ms Chill to
every living player-side unit. Ordinary mitigation, shields, status eligibility,
death handling and wave-local reset follow the existing scheduler. Pulses are
independent of actions and cannot miss or crit. No new combat formula.

Only Cold Enchanted authors optional strict `frostAura` metadata in the elite
config. Forward it through factory options, immutably copied onto the unit.
An explicit affix override takes precedence over archetype metadata; absence
preserves the archetype. Validate a supplied override before consuming RNG:
finite nonnegative damage, integer interval/duration >=1000, exactly those
three fields. No name, skill or affix-ID inference. Other affixes stay unchanged.
Frost Nova and the +50 percentage-point cold resistance remain.

Metadata is transient; no save version or migration. Existing random-affix
cardinality and boss exclusions are unchanged. This repairs this one mechanic;
it grants no broad affix, balance, acquisition or pacing acceptance.

Acceptance: causal native RED/GREEN; strict schema boundaries; factory
copy/default/override and rejection before RNG; champion/rare plus manual/idle
carrier-only integration; actual party damage/Chill with unaffixed/action
controls. Run only explicitly affected tests, scoped types/lint and four
bilingual mobile/desktop Chromium runtime fixtures. Preserve inherited output
expectations except for the intentionally added passive. No full suites, CI,
campaign/retry/sample reruns. Root self-review; retained packet through full-v1
acceptance, exact owned process/cache cleanup. Security pass; plan review ready.
