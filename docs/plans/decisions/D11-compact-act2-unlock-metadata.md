# D11 — Compact Act II unlock metadata

Accepted 2026-10-23 after producer plan review READY/security PASS.
Source base `9a4999f`; resolves the Canyon metadata deferred by the Staff contract.

The compact map contains exactly six Act II areas. It has no Canyon of the Magi.
Set Horadric Staff and Arcane Sanctuary `unlocks` to schema-supported null.
Replacing the absent Canyon with Tal Rasha's tomb would still advertise an
access transition that does not occur.

Staff assembly provides the Staff for explicit insertion inside the tomb.
Horazon's journal identifies the true tomb in the story. Neither quest unlocks
another map area. All six authored areas remain accessible once Act II unlocks.
Seven Tombs retains `acts/act3`; Act III still requires completed Seven Tombs
OR canonical Tal Rasha tomb clear, without requiring reward Claim.

Keep existing copy, objectives, rewards, ordering, runtime predicates, saves
and balance. No new area, prerequisite, implicit clear or travel behavior is
part of this correction. The stale field currently has no runtime consumer;
no observed gameplay softlock is claimed.

Regression checks both exact null values, the unchanged six canonical areas,
real objective references plus any area unlock references, and the retained
Seven Tombs act reference. Existing map/object/Staff tests protect behavior.
