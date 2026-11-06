# P15 — Native Duriel Freeze immunity

BUG-733 is fixed in the working tree. Duriel authors schema-validated
`statusImmunities: ["freeze"]`; the factory makes an independent frozen copy.
The shared boundary rejects immune statuses before duration/refresh/cleansing/
RNG effects. Cold damage and Chill remain valid; other bosses retain half-length
Freeze. Names/IDs/resistances grant no immunity. Transient enemies are not saved,
so no save migration is needed.

## Verification

Genuine native RED precedes correction: manual/idle Tomb seed13/ordinal450
Ice Blast produced Freeze and Chill, and the schema rejected authored immunity.
Final four-file run: **116 passed** (native3/status64/factory9/Freeze-Chill40).
Positive cold damage, selective Chill, unchanged HP25600/Attack220/Defense280,
recorded/plain parity, immutable inputs, malformed metadata, no RNG side
effects and other-boss controls pass. Scoped strict types: zero diagnostics,
908 reachable files. Affected lint passes after removing a redundant test
matcher; the explicit positive-damage assertion and gameplay were preserved.

Caller audit passes: hit/generic paths emit only on accepted application.
Frozen Armor retaliation applies Chill; Shiver/Chilling Armor Freeze uses the
checked hit pipeline. No further production change was needed.

Chromium desktop1280×800/zh-CN/manual and mobile360×640/en/idle pass with native
enemy/playback and synthetic caster. Chill-only chips, no console/page/request
errors or horizontal overflow. Desktop and version2 mobile enemy-visible
screenshots were inspected. The first mobile screenshot omitted the internally
scrolled enemy; preserve it alongside the focused followup. Cold damage is1
under existing mitigation. This does not accept earned power, header/location/
cadence, broad mobile UX or balance.

## Retention

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-freeze-6ylefvnr`.
Keep RED/GREEN logs, `types.json`, lint exits, `caller-audit.json`, browser v1/v2
results/native recordings/screenshots and eleven source snapshots pinned in
`source-manifest.json`. Nine native Tomb diagnostic battles used the24-battle
budget; constructed engine regressions are separate. No campaign, acquisition,
population or holdout trials were run.

`cleanup.json`: browser PIDs26053/27161 and wrapper27159 absent, servers closed,
task caches removed, no remaining disposables/failures. Root retains the exact
approximately0.92MB packet through full-v1 acceptance, then removes it after
consumers finish. BUG-731, Duriel continuous Aura cadence and wider balance/
economy/pacing/app acceptance remain open. Formal balance stays0/210.
