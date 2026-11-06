# BUG-494 — Nova reaches Baal but times out despite ample life and mana

- Severity: Medium; earned campaign final boss frontier.
- Status: open; recorded before adapting paid boss order.
- Environment: human2/WSL/Node24.21.0, native Throne1409 W8.
- Reproduction: resume earned55, clear and Claim Ancients, Start Eve and enter
  Throne. First seven waves win. Route Blizzard/Static/Nova reaches Baal.
- Expected: defeat Baal within ordinary60seconds with paid skills/earned gear.
- Actual: Baal9803/57600HP; hero1038/1094HP and571/585mana. Boss has243MagicResist,
  75elemental resistance, zero physical resistance and560Armor. Most normal
  Frost Nova hits and basic physical hits deal1, but a basic physical critical
  exceeds a Nova critical. Frost Nova consumes actions that could be stronger
  physical fallback hits against this specific boss.
- Evidence: p15-act5-baal-w8-failure-input-v1.json and retained native report/
  journal p15-nova-act5-ancients-critical-retry-v1 in d2-counted-source-z3jj3xa1.
- Next: exactly reproduce this boss wave and compare one paid Static/Blizzard
  order omitting Nova; no seed grid, stat reset, repeated training or earlier acts.

- Current outcome: Open: exact native control reproduced. Static/Blizzard draws with6382HP; Static-only draws6379HP. Owned physical gear raises Attack272→422 but still draws4443HP in a frozen input. The unproven selector is removed from maintained source and its exact source snapshot retained. Latest audited native successor is p15-nova-act5-ancients-critical-reaudit-v1.json,1410 admissions/63actions. Next work must justify a real Baal throughput correction before another campaign attempt.


## 2026-10-31 — Earned resolution

Resolved for this earned checkpoint with one native paid stat reset (5 wishstones,
270 refunded points; 4 Dexterity/1 Vitality per five). No free counter, skills,
equipment source or enemy value was granted or changed. Admission1410 clears all
eight Throne waves; Baal wins45.6s, hero971HP/38mana. Eve Claim/title/Nightmare
succeed. Final source now preserves this preparation after Rite Claim before
Eve Start. Exact initial draw and failed order/physical probes remain retained.
Authoritative re-audit: p15-nova-act5-baal-retry-reaudit-v3.json. This closes the
checkpoint frontier, not fresh campaign, holdout or fourteen-build acceptance.
