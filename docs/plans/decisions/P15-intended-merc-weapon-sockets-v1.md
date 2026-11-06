# P15 — Spend owned materials in intended mercenary weapon sockets

Status: planned; recorded-wave diagnostic passes, native integration pending.
Date: 2026-11-02. Owner: root.

BUG611 isolates an attainable preparation omission: the intended ActIV party has
hundreds of owned low runes while the strongest fielded weapon has three empty
sockets. Greedy canonical expected physical offense chooses three Elds, improving
Prayer attack356→581 without speed/resource changes. Three original failing waves
win under original rotations/carry/RNG in48.24/40.30/55.88seconds. This is diagnostic
evidence only; the exhausted original controller and all its costs remain intact.

Add a separate `mercWeaponSocketPolicy: owned-physical-offense-v1` to all14
intended profiles. After ActII unlock, prepare only the actually fielded merc's
completely empty equipped weapon at idle native admission boundaries, before the
existing ActII defense preparation. Keep the existing defensive and historical
policies. Enumerate owned catalog runes/gems, preview each native insert and
project canonical star-aware merc stats. Choose the largest strictly improving
attack×speed×expected-critical proxy, lexical material-ID ties; this proxy is not
final DPS. Recompute after each paid insert. Do not select automatic runeword
completion, clear contents, buy/craft/grant materials or spend on unfielded gear.
Preserve the24-insertion cap, native capacity refusals, busy/hydration gates,
finally re-equip and committed-cost receipts even if diagnostics throw.

Root owns socket preparation, profile/runner wiring and targeted regressions.
First prove new paid/conservation behavior fails without the change; then cover
canonical score selection, depleted materials, partial contents preservation,
fielded custody, active/full-bag refusal, failed recorder restore, idempotency,
act/opt-in gates and all14 profile registration. Run only the affected socket
cases, registration case, scoped strict types and explicit lint. Freeze original
files in p15-offensive-socket-policy-before-v1.json in the retained root packet.
Then perform native zero-combat preparation on an authenticated original pre-route
checkpoint and reconcile exact export/item/material/stat state. Declare a bounded
earned successor separately; do not renew terminal1235 or replay earlier farming.

Plan review: ready; native preview/projection/paid actions are authoritative;
existing independent plain-insertion accounting remains intact by excluding word
completion. No production combat/data change, per-seed decision or build reset.
Security check: pass; authorized local repository/native diagnostics only; no
installs/network/credentials/CI/publication or protected user-save writes.
