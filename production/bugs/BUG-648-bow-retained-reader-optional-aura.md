# BUG-648 — Preserve absent optional aura fields in Bow retained readers

- Severity: Low
- Status: Fixed locally in retained V2 reader; no commit or gameplay change
- Owner: Root / QA evidence tooling
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, current uncommitted private-v1 worktree
- Environment: WSL, installed Python 3; browser/viewport/locale not applicable to this offline reader
- Seed: Not applicable; reproduction executes no engine or combat

## Reproduction

1. Read the verified `p15-bow-earned-act2-v1.native-export.json` from the retained
   root packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
2. Evaluate `save['player']['selectedAuraId'] is None`.
3. The first frozen Act III V1 reader fails at the same expression, line 75.

Expected: The reader accepts Bow's canonical absence of a selected aura and
preserves that absence in the successor. Present `null` is not a canonical aura.

Actual: `KeyError: 'selectedAuraId'` stops accounting before journal processing.
Both parent and successor omit the field. The native run completed Act III;
this verifier failure changes no gameplay result or earned save.

## Cause and evidence

The Paladin reader adaptation changed the expected class/aura value but retained
mandatory key indexing. The save contract makes the property optional and permits
only canonical IDs when present (`src/engine/save/validate.ts:279`).
The installed V1 reader, failed readback log/exit receipt, and both native exports
remain under packet prefix `p15-bow-earned-act3-v1`.

## Correction boundary

Retain V1 and its failed receipt unchanged. Before executing V2, record the exact
amendment and file identities. Require field absence in both parent and successor,
retain every other accounting assertion, and read the same native output once.
No combat replay, renewed attempt, source/profile change or formal acceptance.

## Verification

The exact original-parent expression reproduces the KeyError. Frozen V2 requires
the property to be absent in both exports and passes all 1,303 retained waves,
11 quest actions, ordered custody/economy/points, party continuity and nine negative
admission controls. The original V1 reader and failed receipt remain unchanged.
Exact amended reader, amendment, successful receipt and closure:
`p15-bow-earned-act3-v1-readback-v2.py`, `-reader-amendment-v2.json`,
`-readback-v2-exit.json`, `-closure.json` in the same root packet.
