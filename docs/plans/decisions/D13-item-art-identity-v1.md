# D13 v1 — Item art identity and category

Status: accepted scoped implementation contract, 2026-10-20; P05b only.
Producer independently reviewed the concrete art/UX and technical plan.
Full D13/F19 (including assets, payload and offline behavior) remains open.

`getItemIconUrl` is the shared instance boundary. Select the first present
identity in `uniqueId`, `setPieceId`, `runewordId` order. Resolve its existing
post-strip override before generated identity art; when art is absent, resolve
the concrete base's override, generated art, then authored metadata category.
Preserve current ID aliases and override keys exactly; do not silently rewrite
slash/dot ID forms into one override namespace. Definition recipes retain
their existing rune/set representative behavior without a concrete base.

Known base metadata wins over generic instance slot/type hints and slug
inference. Weapon metadata determines the category even for offhand weapons.
Use exact existing categories for sword, axe, mace, dagger and bow. Interim
category proxies: spear/polearm/staff/wand/scepter/orb → staff; crossbow → bow;
throwing → dagger. These are explicitly proxies, not exact depictions.
Nonweapon slot metadata maps head/chest/gloves/belt/boots/amulet/rings/offhand
to helm/armor/gloves/belt/boots/amulet/ring/shield. Rune/gem base types may use
their existing icons. Known unclassifiable metadata returns null; it must not
fall through to an invented sword. Legacy slug/hint inference is available
only when the base is unknown.

Data lookup and asset URLs belong in the UI. No engine import of URLs, image
generation, art style change, save migration or generated-map change is needed.
Backpack/stash, picker, detail and tooltip must consume the same helper in
P05b02. Text-only equipment/loot displays do not need new art UI.

Acceptance: real unique versus base, identity/base override precedence,
missing identity art, every weapon proxy under misleading synthetic slug,
offhand weapons, all nonweapon slots, legacy aliases, null fallback, and all
shipped bases resolving through both APIs to existing files. Then ordinary
browser transfer/equip/inspection/export/reload in both locales and mobile /
desktop must retain identity. Imported fixtures establish presentation only.
Use existing GameImage fallback handling in the picker when wiring it.
