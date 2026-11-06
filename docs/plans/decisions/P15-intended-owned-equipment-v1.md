# P15 intended owned equipment v1

Status: candidate acquisition policy; population and balance acceptance remain open.

2026-11-03 extension: [Barbarian physical preparation](P15-barbarian-owned-weapon-v1.md)
uses the existing physical-offense mainhand score for intended Swing6/Throw12,
alongside Corpse24. First preferred-weapon acquisition still overrides that score;
later throwing-affinity retention is mandatory. Other slots/profiles keep the
monotone policy below. This does not reopen failed admissions or prove viability.

The fourteen intended growth candidates use `owned-build-v1` at idle preparation
boundaries. Consider only actually owned backpack and stash items, excluding the
current hero's reserved Iron Golem item. Mainhand selection precedes other slots;
native eligibility, comparison, mutex, transfer and equip actions remain authoritative.
Retrieve stash candidates with the existing `stash-room-v1` policy. On a capacity
refusal retain all committed transfers and try the next candidate. Create no items,
currencies, XP, resets or resource refills. Retain all decision and refusal records.

Bow retains its existing bow/crossbow fallback rule. Double Throw prefers throwing
weapons, and martial Assassin prefers claws, because their invested masteries depend
on those native weapon types. Until one is owned and eligible, ordinary upgrades
remain available. Acquiring the first preferred mainhand takes priority over scalar
gear score and may lower stats: record that explicit trade. Once acquired, reject
equipment changes that remove that weapon type. Thereafter use native clear net
upgrades in score/ID order. Other builds use ordinary native comparisons without
inventing skill weapon restrictions. In particular Javelin skills and Double Swing
have no authored weapon requirement; names alone do not add one.

This changes evaluation preparation only. A compatible weapon's existence in data
does not prove timely acquisition. Fresh routes must retain actual drops, costs,
missing affinity states and all failures. Companion/training/funding/role policies
must be frozen before population or holdout acceptance.

Acceptance: stash upgrades, deterministic identity acquisition and retention,
native eligibility and mutex, refusal/fallback, reserved-item protection, exact
custody/resources and unchanged historical profiles. No campaign replay is needed
to verify the selector; earned-route viability requires subsequent fresh campaigns.

Plan review: ready after including idle-only mutation, reserved-item exclusion,
mainhand-first ordering, first-acquisition stat trade and native capacity fallback.
Security check: pass. Local evaluation code uses owned state and existing guarded
transactions; no external communication, credentials, dependency or CI changes.
