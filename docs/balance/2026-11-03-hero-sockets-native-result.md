# Owned hero sockets and native Act V continuation

2026-11-03. Full private v1 remains incomplete. Act V remains 13/19 main
actions and formal balance acceptance remains 0/210.

The campaign runner now prepares entirely empty hero mainhands for profiles
whose declared physical-offense role is active. It spends only owned affordable
runes/gems, rejects automatic runewords and chooses strictly improving native
physical expectation using complete hero equipment/quest composition, critical
overflow and the actual cadence floor. It reuses native transfer, preview,
execute and re-equip operations. See
[decision](../plans/decisions/P15-hero-weapon-sockets-v1.md).
No production combat formula, material effect, drop or skill data changed.

The final 27 affected socket cases pass, including seven new cases for exact
costs/stats/custody/no healing, gates, partly filled weapons, shortage/cadence
cap, busy/full backpack and recorder-failure recovery. Scoped strict types and
explicit lint pass. These retained checks were not repeated during native
validation. No earlier-act or unrelated test replay.

The actual next-1597 D07 save had 145 backpack items and 313 stash items.
Forty-six ascending-ID native transfers made room to unequip. One preparation
spent 1 Mal and 2 Eld runes in RazorStitch `it-1g6tj-ar0`; Attack changed
475 to 725. All 487 owned items remain exactly once, backpack/stash become
99/359, and current Life/Mana stay 130/87. Material ordinal advances
1556 to 1559; challenge ordinal remains 1597. A second preparation call is a
byte-exact no-op. Independent Python readback reconstructs all 46 transfers,
three paid inserts, native request hashes/receipts, final re-equipment and
whole-save unrelated domains. Without-weapon equipment/quest composition is
explicit shared native input; candidate ranking uses retained regression
coverage. Actual material choice was measured rather than assumed to be Eld.

One prospectively bounded admission at ordinal 1597 then uses the actual paid
successor and unchanged Dim Vision → Decrepify → Corpse Explosion combo.
Waves 1–5 win in 39.799/32.640/12.400/56.219/32.481 seconds. Wave 6 draws at
60 seconds with one Frozen Terror boss alive at 6,661/18,136 Life; four of five
original enemies die. First corpse is at 9.055 seconds. Both allies survive:
hero 1,242 Life/599 Mana and mercenary 817 Life/496 Mana. Four CE casts deal
1,057 direct damage. Combined allied basics deal 44,070 direct damage,
Basic Arrow 18,100 and Cold Arrow 7,043. These aggregate totals do not establish
boss-specific throughput. The enemy population differs from admission 1596;
this is not a paired timing or causal win-rate comparison.

Successful waves earn 60 items and 332,993 XP. The failed wave earns nothing.
Independent readback reconciles the complete export, every owned item payload,
reward/material/currency/XP ledgers, ordinals and logical time. No quest
settlement or area completion occurs. Persisted current resources remain
130/87; those are distinct from terminal combat-unit pools. Final backpack is
159 and stash 359, so subsequent preparation must respect native capacity.

Resume only `p15-hero-sockets-combat-native-v1.native-export.json`, SHA256
`353a3401da3203b90a02d6c80dda0a98e97efdda6bf21c42eeaacd9e0aaea81d`,
next ordinal 1598. Prior input/preparation/D07 saves are historical and must
not be resumed. Costs: 1 admission, 0 training, 233,539.889 logical combat ms,
2,086.798 driver wall ms and 461,364 journal bytes. Paid preparation separately
costs 51 native transfers/inserts and 1,750.941 driver wall ms; no combat or
clock advancement. Preparation/combat launchers finish in 4,870.299/5,269.145ms;
independent readers finish in 677.724/467.823ms. PIDs 1181512 and 1181909 are
absent. Historical comparison families and controllers remain closed.

Source freeze authenticates all 2,149 production inputs unchanged at tree
`438beb31b56acb305b0d5e584f3e2008b8ad2baa9830ef9da4d7cf343816c544`.
The 125-input campaign manifest differs from D07 at only socket preparation,
its regression tests and the native runner. An initial freeze assertion included
Git-status metadata and rejected newly added documentation; the corrected freeze
compares every production input and provenance field separately. No gameplay
or payment was repeated to correct metadata.

Required evidence lives under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-hero-sockets-v1-*` source/test/type/lint receipts,
`p15-hero-sockets-native-v1*` prospective plan/driver/process/full transitions/
export/reader and `p15-hero-sockets-combat-native-v1*` prospective plan/driver/
process/journal/result/export/reader. Both source freezes/bundles are memory-only;
no repository output, task cache or disposable process remains. Root retains
these required diagnostics and the human2 worktree through umbrella review,
and owns eventual cleanup/release.

BUG611 remains open for singleton/boss damage and route viability; BUG592 remains
open for mobile runtime stalls. Next is source-grounded diagnosis of this actual
boss/action timeline, then an explicit earned-progression decision before any
new admission. Do not retry old waves or renew exhausted families. Remaining
Act V/Baal, 14 build populations and holdouts/fairness, economy/recruitment/Hell,
adaptation/manual-idle/defeat-retry, logical 30–50 active-online-hour pacing and
integrated G0–G7/soak/independent review remain. Owner playtest follows
implementation. Browser works; CI excluded; no pending answer/external blocker.
Security check: pass for authorized local first-party preparation/evidence;
no dependencies, network, credentials, permissions or publication changed.
