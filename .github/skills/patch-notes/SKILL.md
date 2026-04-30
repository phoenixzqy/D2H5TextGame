---
name: patch-notes
description: Player-facing release notes in zh-CN and en. Mirrors the engineering `CHANGELOG.md` but rewritten in the game's voice for the in-game "What's New" panel. Always bilingual.
---

# Skill: patch-notes

## When to use
- Same trigger as `changelog`. Run `changelog` first.

## Format
- Both zh-CN and en in
  `src/i18n/locales/{zh-CN,en}/patch-notes.json`.
- One key per version: `"v1.2.0": { "headline": "...", "body": [...] }`.

## Style
- **zh-CN first**, then localize.
- **Voice**: in-world narrator. "Lord of Destruction" tone, terse,
  ominous. Avoid engineering jargon.
- **Player frame**: what changed in their experience. Numbers OK if
  player-relevant ("Lightning damage now scales 12% per level, up
  from 10%").
- **Length**: ≤ 8 bullets per version. Cut the rest.
- **No spoilers** for unreleased content.
- **No memes**, no fourth-wall.

## Phase 1 — Pull source
Read the new section in `CHANGELOG.md`.

## Phase 2 — Rewrite
For each Added / Changed / Fixed bullet, ask:
- Does the player notice this? If not, drop.
- Can this be said in the game's voice? If yes, do.
- Would a player tester feel this is meaningful? If not, drop.

## Phase 3 — Localize
Write the en first if the en chord makes sense; else zh-CN first.
Don't translate idioms — replace with culturally apt equivalents.
`writer` co-signs voice.

## Phase 4 — Wire
Update the in-game "What's New" panel route to surface the new key
on first launch after update.

## Phase 5 — Verify
Run `mobile-responsive-check` on the patch notes panel — long text
must wrap cleanly at 360×640 in both locales.

## Owner
`writer` drafts; `producer` approves; `narrative-director` co-signs voice.
