# D05 — Assassin weapon foundations and learned passives

The full seven-class target supersedes the old claw exclusion/dual-wield deferral.
Hero equipment accepts authored one-handed weapons in an explicitly selected
offhand; default weapon equips still target the main hand. Existing ring routing,
requirement/capacity checks and atomic two-handed/offhand displacement remain.
Picker, comparison and store share base-aware eligibility. Both weapons contribute
through existing equipment aggregation once; no alternating attack, extra action,
new RNG or save field/version. Compatible offhand runewords retain their reviewed grants through the same slot
predicate, exact socket validation and named-grant duplicate reduction.
Mercenary slot policy remains separately defined.

Add six normal claw tiers at the existing one-handed sword tier unlocks and
identical damage/socket tuning: Katar1, Wrist Blade8, Greater Claws22, Hand Scythe32,
Feral Claws50 and Runic Talons60. Split each matching ordinary normal/magic/rare sword TC entry weight equally
with its claw peer, preserving every table's total weight, rarity and level bands.
Hand Scythe shares the Act III ordinary Greater Claws allocation; Runic Talons
shares the Act V ordinary Feral Claws allocation (each existing claw share splits
equally, preserving the sword share and authored level band). Their sword tuning
peers have no ordinary acquisition entries.
Forced unique/set entries retain their original sword bases and full weights until
real claw templates and their save compatibility are reviewed; ordinary rarity
materialization cannot satisfy a guaranteed unique/set reward by downgrading it.
Use bilingual names and the existing dagger art proxy; generate no assets.
Legacy closest-fit unique base mappings remain a separate compatibility task.

Claw Mastery uses its authored2.5% Attack and0.5pp critical chance per rank, cap20,
unlock1, only with an actual main-hand one-handed claw. Weapon Block unlock12,
cap20, requires learned Claw Mastery and two distinct actual one-handed weapons;
adds1pp physical/0.5pp magical dodge per rank. Other classes, missing/unknown/2H
weapons, shields and duplicate item IDs never qualify for dual wield. Both exact
allocation aliases resolve maximum once, ignore invalid ranks and clamp the cap.
No implicit ranks or active slots. Copy strict JSON tuning independently.

Fresh Player composition applies effects before runeword grants without altering
persisted stats or resources. Ordinary changes affect the next wave; unlocked
replay uses original pools and earns no income. Update both locales/current-next
rows. Verify genuine causal RED, atomic equipment/capacity/preview, reachable
seeded claw drops, rank1/cap/invalid/foreign/weapon controls, native next-wave and
reset/replay, damage/crit/miss events, save round trips, production desktop/mobile.
Freeze all source and Git state for the final full suite. No earned class/build
balance or full-v1 acceptance from constructed fixtures. Root plan review: ready.
Security check: pass; no dependencies, network, CI, credentials or permission changes.
