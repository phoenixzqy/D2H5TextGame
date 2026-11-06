# Shared dialog keyboard focus — BUG627

2026-11-03. Fixed and verified in the accumulated private-v1 working tree.
Requirement P16/F15/G5; [bug and verification](../../../production/bugs/BUG-627-modal-keyboard-focus.md).

Settings import/delete, inventory bulk discard and crafting now use one shared
focus manager. Opening a generic confirmation focuses its named panel;
crafting retains Cancel-first entry. Focus wraps, Escape respects handled events
and nested dialogs, and dismissal restores each dialog's own opener.

Evidence packet retained by root through umbrella review:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`bug627-browser-v2-result.json` passes both desktop en1280×800 and mobile
zh-CN360×640 with exact before/after save equality, no overflow and clean browser
console. The four `bug627-v2-*.png` images were inspected. Driver and source
hashes are recorded in the report. Earlier failing reports are retained.

Affected checks: 102 UI cases across seven files; five Modal cases rerun after
a test-only lint cleanup. Scoped strict types and explicit zero-warning lint
pass. No full-suite replay, installation, commit, push or publication.

The initial browser assertion incorrectly skipped Chromium's keyboard-scrollable
preview; final assertions include that control and await the focus manager's
animation-frame guard return. No accessibility behavior was removed to pass it.
The earlier scoped type failure was missing test-setup augmentation, corrected
in the external config. All failed evidence remains visible.

This does not certify the separate mobile inventory detail sheet, every viewport,
production PWA, performance, balance or the complete private-v1 requirement set.
Formal balance remains 0/210; genuine campaign checkpoint is unchanged.
