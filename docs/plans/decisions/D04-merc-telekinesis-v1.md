# D04 — Native mercenary Telekinesis

Status: scoped native contract approved by independent producer plan review.
Parent checkpoint: `9d2bae89d04ae9eda7416fea8126c21c312e4d8f`.

Gacha-spec §4.3 advertises single magic damage and 50% Knockback. The authored
`mskill-telekinesis` row has Arcane 20–32/CD2; its executable placeholder has
20–30 without control. Preserve the authored single-target Arcane damage and
normal seeded hit/base/critical, mitigation and personal/party Arcane increases.
Use explicit zero MP, flat ranks1–20 and no Attack contribution.

Under the no-movement rule, reconcile the advertised Knockback as 50% landed
Stun for1000ms ordinary/500ms boss and chapter-boss through canonical halving.
A miss cannot control. Keep this damaging mercenary skill distinct from player
Telekinesis utility. No new movement, immunity, guaranteed-hit or forced-target
behavior. Omitted cost/scaling and incompatible Knockback are explicit scoped
reconciliations, not verbatim GDD requirements.

Resolve exactly one validated row into an independent deeply immutable ordinary
DamageEffect/applyStatus. Close exact-ID schema metadata; reject ignored fields.
Remove only the matching stub. Preserve the signature mercenary's actual sole
Telekinesis loadout and the hireable Fire Iron Wolf's Fire Ball → Telekinesis →
Fire Mastery selection. Existing runtime owns expiry, interruption, cooldown,
damage settlement, non-stacking refresh and control surviving source death.
No shared runtime/type, persistence, recruitment, dependency or CI changes.

Freeze the reviewed actual-loadout primary, run causal RED before production,
file the bug, then implement and verify native resolver/combat/public lifecycle.
Constructed mechanics do not establish earned acquisition, balance or pacing.
H3 remains terminal failed-no-app; no app/browser/retry, protected fixture,
diagnostic/closed-policy or new earned-lineage experiment. Full-v1 acceptance,
campaign/pacing/device/locale/a11y/performance/PWA/actualCI/human/soak stay open.
