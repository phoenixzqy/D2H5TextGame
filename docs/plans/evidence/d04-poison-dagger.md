# D04 — Poison Dagger periodic damage

2026-10-26. Root-author local implementation and verification for
[BUG256](../../../production/bugs/BUG-256-apply-poison-dagger-periodic-damage.md)
under the [provisional contract](../decisions/D04-poison-dagger-v1.md).
Independent design/QA, earned builds and balance remain open. This is not full
private-v1 acceptance or an earned campaign action.

## Implementation

`2e29ede8` adds the omitted `statusEffect.dotPctOfDamage: 0.05` to the Dagger
JSON and requires a positive finite potency through its existing schema.
The existing adapter and shared Poison integrator supply the behavior. No
engine workaround, save version, weapon gate, corpse cost or new dependency.
The coefficient is an explicit author tuning choice, consistent with the
existing Poison Nova/Explosion coefficient; independent balance is open.

The five-path core increment includes schema/display, causal and native lifecycle
regressions. `be7195f6` separately adds bilingual targeting/payment/miss/mitigation
copy, reuses the generic periodic preview and tests actual final-rank allocation.

## Numerical and lifecycle evidence

The original four-case native reproduction at `82f06698` has two genuine failures
and two resource/authority controls passing. Actual paid rank1/20 casts deal
25/120 direct damage, apply Poison, then deal zero periodic damage. Original
log SHA256: `f9e026b00fa8662ae73f1b6e26637150f146f8f058b2e55edd2d74d1d4ac390b`.

Canonical core verification passes26tests/threefiles in9.284s. Literal fresh
rank1/20 results are25+5 and120+30 damage, ending470/350 of500HP. Other controls
cover5MP payment, insufficient MP, cooldown, dodge, class/unlock/rank authority,
single mitigation, first-rate retention, marker promotion, cap, finite interval,
immutable input and deterministic plain/recorded equality.

Native cases use real allocation0→1→2, preserve the current recording, carry
exact resources into fresh waves, and import an actively damaging Poison save.
All seven persistent domains compare exactly; transient potency is absent from
the save and cleared on import. Only persistence disk I/O is mocked. All pools,
equipment and isolated cadence are explicitly synthetic, with no earned balance
claim.

The engine suite passes9154tests/344files in143.058s. The canonical Dagger,
Poison Explosion and direct Necromancer compatibility selection passes400tests/
13files in24.506s, including12bilingual UI cases across ranks0/1/2/19/20 and
actual19→20 allocation. The final explicit death-kind witness in the existing
Poison Explosion test separately passes18/18 in8.523s.

## Preserved compatibility failure

[BUG257](../../../production/bugs/BUG-257-refresh-poison-explosion-dagger-oracle.md)
records the original399pass/onefailure compatibility result and event diagnosis.
Its fixture explicitly assumed Dagger had no potency. The real first kill now
spreads1HP/s Poison at6000ms;1HP settles at7500ms before Poison Explosion casts.
The exact survivor sequence is `[[7500, 1], [7700, 2], [9000, 13]]`.

`69a3bb9e` retains all old assertions and adds source/rate/expiry and pre-cast
ordering checks. No fixture, runtime, timeout or skip was changed. An initial
new witness selected the empty0ms status; its predicate was corrected to select
damaging Poison with the same6000ms/source/rate assertions. Both versions and
logs remain retained, along with the original failed trace harness that omitted
its explicit local-file allowance.

## Pending acceptance and evidence ownership

Production build/bridge/precache, canonical browser, full unit, final type/lint,
source/build audits, retention/read-back and exact task cleanup remain pending.
There is no Dagger inventory credit. The CSV remains165bounded-functional,
46unverified, one engine-only and one review-needed. Genuine campaign state
remainsL33, Ancients claimed, nextNormal402 and Baal uncleared; C2–C4, all-build
viability,30–50hour pacing/economy/endgame and full G0–G7 remain open.

Root owns required active evidence at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-poison-dagger-ujbpvvn4`
through BUG256/BUG257/full-v1 consumers, followed by lossless retention/read-back
and exact cleanup. Preserve original failures, drafts and command receipts.
No remote publication, deployment, genuine campaign action or replay occurred.

## Production and browser checkpoint before frozen full validation

The official production build/bridge check passes in12.961s, with six emitted
JS chunks scanned. All762files were hashed, moved from the verified task-owned
worktree `dist` into the external task's `production-dist`, and individually
verified again. The original worktree `dist` is absent. The official precache
check finds756URLs and all required application assets. Build warnings remain
for existing large chunks and the generated art manifest excluded by size; no
broader performance/PWA acceptance is inferred.

The first browser attempt fails its unsupported full-area victory assumption:
one failure/three not run,116.246s. [BUG258](../../../production/bugs/BUG-258-record-dagger-browser-fixture-draw.md)
preserves the screenshot, snapshot and trace. The page actually draws on the
elite wave, after real Dagger casts and positive enemy periodic damage. No win,
clear, boss kill or balance claim follows.

The corrected canonical public batch passes4/4 in282.366s: en/zh-CN × desktop/
Pixel5. It asserts actual casts, enemy Poison chips, positive enemy periodic
HP loss, explicit draw/no-victory, ordinary Return to town and an uncleared
Catacombs save. Eight exact seven-domain save pairs include four actual
activated-service-worker/network-disabled Continues;20geometry checks retain
44px controls. All page/console issue arrays are empty. Its16original PNGs
are retained; final individual visual inspection remains pending.

The initial type check found an unsupported Testing Library option; `ea7c43f3`
uses anchored name regexes with unchanged exact selection/allocation assertions.
The corrected12UI cases pass in9.422s, then types pass in129.072s. Initial lint
finds two new-test expressions; `842a6013` strengthens finite/positive native
potency checks and removes a redundant narrowed event conditional. Affected
11tests pass in7.846s. The repository lint ignores PWA tests; explicit lint
exposes one redundant DOM text fallback. Only that fallback is removed, and
the final browser spec also asserts transient potency is absent from the saved
post-draw state. All original versions and failures are retained.

Final source validation will rerun full units, types, full lint, explicit PWA
lint and the four browser cases against one frozen Git HEAD and exact committed
inputs. No source or documentation commits are permitted during that full run.
No Dagger inventory credit until final audits, retention and exact cleanup close.
