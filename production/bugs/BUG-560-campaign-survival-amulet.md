# BUG-560 — Include amulets in the campaign defensive equipment policy

Status: Fixed locally, uncommitted. Severity: Medium. Owner: root, campaign equipment policy.
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus current dirty harness.
Environment: Linux/WSL native services, locale independent, no browser/viewport
or combat seed involved. Production game/data are unchanged.

1. Create a hero and hire an ordinary mercenary.
2. Own an eligible amulet that adds Life or mitigation, with the slot empty.
3. Run `equipCampaignSurvivalGear` for either owner.

Expected: evaluate the amulet using the same native eligibility/property rules
as other defensive jewelry. Actual: the helper never visits `amulet`; the
Javelin dispatcher delegates jewelry to this helper, so neither branch handles
the slot. Evidence: `tests/campaign/survival-gear.ts` slot list and the Javelin
branch in `tests/campaign/actions.ts`. Add native-equip regressions for both
owners before correcting the list. This omission is not established as the
pilot defeat's cause: its retained only amulet has no affixes.

Fix: include `amulet` in the shared bounded slot traversal. Both native owner
regressions reproduce before the change and pass afterward; all11 focused
survival checks pass. No combat replay, source gear grant or production change.
