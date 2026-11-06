# ORMU-12 — Expose the hero charm equipment choice

Status: implemented and independently reviewed; integrated browser acceptance remains open. Producer-reviewed bounded four-source UI card.
Depends on bilingual catalog and ownership/stat/cache guards.

Scope: EquipmentPanel, CharacterScreen, MercsScreen and ItemTooltip, plus one
charm-ui.test.tsx. Add charm to hero equipment and Character summary, show
localized type/slot and exact unique name in tooltip. Explicitly retain
MERC_EQUIPMENT_SLOTS and existing merc candidate compatibility. Reuse picker,
comparison, equip/remove and details actions. No new layout system or assets.

QA in en/zh: inventory slot → picker → exact named charm → equip and comparison
capacities → details → remove with preserved pools; Character charm/modal;
merc panel has no charm slot/candidates. Preserve ring/offhand tests. Real
360×640/desktop browser acceptance follows the complete quest flow.

Independent source review APPROVE. GREEN55/6 passes. Earlier stale unique resolver
mock and zh subtitle separator fixture corrections preserve behavior assertions.
React locale-update act warnings remain in this focused log; visual acceptance
will use the production browser after the complete quest flow is implemented.
