# P15 — Fire Enchanted verification

Locally implemented and verified 2026-11-05; uncommitted. BUG786 adds the
separate rollable Fire Enchanted modifier: +50 fire resistance (existing cap75)
and an independent 50-base-fire hostile death burst. Extra Fire Damage retains
Fire Ball. The existing Doll transaction supports both captured native payloads
without active casts, Ignite, corpse cost or Attack scaling. See the
[exact mechanic](../decisions/P15-fire-enchanted-v1.md).

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-fire-enchanted-kyss8yrx`.
Root retains this exact packet through full private-v1 acceptance, then removes
it after all consumers finish. It holds source preimages/hashes, plan, failures,
reports, browser drivers/screenshots, exact increment and cleanup receipt.
The inherited skill-resolver test's original full-file preimage was omitted;
its original 11-case block remains, but exact original full-file provenance is
not claimed. The later Doll test correction has an exact saved preimage.

## Checks and observed behavior

- Causal native construction first fails because Fire Enchanted is absent.
  The five-file affected run subsequently passes 88 actual cases:24 combat,
  28 skill resolver,4 native construction/planner,17 elite schema,15 resistance.
- The selected Doll regressions initially pass23/fail2 (10 unselected). Both
  failures reproduce against exact pre-Fire production modules. BUG787 corrects
  the one-Doll treasure roster expectation and the Conversion fixture's HP/
  Ignite setup, preserving all nested-death, poison-spread and corpse ordering
  assertions. No production targeting, RNG, map or damage change was needed.
- The final four-file run passes68 actual cases (23 unselected), including all
  24 Fire combat,28 resolver,4 store and12 selected Doll cases. The latest status
  union is115 executed cases across the exact reports, with no remaining
  failure. Duplicate serialized parameter names are distinguished by occurrence;
  the original113-name summary is retained as `initial-case-evidence-union.json`.
  These are focused cases, not a full-suite or broad balance acceptance.
- Final scoped strict types import931 files with zero diagnostics. Seven
  changed TS/test files lint clean; the corrected original Doll test also
  passes its separate lint check. Initial fixture/type/lint mistakes remain in
  `initial-failures.md` and original logs, without hiding failed runs.
- Chromium147 passes en/zh-CN at360×640 and1280×800. Native seed7 at500ms
  attempts the burst against hero/merc/summon: hero takes23 after50% fire resist
  and2armor; merc dodges for0; summon takes50. Three attempts are not three
  landed hits. Source death precedes burst; no-affix control has none. Marker-only
  living action schedule remains34 actions, with no cast/MP/status effect.
  Singleton-pool manual/idle plans attach the marker only to planned carriers.
  Inputs remain unchanged. Actual localized CombatLog renders without overflow,
  errors, warnings or failed requests; the zh-CN mobile screenshot was inspected.

## Limits and review

These browser checks use constructed mechanics/log fixtures, not a full
CombatScreen encounter or earned progression. Generic log wording remains
“attack”/“普攻”. Affix translations are checked separately; generic monster
names do not include affixes, so visual affix-tag acceptance remains open.
Tests cover native identity/replacement rejection, initial-body eligibility,
Conversion, simultaneous/nested death ordering, lethal last-enemy outcome,
Doll coexistence, ordinary mitigation and deterministic replay/input ownership.
Root self-review finds the change at the native content/death-authority boundary;
no independent-review or formal balance credit is claimed.

Historical14/14 intended Normal completions,210 retained contexts and formal
balance acceptance0/210 remain unchanged. Full private-v1 remains active and
unfinished: gameplay/content, attained power/acquisition/crafting economy,
retry/population balance,30–50active-hour pacing, higher difficulties/endgame
and integrated bilingual/mobile/a11y/save/PWA/performance/soak/independent
acceptance remain. Browser works; CI excluded; owner playtest later. No pending
question or external blocker. No spent campaign/pilot/sample/retry budget renewed.

All recorded handles are terminal. Exact browser PIDs395532/397649 and port4379
are checked absent/unbound, and only the packet-owned `vite-cache` is removed;
`cleanup.json` records actual results. The named evidence packet remains root's
retained handoff artifact through umbrella acceptance.
