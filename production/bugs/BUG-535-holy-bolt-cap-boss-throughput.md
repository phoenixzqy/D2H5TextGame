# BUG-535 — Give capped Holy Bolt a viable campaign damage curve

Status: local correction verified; broader balance acceptance open. Severity: High.
Owner: root, content/game balance. Independent acceptance remains open.

Reproduction basis: dirty `feat/playable-foundations`, HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, Paladin data SHA256
`6c555e5a28ae63777a809ee9059c5ddbbc45742fa72060df07cfecdff4397d27`.
Production engine/store transport: Node 24.21.0 under WSL; no browser viewport
or locale dependency. Both locales obtain damage ranges from the authored data.

1. Restore retained earned `p15-holy-bolt-act2-arcane-continuation-v1.json`
   from packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
2. Inspect native Tomb456/Duriel seed2226306935. The level24 caster has
   Holy Bolt20, effective Hammer9, and earned equipment; the merc dies in W3.
3. Run `p15-holy-bolt-duriel-screen-v1.ts` through the packet focus launcher
   against that unchanged native terminal input, tuning seeds1–100 per priority.

Expected: investing the full20 ranks in the advertised caster's primary attack
must permit a viable earned campaign build. P15 must tune damage rather than
substitute a physical build or count a timeout as a clear.

Actual: the native boss loses2805/25600HP in60s. The same earned terminal input
draws100/100 seeds with Hammer first and100/100 with Holy Bolt first; median
remaining boss HP22325 and23237 respectively. The hero survives every trial.
This is a throughput failure, not a survival failure. It does not prove that
all possible gear/party combinations fail.

Cause: Holy Bolt's fixed50–70 base plus5/rank produces only145–165 at cap,
before the boss's93 flat magic resist. Weapon Attack does not scale this spell.
Hammer's separate resistance bypass works as specified. Additional armor and
farming cannot increase an already capped primary rank.

Evidence: retained native report SHA256
`ccd0c41d3239414286077c2c7c75fb56ca228a46105d1475c779585787b7c2e4`,
its raw journal, passing `p15-holy-bolt-act2-arcane-readback-v1.json`, and
`p15-holy-bolt-duriel-before-screen-v1.json` in the same packet.

Proposed fix and verification: see
`docs/plans/decisions/P15-holy-bolt-growth-v1.md`. Keep rank1, payment, cooldown,
healing ratio and resistance rules; tune the JSON growth coefficient. Compare
the same200 tuning inputs, run affected existing schema/combat/preview checks,
then qualify the whole unfinished Tomb from the retained earned save. No
holdout, all-build, earlier-act or complete-v1 acceptance is implied.

Local result: growth55 with Holy Bolt first wins100/100 of the same boss tuning
inputs, versus0/100 before; victorious p50=45260ms, p95=54020ms. Hammer first
wins1/100 after, so the primary skill order matters. Full native Tomb457 then
matches its six-wave qualification and defeats Duriel in40880ms. Seven Tombs
is claimed once and Act III unlocks. `p15-holy-bolt-act2-complete-readback-v1.json`
passes; the successor is24/126292/next458. No new sockets, reset or farming is
used for that continuation. The33 affected existing schema/combat/preview cases
pass. See `docs/plans/evidence/p15-holy-bolt-caster-earned-act2-complete.md`.

This remains a dirty local change, with no new commit. Early-rank healing/power,
later bosses, holdouts and final independent review still need acceptance.


Act III follow-up (2026-10-31): the55/rank candidate is insufficient beyond
Duriel. Earned Travincal465 clears; Durance466 W1 times out at full hero HP.
An exact25/22211/467 restored full-area forecast with Hammer-first groups
wins all five group waves but Mephisto seed1215936017 draws,15299/33600HP left.
Fixed Mephisto entry is diagnostic after projected group settlements, not an
earned native boss entry. Two priorities ×100 fixed seeds draw200/200; primary-
first median18170HP remains. Level30 Conviction3 with owned gear and speed
comparisons also fail full-area qualification; no projected income/spend counts.
Status: reopened for broader capped-primary curve; prior Duriel result remains
historical. See P15-holy-bolt-growth-v2.md for the next scoped candidate and
p15-holy-bolt-act3-mephisto-before-screen-v1.json for the unchanged-input RED.


Act III local correction:130/rank yields94/100 primary-first tuning wins,
6 draws/0 deaths, victorious p50=46.92s/p95=59.34s. Same-input comparison audit
passes. Native Durance467 wins6/6, Mephisto41.4s, Guardian Claim once/Act IV
unlock. Independent complete readback and33affected tests pass. Status: local
Act III correction verified; six screen timeouts, early/later-act balance and
independent acceptance remain open. No all-campaign fix claim is made.
