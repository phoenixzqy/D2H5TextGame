# ORMU-06 — Present only concretely bound unique definitions

Status: implemented; focused acceptance approved; coherent checks pending. Owner: root. Depends on ORMU-05. Producer-approved split.

Use the shared current unique resolver for display model and localized item
names. An old mismatched Ormus string gains no charm name, definition lines or
flavor. Preserve payload, generated names, unknown IDs and correctly bound unique
presentation. QA covers both locales with injected future definitions and
positive/unknown controls. Source scope: `src/ui/itemDisplay.ts`,
`src/ui/i18nKey.ts`, `src/ui/unique-base-binding.test.ts`.

No new catalog or UI control activation. Root retains raw RED/GREEN evidence in
`d2-ormus-urhb34ei`; no CI/commit/remote work.

## Focused outcome

Independent design_contracts review: APPROVE. Focused controls passed 48 tests across 4 files. Raw RED/GREEN logs remain in the root-owned Ormus packet. Full current-source checks and feature acceptance remain pending.
