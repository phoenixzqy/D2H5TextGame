# P01 — Earned Act I entry screens and provisional Andariel tuning

Act I remains incomplete. The Sorceress can earn L12 and L13 through full Den
victories, but all three bounded route screens stop at a Cold Plains wave-three
draw. No Catacombs attempt, Andariel victory, new native browser acquisition,
or C0–C4/G0–G7 acceptance is claimed.

The [controlling decision](../decisions/D02-D07-act1-earned-entry-v1.md) keeps
XP, global scaling, later acts, equipment and formulas unchanged. The sole
runtime change is Catacombs' provisional Andariel package: base HP150 becomes
1200 after the existing ×8, ATK90, DEF40 and explicit MR15. Resolved L19,
resistances, skills, drops, XP and all guard waves remain intact. This is
deliberate tuning from HP17600/ATK150/DEF200/MR54, not a scaling-bug repair.
Its gameplay suitability remains unproven because the route has not qualified.

## Earned acquisition and failed route screens

All runs restore saved state into process-local production stores and use the
production planner, combat, playback and award settlement. They are service
continuations of a genuine browser-earned save, not new browser playthroughs.
The initial claimed L6 input SHA256 is
`b022aa436d30b9102528995f6f5c2419000f682df84d18d6c18321547e2faa35`;
see the separate [native Den evidence](p04a10-den-clear-and-restored-persistence.md).

Each pilot was executed once, exited 0, and stopped at its first nonwin.
Exit 0 means the observation completed, not that gameplay passed. Seed2223645302,
bonus1 and frozen clock1792497600000 are explicit. No direct XP, gear changes,
respec, resource refill, assumed quest award, seed search or idle ticker is used.
Initial full-save equality and unchanged source hashes pass in each pilot.

| Pilot | Acquisition | Route result |
|---|---|---|
| Original L12 | 61 full Den wins, ordinals41–101; +133990XP, +3344 items; 6857652 combat ms | Blood Moor wins. Cold Plains W1–2 win; W3 draws at60000ms with three enemies totalling996HP. |
| L12, learned Ice Blast selected | Restore exact pre-route L12; no additional acquisition | Frost Nova2/Ice Blast8 clears Blood Moor; Cold Plains W3 draws with one champion Zombie at38HP. |
| L13, Frost Nova3 | Restore the same original L12; 24 full Den wins, ordinals102–125; +50740XP; 2670512 combat ms. Item delta is invalid; see restoration caveat below. | Blood Moor wins; Cold Plains W3 draws with one champion Zombie at68HP. |

L12 cumulative XP is147220; its paid build is Ice Blast8/Frost Nova2/Fire Bolt4/
Ice Bolt1/Warmth1. Earned level points use2Vitality/3Energy. All drops remain
accessible in overflow. The exact original pre-route L12 export is retained as
[a service-earned fixture](fixtures/p01-act1-earned-l12.service.json), SHA256
`8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`.
The second pilot's separately written `route-cold/earned-l12.json` includes its
new combo order and has a different hash; it must not be confused with this input.

The bounded L13 pilot stops within its 30-attempt budget at cumulative197960XP.
It spends exactly one earned skill point on Frost Nova3 and five earned stat
points, retaining Ice Blast8. Its pre-route export SHA256 is
`2bea3abfd337af48f905e7d4e921d2121604fea3908c11ab377d4adb3813f4db`.
Cold Plains ends with hero139HP/185MP and merc180HP. The wave is a draw
(`winner:null`); the production run adapter reports `defeat`. That wave grants
zero hero/merc XP and zero items. The failed route's final cumulative XP200900
includes only earlier victorious waves. Burial Grounds, Dark Wood and Catacombs
are never launched in any pilot. The old/new boss comparison remains unexecuted.

QA found a material restoration-fidelity defect before publication: directly
setting saved stores omits normal persistence hydration's item-ID sequence
seeding (`persistence.ts`, `seedItemSeqFromHydratedSave`). In the L13 pilot,
the input's3737 item objects have3737 unique IDs; the pre-route export has5033
objects but5010 unique IDs. Its23 collisions are identical newly rolled items
reusing input IDs. The ID-based delta reports1273 additions while object count
grows1296. Neither count is an accepted loot yield. The export is retained
unchanged for diagnosis and must not be imported as a native-ready checkpoint.
This is a service-harness omission; normal runtime hydration already seeds the
allocator. [BUG-083](../../../production/bugs/BUG-083-service-restore-item-sequence.md)
records it. Correct future reconstruction through production lifecycle and
assert unique IDs/count reconciliation before accepting any service export.
Do not repair or relabel the old export after execution.

QA checked all three pilots: original input393 objects/393 unique IDs becomes
3737/3737 before the route and3789/3789 afterward, so its3344 farm-item yield
reconciles. The second pilot ends with3789 objects/3785 unique IDs: four
collisions,52 object additions versus48 reported by ID. Its final export also
remains diagnostic-only. The third pilot ends with5085 objects/5062 unique IDs,
retaining the same23 collisions. All original inputs and pre-route objects
remain present. This caveat does not turn any failed combat into a victory.

Combat time is not active playtime. The two acquisition segments take1.905 and
0.742 combat hours, excluding earlier browser acquisition and all UI decisions.
These single-build/seed observations do not validate the4–6-hour provisional
Act I share or the30–50-hour campaign target. More farming is not yet a proven
solution: the higher-rank pilot still fails and leaves a larger survivor.
Next: inspect the actual Cold Plains W3 skill cadence, targeting, mitigation
and resource events before selecting another build or balance change.

## Source verification

Real-data tests cover the reviewed Act I power package at seeds0/1/uint32max,
identical Catacombs guard plans, and whole-unit equality after reversing only
the changed power fields. Four later-act bosses retain their actual scaling.
The existing loot tests and synthetic chapter-boss ×8 controls remain intact.

- Genuine RED: 3 failed/10 passed on the original boss power.
- First post-change run: 3 failed/14 passed because the test reversal omitted redundant
  `stats.life`; corrected without a runtime change.
- Initial typecheck failed because the old-area fixture explicitly assigned
  `undefined` to optional MR. The corrected fixture models the original six
  fields and omits MR, preserving strict optional-property semantics.
- Final focused checks:20 passed/2 files. Full unit:8388 passed/263 files,
  198.97s. Types, lint/engine-purity and production build pass.
- Build uses `env -u VITE_E2E npm run build -- --outDir <raw-root>/dist`.
  Its four application JS chunks have zero forbidden bridge-token matches.
  Existing large-chunk and unprecached2.57MB art-manifest warnings remain;
  build success does not accept performance or offline gates.

Runtime map SHA256:
`94ba3259d1115c8b9c628f2f4c8fe7833ad9e3a277b6f98f8bc0e416047fae2a`.
Final test SHA256:
`783df22018c0f3f04d83523d6319e76138729e73f1ec948aa1a4086b33d4a02d`.
Producer's final source APPROVE/security PASS includes both test corrections;
GD approved the numeric contract and bounded L13 extension. QA approved the
exact scripts before execution. Final evidence review is recorded in the ledger.

## Reproduction and retained evidence

The [machine summary](fixtures/p01-act1-earned-entry.service.json) retains
ordered runs/waves, route units, actual awards, allocations and hashes of the
full raw reports and validation logs. Frozen executed sources are the
[original pilot](fixtures/p01-act1-entry.service.mjs.txt),
[L12 rotation pilot](fixtures/p01-act1-ice-blast-route.service.mjs.txt) and
[L13 pilot](fixtures/p01-act1-l13-entry.service.mjs.txt). Their script SHA256s
are respectively:

```text
efc567a5e9366de59d6b29099c9d9d8423a1295dba3b9a6dbaf1355c940e7467
06be31c6b600d299c8b68b71db0d14f9d1b1ce3e3e4681e967bde6ecbb523536
ab1c504c3d13ecc7c80224b87d357e258dcff6ba5eca3d62c99f9142948fdf55
```

Raw root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-act1-earned-entry-eg5lmxdv`.
Required raw scripts, reports, saves, command logs and cleanup receipt remain
there, including the `route-cold` and `entry-l13` children. Root owns them
through the Cold Plains diagnosis and C1/umbrella consumers, then removes them.
After all readers released and all three owned script PIDs were absent, exact
build/cache/tmp/progress cleanup removed797 files/51907183 bytes. Receipt
`cleanup.receipt.json` records no remaining disposable paths and no failures.
Shared caches and the original checkout remain untouched.
