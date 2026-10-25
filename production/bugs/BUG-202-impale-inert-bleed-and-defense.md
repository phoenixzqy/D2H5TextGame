# BUG-202 — Give Impale its declared Bleed and reconcile defense bypass

- Status: fixed locally in229f0d2c, presentation1d1eca0f; independent/earned acceptance open. Historical reproduction below.
- Severity: High — a declared damaging status causes no periodic HP loss.
- Environment: Node24.21.0, real native Amazon projection/default registry via
  Vite Node. Reproduced on the separate final15% Freezing Arrow runtime, committed at
  9104ea3c; exact
  source hashes retained with the reproduction. No Impale source changes.
  Engine diagnostic; browser/viewport/locale not applicable. English/Chinese
  source descriptions both promise defense bypass.
- Seeds7/19/41/97, native ranks1/20, target Defense0/100.
- Systems/owners: root acting as engine/content/design/QA; independent acceptance open.

## Reproduction

1. Build a synthetic L30 Amazon with real Jab→Power Strike→Impale prerequisites,
   rank1 or20 and only Impale selected. Use HP2000/MP100, no regeneration,
   zero resistance/critical/dodge and one held living target.
2. Execute one actual cast at1700ms, with the hero held afterward. Run each
   seed/rank against Defense0 and100; verify input immutability and exact replay.
3. Record paid MP, actual hit, Bleed marker, all periodic events and final HP.

Expected: the declared Bleed has explicit potency and actually removes periodic
HP. Both locale descriptions say Impale ignores Defense; source behavior and
copy must be reconciled under an explicit contract, rather than silently
assuming a bypass from text.

Actual: all16casts pay10MP. Seed41 misses in each rank/Defense case. Twelve
positive hits apply Bleed, but every case has zero periodic events and final HP
is exactly2000 minus the direct hit. At Defense0, hits are77/86/82 for rank1
and210/219/215 for rank20. Defense100 reduces those to1/1/1 and110/119/115,
contradicting the existing description.

Root cause: the JSON declares Bleed without `statusEffect.dotPctOfDamage`;
registration forwards only `{id:'bleed'}`. No defense-bypass metadata/consumer
is authored for this skill; the ordinary Physical pipeline subtracts Defense.
No global potency or mitigation workaround should be inferred.

Evidence: [native reproduction](../../docs/plans/evidence/d04-impale-repro.md).
The initial diagnostic used the wrong periodic-event property (`damage` rather
than `amount`); original source/error retained. All observed periodic arrays
were empty, and the corrected diagnostic fails the same missing-HP assertion.
The independent Defense comparison records actual values above. No runtime,
tuning, functionality credit or genuine campaign action is claimed.

## Local repair and verification

[Final evidence](../../docs/plans/evidence/d04-impale.md) preserves the explicit
provisional10% Bleed potency and ordinary Defense-only bypass under the prior
contract. Actual native ranks1/2/20 lose real periodic HP; Defense0/100/500
produce identical Impale outcomes while ordinary sibling Defense, resistance,
dodge, shields, reflection, death/resource/cooldown and authority remain intact.
New62cases/3files, engine7517/271, full14394/640/two existing skips, types/lint/
build and four production browser cases pass. Eight exact five-domain Continue
pairs/20geometry/20screenshots/eight inspected; final actual committed source/
design blobs match the tested snapshot. No new saved field or earned campaign
action. Independent design/QA and earned balance remain open.
