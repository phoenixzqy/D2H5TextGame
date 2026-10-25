# BUG-218 — Town requests invented NPC portrait paths

- Status: fixed locally in `ae556b86`; no new art generation.
- Severity: Medium — repeated failed requests and console errors on normal town entry.
- Owner: root; no new art generation in scope.
- Environment: production Chromium, en, 360×640; public new-game/save/Continue.
- Scope: NPC image resolver and the existing immediate fallback.

## Reproduction

Create a Barbarian, enter Act I town, Save, close and Continue in a new page.
The browser requests `class-portraits/npcs.act1.warriv.png` on each town mount;
the asset does not exist. The retained failed browser trace records three
HTTP404 responses and the strict console check fails.

Expected: resolve only a registered portrait that belongs to the current act;
otherwise return null so GameImage immediately renders its existing fallback.

Root cause: `getNpcPortraitUrl` constructs a pathname without consulting the
generated NPC portrait availability map. Preserve dedicated known portraits;
do not substitute a different character or generate artwork. Validate returned
URLs against real files and verify normal town/save/Continue without errors.

This predates Frenzy; earlier browser runs checked page exceptions without
capturing these resource console errors. No historical clean-console claim
is inferred from them. No genuine campaign or remote action.

## Local verification

[Delivered evidence](../../docs/plans/evidence/d04-frenzy.md) retains RED/GREEN,
actual production checks and full15158/695/two-existing-skips PASS. Final types/
lint/build pass; four locale×viewport public cases/eight exact five-domain durable
pairs/four actual offline fresh-page Continues pass. Root author review only;
full-v1, independent review and earned balance remain open.
