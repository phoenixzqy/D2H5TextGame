# P15 intended build growth v1

Status: implementation candidate; acquisition, role power and populations remain open.

This small addition implements the fourteen identities in
`P15-intended-build-identities-v1.json`. Historical campaign IDs and outcomes
remain unchanged. New IDs end in `-intended-v1`; all numerical allocation
targets live in `tests/campaign/intended-growth-v1.json`.

The existing native allocator is sufficient. Each ordered target includes a
minimum hero level. Prerequisite purchases precede dependent purchases; unlock
and support purchases precede repeat investment. Future targets wait for their
level while currently available targets can spend points. New signature skills
therefore receive points before early-game filler at their unlock boundary.
Ranks already earned are retained, including native starter grants. Allocation
never resets a character, grants points, changes equipment or pays a quest.
Unspendable points stay held. Five earned stat points follow each profile's
declared distribution. The native combat projection filters unavailable skills.

The new profiles use native owned-item comparison and the existing monotone
mercenary upgrade policy. Bow retains its bow fallback. A complete attainable
weapon, stash, companion, training, funding and role-specific rotation policy
still has to be fixed before any new population or holdout evaluation. These
growth targets are not proof that the required weapons or levels are reachable.

Acceptance for this increment:

- All fourteen new IDs are callable by the existing campaign request boundary.
- Native sequential allocation through level 50 learns the stated signatures,
  later spell/summon prerequisites and masteries without allocation refusals.
- Every purchase conserves the available skill/stat budget; ranks are monotone,
  repeated preparation is idempotent and earned non-player domains are exact.
- Same-class profiles invest in different signatures and project their learned
  active signatures at an eligible level.
- A batch of earned levels also prepares successfully, with no free reset.
- Historical profile bodies and production game data remain unchanged.

Validation uses supplied-XP fixtures solely to exercise real allocation; it is
not fresh earned-route, casting, damage, survival, pacing or balance evidence.
Run only the new allocation cases and directly affected existing profile/action
regressions, with scoped strict types and lint. No old campaign replay.

Plan review: ready. Avoiding a second staged allocator removes duplicate level
and prerequisite logic. Future unlocks must precede filler, and both sequential
and batched level grants must be tested. No external dependency or installation
is needed. Security check: pass for authorized local evaluation code/config;
no credential, network, publication or permission changes.
