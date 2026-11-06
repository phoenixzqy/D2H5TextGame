# BUG-722 — Retain the selected language before character creation

Status: Locally resolved in the retained working tree; no new commit.
Severity: Medium. Owner: root / frontend settings.
Affected systems: initial i18n language, fresh-profile settings.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained
`feat/playable-foundations` working tree; Chromium 147.0.7727.15 / WSL,
360×640, fresh disposable browser profile. No combat or RNG seed applies.

1. Before creating a character, open Settings and choose English.
2. Return Home. Verify `html.lang=en`, the New Game label, and the existing
   i18next preference cache value `en`.
3. Reload the page.

Expected: keep the explicit language choice without requiring a character save.
Actual: Home and document language reset to Chinese; initialization overwrites
the preference cache with `zh-CN`.

Evidence: `locale-repro.json` and `locale-repro.mjs` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-background-recovery-ud6mbopw`.
The before/after language, cache and visible labels are asserted independently.
Root retains this shared evidence through umbrella acceptance, then owns exact
cleanup. The discovery invalidated initial English labels in BUG721's first
browser run; corrected English-only checks passed without reloading.

Confirmed cause: `src/i18n/index.ts` forces `lng: 'zh-CN'`; the meta store also
starts with a Chinese locale. The normal saved-character restoration path is
separate. Any fix must keep default Chinese, align controls/document/copy, handle
unavailable preference storage, and preserve explicit imported save settings.
Workaround: select English again after reload. No gameplay progress is lost.

## Resolution — 2026-11-04

Both startup callers now read the existing tiny `i18nextLng` preference through
one guarded reader. English survives a pre-character reload; absent, unsupported
or inaccessible preferences retain the Chinese default. Store reset defaults,
the existing preference writer and saved/imported character precedence remain.

[Verification](../../docs/plans/evidence/p16-startup-language-preference.md):
21 affected tests, scoped strict types/four-file lint and ten real Chromium
checks pass. Native imports in both directions preserve exact player/inventory
data. Initial test-harness failures are disclosed; no earned save was touched.
