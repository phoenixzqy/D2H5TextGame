# BUG-612 — Recover intended campaign equipment capacity

Status: fixed locally (campaign policy); earned Act IV integration verified for one area. Severity: High. Found: 2026-11-02. Owner: root (campaign preparation/QA).
Build: feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus accumulated changes.
Environment: WSL/Linux native harness; browser, viewport and locale do not apply.

## Reproduction

1. Restore authenticated original pre1232 checkpoint from the retained ActIV journal (line3931).
2. Apply intended owned physical mercenary weapon socket preparation.
3. Native unequip refuses with backpack_full: zero insertions, one refusal, zero costs.

Expected: earned campaign housekeeping makes ordinary native equipment actions possible by spending/salvaging actual owned resources under a declared retention policy.
Actual: backpack4272/stash498; normal-only housekeeping cannot recover. Bag contains3926rares,230uniques,116sets. Salvaging bag rares alone still leaves346 protected items.
Root cause: normal-only campaign sink plus retained stash prevents capacity recovery under sustained earned loot. Production capacity refusals are correct.

Evidence packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1
- p15-intended-offensive-sockets-v1-preparation.json (failed native zero-combat proof).
- p15-intended-offensive-sockets-v1-preparation-process-exit.json (terminal failure, task cache absent).
- p15-act4-pre-route-exports-v1.json (exact authenticated original checkpoint).
No admission, battle, reward, rune spending or controller reset occurred. Fixed save identity, not combat RNG, determines this refusal.

Next: opt-in general owned-equipment shortlist for all14 intended profiles; native salvage of surplus normal/magic/rare items from both containers, retaining every special/socketed/equipped/reserved/personalized/non-gear item and canonical hero/fielded-merc stat/offense/monotone upgrade leaders, including future requirements and weapon classes. Preserve one best normal socket base per base ID. Transfer remaining protected bag items to actual stash space. Never salvage special gear or bypass capacity. Independently reconcile consumed payloads and native yields.

## Native v2 follow-up

The ordinary-only shortlist salvages4131items but retains639 (430special,179rare,30normal);523bag/116stash cannot fit597preparation slots. Native proofv2 stops with protected-capacity-blocked, zero combat/socket costs; exact failed report retained. Root cause: only ordinary items compete for extrema, so stronger protected special gear cannot displace inferior ordinary backups. Compare all owned eligible gear for the declared extrema while preserving every protected item and one normal base per base ID. Ordinary candidates remain only those not retained. Add a regression where stronger protected gear displaces every inferior ordinary alternative; then rerun the affected helper cases and a new frozen proof. No special salvage, capacity bypass or renewed campaign allowance.

Plan review: ready; comparison universe changes, native consumption/protection and group semantics remain unchanged. Security check: pass; local owned-save diagnostics and surgical test policy only.

Nativev4 still retains624items: protected gear competing removes15more backups, but negative/zero improvements still win extrema within a slot/type group when nothing useful exists. This is the remaining cause: shortlist ranks absolute stats without requiring an upgrade over the actual current loadout. Keep only strictly positive scalar/resistance/offense/net/monotone improvements, and positive per-slot MF/GF improvements; preserve all previously declared protected gear and normal bases. A new stronger-equipped-loadout regression must salvage every inferior ordinary backup. This corrects the general upgrade policy rather than trimming the recorded inventory to a target count. Nativev4 stays immutable; no special salvage or capacity bypass.

## Native v5 diagnosis — collection duplicates

Nativev5 retains606items (497bag/109stash):279unique,151set,151rare,25normal. Unique ownership represents61identities; set ownership50pieces. Keeping every special copy is unbounded and causes the remaining refusal. This is a campaign policy defect; native capacity/salvage works as designed. No battle, admission or socket insertion occurred.

Replace draft owned-shortlist-v1 with declared owned-shortlist-v2. Retain one collection representative per unique identity/set piece (two for rings and one-handed weapons), preferring socket capacity, ilvl, then lexical ID; retain all canonical hero/fielded-merc upgrade leaders as before. Always preserve equipped, socketed, personalized, reserved and unknown items; runewords stay protected. Only surplus unmodified duplicate specials may join native salvage. Audit the new sink policy separately; earlier normal/caster/owned-v1 restrictions stay strict. Preserve exact consumed custody, collection representatives and yields. Add behavioral duplicate/collection and protected-overflow cases, then check only affected regressions/types/lint and a new frozen zero-combat proof before earned ActIV.

Plan review: ready; versioned registration, native transaction integration, collection/ring copies, hard protection, independent ledger and actual-save validation are covered. Security check: pass; authorized local isolated generated campaign save only; no external save, credential, network, install, publication or CI operation. The all-special retention limit was a draft implementation choice, not a user requirement.

## Native v6 recovery and independent reconciliation

Historical native-v6 checkpoint: fixed in campaign preparation; earned comparison was then pending. See integration below.
`owned-shortlist-v2` passes95 affected capacity/profile cases and3 affected
shared native-salvage ledger cases; scoped strict types and lint pass. The final
earned driver also passes the scoped strict type check.

Nativev6 salvages4451 actual owned items for42756scrap, performs185 ordered
transfers and pays3Eld insertions. Backpack4272→97; stash498→222. Actual fielded
mercenary attack356→581. No admission, combat, XP or quest reward occurs.
Producer verification fails because its expected save omits the legitimate final
`inventory.latestMaterialAction` receipt. Preserve that failure unchanged.
Independent readbackv3 reconstructs exact custody, collection representatives,
protected ownership, native yields, ordered insertions and every final save
field; it exports the original captured bytes without repeating native actions.
The producer's later repeated-insertion no-op assertion was not reached.

Evidence: `p15-intended-offensive-sockets-v6-preparation.json`,
`p15-intended-offensive-sockets-v6-preparation-readback-v3.json` and
`p15-intended-offensive-sockets-v6-preparation.native-export.json` in the retained
packet. Readback status is `independently-read-back-without-combat-replay`;
`producerStatus: failed`, `nativeOperationsCompleted: true`.

One declared earned Act IV comparison starts at authenticated preparedpre1232,
carrying102 inherited training admissions/612 victories, original3 quest Starts,
original admission/training/combat ceilings and conservatively the entire
256060.07459ms original wall runtime. Original exhausted1235 remains immutable.
No earlier-act replay, renewed allowance, production tuning or population claim.

## Earned integration verified, 2026-11-03

The bounded offensive comparison has now completed: Plains1232 draws,1233 wins,
Izual is defeated and Fallen Angel Claim is earned. Native preparation's4451
salvages/42756scrap/185transfers and three paid Eld insertions remain reconciled
within inherited costs and ceilings. Independent earned readbackv2 derives the
exact final save, ordered custody/economy/points/quests/clock/party/bounds; direct
export comparison also matches333991raw bytes. No replay or budget renewal.

See [earned comparison](../../docs/balance/2026-11-02-intended-act4-offensive-comparison.md)
and `p15-intended-act4-offensive-v1-readback-v2.json` in the retained packet.
Capacity recovery is integrated; further ActIV/V progression is a separate open
requirement. River preparation ends at51/next1434 under BUG613. Preserve the
producer assertion failure and its unreached no-op check; earned readback does
not retroactively turn that producer run green. Local source remains uncommitted.
