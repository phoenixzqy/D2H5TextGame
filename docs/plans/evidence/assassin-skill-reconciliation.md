# Reconcile sixteen implemented Assassin skill records

Status: bounded local functionality only; independent acceptance, earned builds,
balance and full private-v1 gates remain open. Root is sole author/executor.
[Row-by-row audit](fixtures/assassin-shadow-combined/inventory-reconciliation.json)
records actual consumers, exact before/after fields, hashes and current gates.

The CSV's seventeen remaining unverified Assassin records predate the completed
charge/trap/Flight/shadow implementations. Sixteen now have the complete local
runtime/native/lifecycle/preview/production evidence for their bounded contracts.
This corrects stale records; it does not represent sixteen newly added skills.

| Skill family           | Rows reconciled                                                                                 | Actual consumer and functional proof                                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Martial charges        | Tiger Strike, Fists of Fire, Claws of Thunder, Blades of Ice, Phoenix Strike                    | Fresh native martial ranks → private paid charge pools → once-per-finisher discharge. [Charge evidence](d05-assassin-martial-charges.md), corrected compact HP/mobile proof and [combined shadow cycle](d06-assassin-shadow-combined.md). |
| Finite fields/sentries | Shock Web, Charged Bolt Sentry, Wake of Fire, Blade Sentinel, Lightning Sentry, Wake of Inferno | Fresh native trap ranks → paid finite instances → three scheduled autonomous pulses. [Trap evidence](d06-assassin-traps.md), rank1/20 actual combat and native lifecycle/exclusions.                                                      |
| Corpse sentry          | Death Sentry                                                                                    | Shared FIFO corpse consumption/Fire branch, Lightning without corpse, competing consumers and exact timing. Same trap evidence; no original unpowered Burn credit.                                                                        |
| Reactive shield        | Blade Shield                                                                                    | Paid finite window, ordinary positive hostile Physical HP-loss trigger, independent attacker quotas and nonrecursive counterattempts. Same trap evidence.                                                                                 |
| Blink finisher         | Dragon Flight                                                                                   | Native paid magical-dodge window and unchanged Physical kick; charge release, Command, reflection/shield, death/expiry/lifecycle and bilingual previews. [Flight evidence](d06-assassin-flight.md).                                       |
| Skill-using shadows    | Shadow Warrior, Shadow Master                                                                   | Actual paid bodies, captured learned/independent ranks, own MP/CD, lifecycle and [initial skills](d06-assassin-shadow-skills.md), followed by decisive [real charge/trap/finisher proof](d06-assassin-shadow-combined.md).                |

Shared current consumers are `src/stores/combatHelpers.ts` and
`src/engine/combat/combat.ts`, with the corresponding strict source-backed
`assassin-charges.ts`, `assassin-traps.ts`, `assassin-flight.ts` and
`assassin-shadow-skills.ts` helpers. Evidence fields name these actual consumers;
registration alone does not justify a disposition.

Latest integrated d9447414 full19,927/939 PASS (two existing opt-in campaign
skips), typecheck/lint PASS and corrected production8/8 PASS cover the final
combined source. The charge24-case, trap32-case, Flight4-case and original
shadow8-case matrices retain their own heads and scope. Original contaminated
shadow proof is explicitly excluded. Public Warrior learned attacks are rank1;
native tests separately prove copied learned20/captured20. These are constructed
functional fixtures, not earned campaign or class viability evidence.

Exactly sixteen rows change four fields: adapter route, risk flags, bounded
verification disposition and evidence. All197other raw rows, CSV header,213IDs
and order are byte-preserved. Counts move195→211bounded,17→1unverified, with one
review-needed. Cobra Strike remains unverified because positive victim-MP
transfer conflicts with mana-free monsters (BUG304); Cold Mastery remains
review-needed. Neither row changes. Assassin is29/30bounded locally.

Retained archives and original failures remain available under the exact paths
and root ownership in the linked packets. Raw test directories were removed
after read-back verification and terminal consumers; no new disposable directory
is created by this reconciliation. Genuine L33/Ancients/Rite/next402/Baaluncleared
and protected save hashes remain unchanged. No campaign/replay, remote action,
independent self-approval or full-v1 completion is claimed.
