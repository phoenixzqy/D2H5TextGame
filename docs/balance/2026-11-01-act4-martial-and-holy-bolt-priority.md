# Act IV: Martial recovery and rejected Holy Bolt order

Status: Martial's frozen free order clears both retained cases. Holy Bolt's
Hammer-first control regresses both cases and is rejected. Full v1 and balance
acceptance remain open. No production code/data or authoritative save changed.

## Martial: use the learned area finisher first

Source: level28 /XP242169 /ordinal361, pinned by
`p15-zeal-act4-next-martial-act4-v1.json`. Preserve36 allocated ranks, no free
points, skill0/stat2 reset allowances, canonical gear/sockets/mercs/core and all
materials/currencies. The original Cobra/Talon/Tail order clears seed1, but
seed8 dies in the second wave at6.640s after684HP entry. Mana remains217 or more
in that failed wave. Ignite amplifies incoming Physical damage by25%; two
critical hits at6.640s each remove211HP. This is a burst-survival failure.

Freeze native Tail13/Talon20/Cobra1 priority before admission. This is one free
order change, with no reset, gear swap, material payment or farming.

| Policy | Seed | Result | Diablo | Final hero /Rogue HP |
| --- | ---: | --- | --- | --- |
| Original Cobra/Talon/Tail |1|Full-area victory|15.120s|684 /232 |
| Original Cobra/Talon/Tail |8|Second-wave death6.640s|Unreached|0 /dead |
| Tail/Talon/Cobra |1|Full-area victory|14.040s|684 /250 |
| Tail/Talon/Cobra |8|Full-area victory|15.120s|684 /0 |

The former failed wave now clears12.960s with681HP at seed8. Six-wave group
survival improves; seed1's second-wave final HP falls684→497 and later recovers.
Keep that tradeoff and the seed8 Rogue death at Diablo visible. Both new areas
award49170XP, which is discarded after the diagnostic. Minimum mana178/197.
These two boss times are below20–50seconds, so timing acceptance remains open.

## Holy Bolt: preserve the rejected control

Source: level30 /XP58594 /ordinal532, pinned by
`p15-martial-act4-next-holy-bolt-act4-v1.json`. Existing Conviction4, Bolt20,
Hammer11 and the other ranks total39; no free points, skill2/stat3 reset
allowances. Bolt-first at1380ms turns preempts learned Hammer: original seed1
dies in the sixth wave at6.480s after596HP entry/722Physical damage; seed8 clears
Diablo34.500s. Both retain mana389 or more.

Freeze Hammer-first packs and stage the original Bolt-first order for Diablo.
Gear, core, aura, ranks, mercs and all resources remain unchanged. This regresses
both retained cases: seed1 dies in the opener at10.200s; seed8 dies in the sixth
wave at29.160s. Both bosses are unreached, minimum mana379. The failed opener
includes560Arcane/318Physical damage and108periodic damage despite388observed
healing. Seed8's last wave receives1351Physical damage despite944healing.
Healing totals combine native sources. This does not isolate a causal subeffect.

Reject this policy and reuse the original seed8 victory. Next compare owned
complete native gear with the original Bolt-first/Conviction4 policy, guarding
earlier Arcane/Poison/Fire mitigation as well as late Physical burst. Source
has34 unused items,596HP/477Defense/24flatMR and Physical9/Arcane5 resistance.
No mana-shortage, automatic reset or farming prescription follows. Exact next
diagnosis: `p15-holy-bolt-act4-order-next-owned-v1.json`.

## Verification and workflow improvement

Four new native areas/21waves take12.705wall seconds. Separate author readers
pass exact free priority, unchanged canonical inventory/mercs/core/points/reset
allowances/materials/currencies, native stats/enemy streams/events/outcomes,
mana and cross-wave HP/MP/cooldowns, and aggregate item/XP/material/currency/
merc-XP/clear reconciliation. Twelve altered-point/gear/priority controls are
rejected. Readers consume recordings; no combat is replayed.

Scoped strict types and focused lint pass. The new reusable
`p15-act4-native-priority-v1.ts` takes class/level/ordinal from the pinned fixture,
so later free-order controls can reuse its checks when only spec data changes.
Native raw observations persist before their explicit4MiB size guard. This
avoids losing completed combat to a source-file-size assumption; Martial's raw
observations are1.11/1.14MB against a348KB source file.

Ten owned process receipts are terminal:8pass,2corrected setup failures retained.
The first generation guard wrongly rejected the existing `selectedAuraId` field,
so its dependent type invocation found no config; no battle ran. A separate
Holy Bolt generation guard caught a mistaken40-point total before the39-point
spec was written. Holy reader1's literal replacement changed ordinal361→391;
reader2 corrects it to the exact source532 without replay. All failures remain
in session history and relevant receipt/source files. Reuse210BUG552/112BUG553
checks and2091 authenticated unchanged production inputs. No broad/earlier-act
or qualified Zeal/DoubleThrow replay, agents, installs, commits or publication.

Three exact temporary configs are archived/removed; two Vite caches are absent.
Root retains the live human2 claim and required packet for umbrella acceptance
and eventual task-owned cleanup:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Closure: `p15-act4-native-priority-artifacts-v1.json`. Martial and Holy Bolt
adaptation overlays supplement the immutable110boss trials. Ready inputs58/
accepted balance0 remain. Full skill/build/role/area, intended-power/acquisition/
history, economy/fairness/pacing/holdout and final integration/owner requirements
stay open. Browser works; CI excluded; no pending answer or external blocker.
