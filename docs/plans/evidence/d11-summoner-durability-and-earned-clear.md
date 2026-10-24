# D11 — Summoner calibration and genuine earned Arcane clear

2026-10-24; runtime `1067b8e075c9c81820c270bdd8a3cd36d9ed0724`, local only.
Root implementation/self-review/audit; independent design/source/QA acceptance
pending. The full private v1 objective remains unchanged.

## Correction and measured effect

[Decision](../decisions/D11-summoner-durability-v1.md) changes only Summoner
life780–980→450–550 and growth78–98→45–55. The real generated encounter is28,
so its native envelope becomes4995–6105HP from8658–10878. No damage, mitigation,
resistance, spells, guard, reward, deadline, save or RNG rule changes.

[Balance report](../../balance/2026-10-24-summoner-durability.md) separates caster
survival, legal defensive adaptation and boss durability. Same earned input,
owned gear and fixed priority policy, diagnostic ordinal257/seeds1–64:

| Group | Native full-area wins before→after | Hero deaths | Boss victory p50/p95 after |
| --- | --- | --- | --- |
|1–32|2→29/32|2→2|43.600/52.654s|
|33–64|3→26/32|3→3|41.903/53.395s|

Group33–64 was inspected before tuning; its historical `holdout` label does
not establish an unobserved certification sample. Attempted preceding-wave
arrays match in all64 pairs. Five pack deaths/four boss draws remain. Optimistic
full-resource isolated1000 improves81→918wins, zero deaths;82draws remain.
No projection is promoted into campaign state. No broad balance sign-off.

Two production-data regressions fail before the JSON correction and pass after:
native28/three ordinary flayer guards, schema,28/48 life envelopes, all non-life
unit fields and following RNG. Focused2/2, engine5485tests/165files, full11285/
426files with two existing skips, typecheck/lint/production build pass. Full
Vitest542.25s and engine66.83s exceed budgets. All7built JS files are bridge-free;
bundle/PWA precache budgets and the large-inventory performance concern remain.

## Genuine preparation, failures and recovery

Original: unchanged Radament256 final, raw SHA256
`a22721de7f38951892de573d7994ccab3d4ddfa44b62148a28a5afff426012ee`.
Only three body-slot replacements per owner, all already owned backpack gear:

| Owner | Head | Chest | Offhand |
| --- | --- | --- | --- |
|Hero|`it-8ru9h-2wp`|`it-3mth7-492`|`it-7td8j-3l4`|
|Rogue|`it-6ojlp-3rw`|`it-3hl7i-3n7`|`it-18ydd-493`|

No skill/stat point is spent; no farming, recruitment, crafting or healing.
Initial Frost Nova→Ice Blast→Glacial Spike policy retains rank2/20/1.
Hero590HP/290MP/DEF185 and Rogue424HP/211MP/Attack210/AS202 are canonical
projections; persisted current120HP/102MP remains unchanged before entry.

Two setup failures precede combat and are retained in the verified archive:

1. Default5s Inventory readiness expectation expires; source/build marker exists,
   screenshot shows Inventory. Recovered export raw bytes exactly match original.
   A later functional30s wait records Inventory3.160–3.898s, with performance
   acceptance still open (BUG147). The first commentary's missing-marker
   diagnosis was incorrect and corrected; no product fix is claimed.
2. All six transfers and priority change succeed, then a reference comparison
   fails. The reference used raw stores with stale serialization mirrors and a
   different transfer order. The same public actions in UI order plus canonical
   `snapshotStores` exactly match actual prepared player/inventory/merc domains.
   Resume imports that actual export, raw SHA256
   `81b641f4be428b572270b618c446222668c877f341aef3105ab1a36957e97f20`.

Both failures have zero challenge entries; neither consumes257. The third
setup performs no replacement transfer or allocation, verifies exact preparation
and Save-close-new-page Continue, then enters once. These are two tooling setup
failures, not three gameplay attempts or an entirely passing browser matrix.

## Actual ordinary attempt257

Production Chromium/en/360×640, no test bridge, supplied seed, Skip or speed
change. Historical Date is pinned with native timers; not first-clear pacing
evidence. Exactly one ordinary Arcane Enter consumes257→258; all six waves win:

| Wave | Hero XP | Merc XP | New gear |
| --- | ---: | ---: | ---: |
|1|4320|3240|11|
|2|4560|3420|9|
|3|5200|3900|34|
|4|2160|1620|40|
|5|2520|1890|19|
|6, original Summoner and three guards|1120|840|3|

One declared ordinary Skills priority refresh occurs before initially paused
wave6 plays: Ice Blast→Frost Nova→Glacial Spike. Original boss display has empty
log; resource/ordinal/reward state is unchanged. Three paired native seed checks
show this UI API sequence and prior next-wave preparation yield identical
complete six-wave recordings. This is no failed-outcome retry or second entry.

Native victory clears Arcane and credits Summoner only; journal remains false
and quest in progress. That exact state survives Save-close-new-page Continue.
Inspect alone leaves credit unchanged. Explicit journal Read completes the quest
without granting XP/points; this state also survives Continue. Separate Claim
grants7000heroXP/5250mercXP and one skill point, without gear/material/currency
changes, then survives another exact Save-close-new-page Continue.

Final: **L24/XP107882, two unspent skill points,6240unique owned gear**. All6124
ancestral immutable payloads survive; only declared ownership metadata changes
for the six transfers. Combat19880XP/116gear plus quest7000XP; total20160mercXP,
25795shards,44wishstones, six runes and five gems. Original skill allocations,
restored Ice-Blast-first order, material action/receipts, consumed Book/Staff
and opened Tomb remain. Persisted120HP/102MP; Nightmare0/endgame0.
Arcane is completed/claimed. **Next Normal ordinal258; never replay257.**

## Audit, retention and remaining work

Root audit validates35native save payload files across all three setup packets,
including22in the final packet, plus one separately labeled diagnostic reference.
Four exact Save-close-new-page Continue pairs pass. The first audit counted
the reference as native; corrected `audit-v2.json` separates it, preserving the
original script/log/report. Production console/page errors and gameplay retries
are zero.1083source/config/test files,760build files and each packet's four
inputs rehash without drift. One middleware-only WebSocket warning remains in
the separate native UI-equivalence diagnostic; no production-browser warning.

[Retained final](fixtures/earned-summoner-attempt257/retained-final.json.gz), raw
SHA256 `458c75cc6b609f1b15cdb6d77fd8435917cad10d1df9d1525a1925a9917f1fd7`,
and [manifest](fixtures/earned-summoner-attempt257/manifest.json) preserve lineage.
Verified raw archive:134records/5,370,181uncompressed bytes; compressed SHA256
`fdcadf79bb552e3e1b0134605df0d79d98c55b2826c1a265d5692cf16886ecb7`.
All artifact files are finalized before archiving; every archived payload hash
and size matches its source. The760-file disposable build is removed, preview4411
closed and all task processes terminal; remaining disposable paths/failures[].

Raw diagnostics remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-act2-progression-jbutorzz`
through independent review/full-v1 consumers; root removes them after those
consumers finish. Source/history and the versioned archive remain deliverables.
The existing worktree claim remains active for the continuing umbrella goal.

Next: diagnose the current earned Tomb/Duriel build, caster survival and legal
fire/respec options before consuming258. Do not infer a Duriel life defect from
the earlier unsuitable cold build alone. Earned Duriel/ActII completion, fresh
current-runtime C2, ActsIII–V, seven-class/213-skill acceptance, crafting/economy,
30–50active-hour pacing, independent acceptance and C3–C4/G0–G7 remain open.
