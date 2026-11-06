# D09 — Chapter-boss first-kill rewards

2026-11-04. Implements drop-tables §5 first-kill bullets under BUG680.
The preceding goal turn was status-only (no implementation progress); this
continuation resumes actual work in the existing claimed human2 checkout.

First-kill means once per boss, per difficulty, per save, using the existing
Normal/Nightmare/Hell area-clear ledgers. This follows the current first-clear
model, requires no save-format change, and makes Baal's first Hell reward
reachable after Normal/Nightmare. Historical clears consume eligibility; there
is no retroactive grant. Baal grants one unique on each difficulty's first kill
and one additional Mal–Zod rune only on Hell. The Hell qualifier applies to the
additional rune. No new public action may claim this bonus.

Native settlement supplies the engine's firstKillBonus only for the recorded
original chapter boss, in its configured area/act and terminal ordinary-area
wave, before that difficulty ledger contains the area. Hero survival, won wave,
private receipt authority, publication and rollback remain prerequisites. Find
Item searches, synthetic helpers, endgame/quest encounters, repeats, defeats and
nonterminal waves cannot acquire first-kill eligibility. Existing clear flags
and inventory are persisted together by the ordinary save snapshot.

Reward policy is strict authored JSON injected separately into award pools:
Andariel random unique; Duriel 5% exact Stone of Jordan / 95% random unique;
Mephisto unique armor/weapon; Diablo 3% exact Grandfather / 97% Elite-base unique;
Baal random unique plus Hell-only high rune. Named alternatives are excluded
from the random branch to preserve their exact stated probabilities. Random
uniques retain positive eligible boss-TC base weights and template weights.
Diablo's explicit Elite-base allowlist comes from items-spec §3, rather than
inferring tiers from required level. Existing item materialization keeps actual
ilvl, equip requirements, rolled stats and reviewed socket capacities.

The named-template source conflict is corrected in authored data: explicit
qlvl27 for Stone of Jordan and57 for Grandfather, the lowest current Normal
boss levels, with equip levels29/81 unchanged. No boosted ilvl or rare fallback.
An impossible selected reward refuses the entire bag. Append first-kill rewards
after ordinary rewards, guarantees and optional uniques; preserve those exact
per-call rewards. Future RNG advances intentionally.

Plan: reproduce all five first-kill drops on all three difficulties and named
eligibility failures; implement schema/policy/roller and native settlement;
verify named chance edges, random restrictions, Hell rune, invalid data,
repeat/reload/difficulty/defeat/rollback and complete bag preservation. Run only
affected loot/settlement/save checks, scoped types/lint and isolated production
build/precache/bridge scan. No campaign replay or earned/balance/pacing credit.

Plan review: **ready**. Durable authority, difficulty identity, named drop-level
conflict, finite weighted candidates, no fallback, failed-publication rollback,
Find Item isolation and existing-save behavior are covered. Security check:
**pass**. Local authored rules and existing save fields; no dependencies,
network, permissions, credentials, CI changes or publication.
