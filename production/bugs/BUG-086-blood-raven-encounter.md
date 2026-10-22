# BUG-086 — Complete Blood Raven's encounter

Status: fixed in `06f3c88197ec24b04c9ffc409de91f4680eb6a11`.
Severity: High. Owners: engine-dev/content-designer; QA.

Reproduction: `c020dba`; Node production service, locale independent, no
browser viewport. Original earned L12 route seed2223645302/ordinal104,
retained `d2h5-rogue-attack-mfx9_n49/arrow-route-report.json`, Burial Grounds W4.

1. Restore the original unique L12 checkpoint; use the approved weapon/orders.
2. Clear Moor/Cold Plains, then enter Burial Grounds without farming/refills.
3. Inspect production W4 spawns, boss actions and terminal state.

Actual: three Bone Warriors receive boss tier despite `canBeBoss:false`.
Blood Raven has3650HP/145DEF, fires placeholder20–35/CD1, creates one startup
generic minion and does not periodically raise real Zombies. Enrage is only a
flag. The wave draws at60s: boss2241HP, hero90HP, Rogue dead; no draw rewards.

Expected: [approved encounter contract](../../docs/plans/decisions/P14a01-blood-raven-v1.md).
Explicit ordinary guards; deliberate miniboss630–882HP/40DEF atL12, dedicated
Fire Arrow35–55/CD2/two Burn stacks, scheduled Raise Dead3/CD25/cap6, physical
base arrow30–50, sticky10%HP enrage doubling attack speed.

Root causes: boss-wave fallback tier overrides absent guard flags; authored
encounter behavior remains on generic registry placeholders. Current HP follows
the existing×3 formula; the new HP band is an explicit balance decision.

Regression: `src/engine/combat/blood-raven.test.ts`,
`src/engine/skills/blood-raven.test.ts` and ordinary production-browser
`tests/native/blood-raven-native.spec.ts`. Four-map earned continuation now
wins, including Blood Raven; Catacombs stops at W4 before Andariel.
See [implementation and evidence](../../docs/plans/evidence/p14a01-blood-raven.md).
No full Act I/campaign acceptance. Do not advance from failed diagnostic saves,
award a false clear, farm, or tune after inspecting selected winning seeds.
