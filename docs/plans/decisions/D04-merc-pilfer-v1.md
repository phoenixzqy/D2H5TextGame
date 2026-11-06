# Native mercenary Pilfer — bounded implementation contract

Parent: b5a0898806bfba369a2d84a1b6c41d0bbb057fce, with the exact independently verified native A/B changes retained uncommitted in the existing claimed worktree. Root is sole repository writer. Existing producer supplies read-only plan/test/result review; no new agents.

Status: native repair verified; broader acceptance pending. Independently reviewed contract defaults below are adopted for this bounded implementation, not evidence of balance or earned acceptance. See [native evidence](../evidence/merc-pilfer.md) for frozen causal RED/GREEN, 21708/1023 ordinary-unit pass, static checks, final locale-only delta, rebuild and cleanup.

## Requirement and explicit implementation defaults

Gacha spec section4.3 promises Pickpocket's mskill-pilfer +30% GoldFind on this fight. D10 preserves no gold; the existing goldFind percentage input increases rune-shards only, through rollRuneShards's unchanged (1+find/100) formula. Do not add a currency or include mercenary equipment GoldFind globally.

The following are explicit proposed v1 defaults resolving formerly undefined details, not claims of old source behavior or user-approved tuning:

1. Fight means one recorded combat wave. An ordinary successful paid native Pilfer cast by the actual Pickpocket factory/loadout activates +30 percentage points for that wave's victory bag. A landed hit is not required: this is a fight reward bonus, not a random gold steal. Existing miss/mitigation/damage settlement still runs normally.
2. Repeated casts and multiple eligible sources do not stack. Pilfer remains an ordinary physical single-enemy attack, cooldown2s, zeroMP, min1/max20, fixed authored damage14-24; no new Attack scaling or rank growth. Authored JSON owns bonus30 and runtime tuning, copied immutable through the validator/resolver.
3. A paid activation remains for the completed wave even if that mercenary later dies. A dead, blocked, unqualified, underlevel, absent or unpaid source grants none. Exact native skill identity and original Pickpocket template/loadout qualify; heroes, summons, arbitrary same-ID replacements and fake markers do not.
4. Reward bonus applies to all ordinary non-summon slain enemies in that winning wave, through the existing per-enemy shard formula before its integer floor. The same wave modifier applies to any legitimate additional Find Item kill rolls, because they share the wave reward context. Quest/cache/material grants are unchanged. Hero's existing find percentage adds normally; do not multiply final rounded rewards.
5. Every wave simulation starts inactive. No unit carry field or saved paid state is introduced. Next wave/new run must pay again; replay recompilation derives its bonus anew from its fresh private engine result. Public events/playback teams cannot authorize the bonus. Copy/capture the numeric engine result before callbacks and bind it to the existing private recorded-wave receipt, preserving one payout, rollback, replay and recovery rules.
6. No new RNG calls; preserve reward seeds and all unrelated item/material/wishstone rolls for the same reward context and seed, attack RNG ordering and original player's authoritative stats. Native Pilfer replaces its stale stub with the authored14-24 attack; this intended correction is not a claim of byte-identical Pilfer damage.
7. Bilingual Pilfer description truthfully states the guaranteed nonstacking wave reward bonus and existing rune-shard currency; no UI layout/save format change.

## Smallest planned change

- Add an exact closed mercPilfer currencyFindPct JSON field only on mskill-pilfer; zeroMP authored cost; immutable native resolver/registration.
- Qualify actual merc factory/loadout using a transient input marker, revalidated by engine; fresh config must strip stale qualification and use captured bare-merc fallback consistently.
- Combat state captures the paid native cast once; optional result bonus is omitted if inactive. Stage/copy/bind it outside public playback and pass only the private value into ordinary victory reward generation.
- Preserve full failed predecessors and exact test/source snapshots. Do not weaken existing tests; if historical stub expectations fail, obtain exact causal review before modifying them.

## Acceptance and validation

- Before runtime edits, freeze an independently reviewed actual pool -> factory -> runBattleRecorded primary plus native staged/settled reward test; causal RED must fail the intended missing bonus/reward assertions, never collection/setup.
- Positive: ranks1/20, ordinary paid action+cooldown/mana, miss still activates, fixed14-24 damage, +30 additive with hero find0/50, exact per-kill floor at unchanged seed, repeated cast no stack, multiple source no stack, post-cast death retains reward, next-wave/new-run/replay reset.
- Negative: no cast, no fielded merc, wrong original template, removed owned bar, hero/summon, dead/underlevel, blocked/cooldown, replacement same-ID skill; fake event/marker/result edits cannot affect captured native payout.
- Integration: actual private staged result through native recording/receipt/ordinary settlement to inventory rune-shard credit once, repeat settlement/replay deduplication, failure rollback preserving pre-call state; unrelated rewards and stats unchanged. Constructed native evidence only, never earned campaign acceptance.
- Schema: unique row, exact fields/types/IDs, finite nonnegative tunable coefficient, no mutation/freezing authored source, copied deep immutability, repeat default registration; reject unsupported metadata. npm has no validate:data script; validate via actual Ajv2020 loader/schema tests rather than inventing a command.
- Run focused tests first; then actual engine/ordinary unit suites, boundary, types/lint/build when final inputs stable. Preserve terminal receipts/logs, explicit unchanged input maps, exact owned PIDs and cleanup.

## Retained restrictions

H3 terminal failed-no-app; no app/browser/retry, protected earned-endgame fixture, diagnostics discovery/read/execution, closed P15/default-earned/modes/rune/fusion/runeword matrices, or new acquisition/lineage/gameplay replacement experiment. No new agents, remote/deployment/worktree operations, broad process termination, shared-cache cleanup, dependency changes or watch-mode. BUG180/366 timeout recurrence stops source continuation. Native simulation deadline remains60000ms; maxRounds is not a runtime limit. Required packet evidence retained through unfinished acceptance; root owns eventual exact-path cleanup. Broader private-v1 scope and acceptance stay open.
