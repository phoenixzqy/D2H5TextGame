# Shared intended Act II owned defense v1

Status: implementation candidate; earned viability and balance remain open.

Use the existing `act2-owned-v1` survival and `stash-room-v1` retrieval policies
for all fourteen intended profiles. Keep the existing fixed mixed Act II probes,
two-pass armor/jewelry selection, stage-entry attack/attack-speed floors and
150-Mana reserve (bounded by entry capacity). Keep weapons, offhands and charms
with the existing build policy. No target-specific lightning weights, grants,
healing, crafting, currency spend or additional retries.

The retained Prayer continuation ends after three Dry Hills defeats at level20.
Every loss enters with490Life/286Mana and17lightning resistance. Recorded
lightning damage483/513/441 dominates; minimum Mana266 excludes starvation in
these waves. An equipment-only native diagnostic from the retained terminal
save applies the unchanged mixed probes: hero lightning17→37, merc29→46,
attack/speed retained, zero XP or items created. Hero Life capacity490→470 and
Mana286→277 are explicit tradeoffs; current Life/Mana remain unchanged. This
supports a common defensive selection candidate, not an earned win claim.
The lightning-only diagnostic is retained solely for comparison and is not the
chosen policy.

The shared selector must exclude the active hero's reserved Iron Golem item
for both hero and companion, as the existing owned selector already does.
Native ownership transfers, eligibility and backpack-capacity safeguards remain
authoritative. Historical profiles retain their fields, and intended Act I or
post-Act II equipment behavior remains unchanged.

Plan review: ready after adding reserved-item protection to the shared survival
selector and testing actual native equipment/custody at act boundaries. Reuse
the existing policy rather than adding a second optimizer or tuning monster
stats to the failed seed. Security check: pass for authorized local campaign
policy work; no network, dependency, credentials, CI or publication changes.
Run affected policy cases and scoped types/lint only. Do not replay combat or
extend exhausted histories for this increment.
