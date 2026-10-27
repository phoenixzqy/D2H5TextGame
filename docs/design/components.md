# Shared presentation components

**BottomNav** (`src/ui/BottomNav.tsx`) provides the eight localized game
destinations, a development-only tool link and an optional desktop idle chip.
It has no public props; `ScreenShell.hideNav` controls its presence. Small
co-located SVG paths inherit the existing palette and stay decorative so native
link names/current-page announcements come from text and routing. Below640px,
four columns/two rows keep complete12px labels and44px-plus targets; from640px
it uses a row, and from768px the existing side rail. Keep complete translated
labels, visible focus rings and safe-area padding; do not restore font-dependent
emoji, abbreviate destinations or reduce font size to fit. Actual full-viewport
capture records and bounded checks are in the [navigation evidence](../plans/evidence/p16-navigation-icons.md).
