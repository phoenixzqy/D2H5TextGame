# P15 — Selected elite-affix visibility verification

Locally implemented and verified 2026-11-05; uncommitted. BUG789 addresses
monster-spec §9's selected-affix display requirement for all six live modifiers:
Extra Fire Damage, Fast, Cold Enchanted, Lightning Enchanted, Magic Resistant
and Fire Enchanted. This does not complete other missing affixes or full v1.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-affix-visibility-o064bocg`.
Root retains this exact packet through full private-v1 acceptance and removes it
after all consumers finish. It contains inherited-path preimages/hashes, causal
RED, corrected/final reports, source manifests, drivers/screenshots, self-review,
exact increment and cleanup receipt. No new subagents, commits, pushes or CI.

## Change and checks

- Native wave construction preserves the actual selected name key as optional,
  readonly, transient CombatUnit presentation metadata. Mechanics/factory input,
  affix selection/cardinality, RNG, save shape and existing plain-name keys are
  unchanged. Real recorded simulation preserves the metadata and emits identical
  events with only that presentation field removed. Caller inputs stay intact.
- A documented resolver only accepts monster keys in `combat.eliteAffix.*`,
  resolves a separate localized icon/text tag, and omits unknown keys. Existing
  localized monster names and instance suffixes are preserved in log names.
- The full CombatScreen renders one wrapping labelled list badge outside its
  truncated card name. Accessible group names and titles include the tag;
  ordinary/unmodified boss controls do not. Live language switches update tags,
  and replacing an affixed enemy with an ordinary one removes its badge.
- Causal RED fails all five original cases for missing identity/badges. Initial
  GREEN passes the real staging case and five existing damage-immunity cases,
  with four fixture failures. These are retained in `initial-fixture-errors.md`:
  comparisons across different RNG streams and a replacement without grid
  position were corrected in tests, without a production workaround.
- Corrected GREEN passes six new cases. Final GREEN executes those six plus two
  existing localized-name cases: eight passes and 25 skipped cases. Its top-level
  JSON count includes skips; only assertion statuses count. Across the three
  GREEN reports, 13 distinct executed cases have latest passes (six new, seven
  existing). Initial failures and duplicate runs are not additional passes.
- Final scoped strict types import 1,000 files with zero diagnostics. The five
  changed TS/TSX paths lint clean after correcting test-only assertions. Initial
  lint output/preimages remain retained. No full suites or campaign reruns.
- Chromium 147 passes en/zh-CN at 360×640 and 1280×800 with real full paused
  CombatScreen, six native affixed enemies, ordinary/boss controls, and a real
  recorded-wave publication/log projection. All tags appear once; recorded
  names carry the tag, inputs are preserved, keyboard log navigation and locale
  switching work, and badge/document horizontal overflow is absent. Final
  console errors, warnings and request failures are all zero.

## Browser limits and review

The first browser attempt observed all four UI fixtures but failed the network
gate when concurrent test edits triggered Vite reloads and 285 aborted requests.
That failure remains intact under `initial-browser-attempt/`; it is not filtered
away. With sources frozen, the final four-fixture run passes every gate. The
preimage replay screenshot proves zero original badges; it is not replayed again.

The final zh-CN mobile card screenshot was inspected. Full text remains readable
and wraps within the narrow grid. Some decorative emoji render as missing-glyph
boxes under the available WSL fonts; glyph appearance is not fully accepted.
The screenshot's top card row is partly obscured by the existing sticky header
after the fixture scrolls the grid into view. This is not a claim that the whole
screen's layout or accessibility has been accepted. No unrelated layout change.

Root self-review covers selected-only identity, localized suffixes/fallbacks,
recording/publication preservation, ordinary controls, keyboard/label behavior,
input preservation and bounded presentation work. The accidental inherited EOF
blank-line removal is restored after the browser finishes; no behavioral source
changes follow final verification. No independent approval or merge readiness.

Constructed fixtures grant no earned progression, balance or pacing acceptance.
Historical 14/14 intended Normal completions, 210 retained contexts and formal
balance acceptance 0/210 remain unchanged. Remaining full-v1 work includes
gameplay/content; attained Act III power, equipment/acquisition/crafting economy;
defeat/retry and population balance; 30–50 active-hour pacing; higher difficulties
and endgame; integrated bilingual/mobile/accessibility/save/PWA/performance/soak
and independent acceptance. Browser works, CI is excluded and owner playtest
follows implementation. No pending question or external blocker; no spent
campaign/pilot/sample/retry budget renewed. The full-v1 goal stays active.

All four final validation handles are terminal with exit code zero. Initial and
final owned browser PIDs are absent and port 5173 is unbound. Only the exact
packet-owned `vite-cache` and `baseline-vite-cache` directories are removed;
`cleanup.json` records verified results. Retained evidence belongs to root until
umbrella acceptance and all consumers finish.
