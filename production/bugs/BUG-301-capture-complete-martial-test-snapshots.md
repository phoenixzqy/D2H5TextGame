# BUG-301 — Capture complete native martial snapshots in fire alias fixtures

Status: Reproduced; fixture correction pending.
Severity: Medium — three regression cases cannot verify rank aliases after martial integration.
Build: 36a18d50778a3679c0ef58f30f91e8dbc53769ad plus four uncommitted charge runtime paths.
Environment: Vitest normal engine/UI workspace, jsdom; no browser/viewport, locale-independent; seed7.

1. Run the nine-file actual-branch charge compatibility command in `charge-branch-runtime-unit.json`.
2. Observe Fists of Fire, Dragon Tail and Phoenix Strike alias-by-MAX cases.
3. Compare original complete recorded battle diffs with the fixture's partial rank replacement.

Expected: compare the full native rank20 capture, keep enemy fixtures free of inherited player-only martial permission, preserve exact events/results, immutable input and repeatability assertions.
Actual: 269PASS/3FAIL. All diffs are `assassinMartialRanks`: expected rank20, received rank1. Damage, events and existing native MAX alias projection match. The fixture replaces only `skillLevels` from a new native capture; the hero retains the earlier martial rank1 projection. Its enemy is spread from the hero and also retains irrelevant player martial permission.
Root cause: incomplete test input update after adding an explicit native martial ownership snapshot. Engine intentionally refuses disagreement between captured permission and skill allocation. Do not relax that check or drop exact equality.
Evidence: root-owned task `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc`, `charge-branch-runtime-unit.{json,log}`, original `assassin-fire-before-martial-snapshot.test.ts`. All2514 repository inputs,17 external inputs and HEAD remained exact; strict scoped types and lint passed.
Affected systems: qa-engineer fixture, engine-dev native authority. Root sole executor under umbrella authorization.
Workaround: none applied; new native22 and helper17 tests pass separately but do not replace the failing compatibility cases.
Security check: pass; local fixture correction only, no authority bypass, secrets, dependencies or remote operation.
