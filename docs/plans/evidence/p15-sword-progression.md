# P15 ordinary sword progression — local implementation evidence

BUG660 is locally fixed in retained uncommitted source. Existing War Sword32
and Legend Sword60 now have34 appended ordinary picks across24 tables. The
[independent decision](../decisions/P15-ordinary-sword-tiers-v1.md) freezes source
bands and provisional weights. All38 current tables equal the exact retained
preimage plus the declared additions; every old entry and field is preserved.
No bases, combat formulas, locales, schemas, saves, goblin or fixed rewards change.

49 focused loot cases, two native equipment cases and one exact D08 predecessor
comparison pass; original49 availability failures are retained. The schema check
uses strict Ajv. Native seeded materialization isolates each real pick after
independent availability checks; it does not measure acquisition odds. Native
equipment tests cover atomic requirement refusal, Attack/mastery, unchanged
crit/speed, shield and displaced-item custody. Scoped strict types and explicit
unignored lint pass; no broad suite or campaign replay.

Four Chromium cases pass in48.055s: English/Chinese on1280×800 desktop and360×640
mobile. Public character creation/export/import creates an explicit level60
owned-item fixture. Localized picker/details and loaded sword art, native equip,
62-point Attack increase over the fixture scimitar, exact inventory/shield/map/
currency custody, Save and reload, no page/console errors or warnings and no
horizontal overflow pass. Eight captures inspected; existing modal scrolling
keeps mobile controls reachable. Constructed inventory proves native use only.

Required evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Original unit logs: `p15-sword-progression-v1-{red,green,equipment,preservation}.log`.
Browser/types/lint/full-JSON preservation and closure:
`p15-sword-progression-v1/`. Exact preimages:
`p15-sword-progression-v1-preimages/`.
Both recorded browser PIDs absent; Vite closed; owned generated config, scoped
config and cache removed with verified absence. Reports/captures/source hashes
remain root-owned through umbrella review; root owns eventual cleanup/release.
Screenshot extraction needed two local corrections (PIL unavailable; report has
base64 bodies); no installs or test replay were used.

[BUG659](../../../production/bugs/BUG-659-double-swing-act4-throughput.md) remains
open: stronger weapons were already owned but rejected by campaign preparation.
Its terminal export is unchanged, SHA256
`5668fcbe45ee098447b4aa8dc2c7cd508730a13fea414326337984c4b861f10a`.
Attempts708–710 stay exhausted. This content slice grants no Izual victory,
earned acquisition, population, economy, pacing or formal balance acceptance.
Intended counts remain14ActI/3Normal/formal0/210; full privatev1 incomplete.
Root self-review is not final independent acceptance. Browser works; CI excluded;
no pending answer. No agents/install/commit/push/publication.
