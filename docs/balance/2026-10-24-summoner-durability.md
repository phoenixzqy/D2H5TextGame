# Summoner durability: bounded earned-checkpoint calibration

BALANCE-CHECK: CONCERNS

Root self-evaluation, independent acceptance pending. Local candidate satisfies
its native screen targets; broad class/build/difficulty/pacing coverage remains
open. This is not full-v1 balance sign-off.

## Fixed input and intervention

Runtime baseline `d288eba`; genuine Radament256 final raw SHA256
`a22721de7f38951892de573d7994ccab3d4ddfa44b62148a28a5afff426012ee`.
L24 Sorceress/IceBlast20/FrostNova2/GlacialSpike1, fielded L23 Rogue, next257.
One real skill point remains unspent. All simulations restore isolated stores;
none becomes an earned campaign save.

Six owned backpack body-slot replacements (three per owner) retain current
attack/speed/critical stats. Hero projected590HP/290MP, DEF185/MR0, magicDodge17%,
raw cold93/lightning77 (effective cap75). Rogue424HP/211MP, Attack210/AS202,
DEF150/MR0, magicDodge12%, cold73/lightning48. Full exact IDs and eligibility
assertions are in the frozen loadout and public equip-action scripts.

Unadapted32-seed screens won0 Arcane/0 Tomb; offensive-only scan did not solve
caster deaths. Native traces identify Horror Mage cold/lightning spells as the
largest incoming damage source; no mitigation correctness defect is established.
Defensive gear alone wins5/32 Arcane; Blizzard1 alone0/32, defensive+Blizzard2/32,
combined Tomb0/32. Those failed interventions remain evidence, not promoted play.

Control-first trash, Ice-Blast-first boss:59/64 reach Summoner but old native
life8658–10878 at **L28** produces only5wins. Median boss damage6618 motivates
the [decision](../plans/decisions/D11-summoner-durability-v1.md): life450–550,
growth45–55, native Normal28 envelope4995–6105. Only that archetype's life
changes; its50% elemental resist, MR81, outgoing spells and three guards remain.

## Before/after native full-area results

Same genuine input, exact owned gear, ordinal257, fixed seeds1–64, actual native
entry/recording/playback/settlement/carry. Each nonwin asserts zero XP/items.
The JSON `holdout` group33–64 was inspected before candidate selection and is
therefore a separate replay group, not an unobserved certification sample.

| Group | Wins before→after | Deaths before→after | Boss reached | Victory boss p50/p95 after |
| --- | --- | --- | --- | --- |
|1–32|2/32→29/32|2→2|30→30|43.600/52.654s|
|33–64|3/32→26/32|3→3|29→29|41.903/53.395s|

All64 paired first-five-wave outcome/time/order/survival arrays are identical.
Five pack deaths remain at seeds4/11/37/53/59; four boss draws remain at
30/33/39/44. No failed row was hidden or repeated for a win. Both groups meet
the new bounded≥80% wins, p50≤50s/p95≤58s and no-additional-deaths targets.
No three-attempt probability is inferred from this one-attempt sample.

## Isolated1000-seed diagnostic

Same prepared L24 build with full resources, real native L28 boss/three guards,
fixed seeds1–1000 and ordinary recorded battle engine. This optimistic scenario
omits preceding-wave resource carry and rewards; it does not measure drop yield,
earned acquisition or full-area success.

| Metric | Before | After |
| --- | ---: | ---: |
|Victories|81/1000|918/1000|
|Hero deaths|0|0|
|Victory TTK p50|56.261s|45.547s|
|Victory TTK p95|59.797s|58.100s|
|Observed boss life|8675–10865|5003–6098|

82 after draws remain. Full resource assumptions do not make this sample a
stronger progression claim than the native full-area screen.

## Regression and integration checks

Two production-data regressions first fail against the old values, then pass.
They validate the monster schema, native planner28/three ordinary guards and
Normal28/Nightmare48 envelopes, every non-life unit field and following RNG.
Typecheck/lint, engine5485tests/165files, full11285tests/426files plus two existing
skips and production build pass. Full Vitest542.25s/engine66.83s exceed existing
budgets; bundle/PWA precache budgets also remain open. No checks were weakened.

## UI equivalence, limits and retained diagnostics

The Skills editor intentionally refreshes a current wave. Before browser play,
paired seeds1/2/31 compare preparing next-wave order while wave5 is frozen with
the actual UI API sequence before wave6 playback. Complete opening teams/events/
outcomes hash identically for all six waves in3/3 pairs. Browser policy therefore
uses exactly one pre-play sixth-wave configuration refresh. It does not rerun
a failed outcome or challenge. One diagnostic middleware WebSocket port warning
was retained; the process exits0 and recording assertions pass. This is not a
production-browser error or evidence that an unrelated listener was stopped.

Pending: ordinary browser attempt257, independent design/source/QA acceptance,
new-character/on-level/BiS and other class/build/difficulty grids, broad invariants,
drop/mana budgets,30–50active-hour first clear, earned Duriel/ActsIII–V and C2–C4/
G0–G7. Pure Normal28/Nightmare48 regression envelopes do not certify Nightmare
balance. Duriel and lethal unadapted caster packs are not retuned by this change.

Raw source scripts, original rows/traces, loadout, RED/GREEN and validation logs
are retained root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-act2-progression-jbutorzz`.
Root removes retained diagnostics after independent review/full-v1 consumers
finish; disposable build/browser download artifacts must be removed first.
