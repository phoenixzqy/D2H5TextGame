# BUG-164 — Bound and search mercenary equipment candidates

Status: Fixed locally in `6c6628e`; independent acceptance remains pending.
Severity: Medium. Scrolling remains possible, but earned collections render
thousands of duplicate names without an exact-instance search.
Owner: root, frontend responsibility; no delegation.

## Reproduction

- Source `a1c5bfc`; Vitest/jsdom, English and zh-CN.
- Browser target: production Chromium at360×640 and1280×800.
- UI-only deterministic reproduction; no combat seed applies.

1. Own a mercenary and201 compatible caps with distinct IDs and rolls.
2. Open Mercenaries → the owned merc's Equipment → Head.
3. Count visible candidate actions, try reaching a final page, then search for
   one instance whose display name is shared by the other caps.

Expected: Bound rendering, all owned instances reachable, and search by
localized name or displayed item ID. Browsing must preserve ownership; Equip
must continue using the native exact-instance transfer and refusal feedback.

Actual: All201 candidate buttons render. No paging or search exists. The
genuine campaign's backpack already contains over20000 items, so this path
repeats the unbounded-list problem fixed for the hero backpack in BUG159.

## Evidence and cause

`src/features/mercs/MercsScreen.equipment-pagination.test.tsx` produces4/4
causal failures before the source change:201 visible actions instead of100
and missing last-page actions in both locales. Raw RED evidence:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/merc-picker380/red.log`.

`MercEquipmentEditor` maps the entire compatible backpack subset into DOM
rows and displays only the localized name. Existing inventory paging does
not apply to this separate selector. Workaround: scroll and rely on item
order; no reliable visible ID search exists.

Root retains diagnostic evidence through campaign/full-v1 consumers and then
removes the exact task-owned raw directory. Source and this report remain.

## Resolution

The mercenary selector now reuses100-item inventory pages, displays persistent
instance IDs and searches localized names/IDs without changing acquisition
order or any store action. Search and slot changes reset paging; live removals
clamp the current page. Existing refusal/retry feedback remains intact.

Focused mercenary tests23/6files pass, including all four new regressions.
Production Chromium10/10 passes in en/zh-CN across360×640,412×915,915×412,
1280×800 and1920×1080. Each uses a diagnostic copy of the genuine20371-item
earned save, proves exact item transfer with full payload conservation and
exact Save-close-Continue, checks keyboard actions,44px controls and no
horizontal overflow. These copies never become campaign resume saves.
No browser console/page errors occur. Typecheck, final lint and build pass.
Final full-unit11678/454files PASS510.92s, two existing skips. All1128 frozen
source/test/config hashes remain unchanged. All760 build files are identical
before/after the lint-only no-op syntax correction; all7 emitted JS files are
bridge-free and served exactly. Original RED, wrong test namespace, initial
lint failure and gracefully interrupted pre-correction suite remain retained.
No test assertion, skip or budget is weakened. Existing full-suite timing,
bundle/PWA limits and full-v1 acceptance remain open. See
[complete evidence](../../docs/plans/evidence/p16-merc-equipment-browsing.md).
