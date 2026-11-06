# BUG-486 — Nova Act V training exhausts mana against packed Shamans

- Severity: Medium; maintained campaign preparation fails its recovery bound.
- Status: fixed locally; original native failures retained.
- Environment: WSL, Node24.21.0, human2 b5a0898806bfba369a2d84a1b6c41d0bbb057fce
  plus dirty source; native services, no browser/viewport/locale involved.
- Reproduction: resume the earned Siege checkpoint at46, salvage eligible
  overflow normals, train cleared Foothills with Static/Blizzard/IceBlast.
- Expected: use available paid skills suitable for packed resurrection waves,
  preserving gear, resources, costs, challenge ordinals and every failed attempt.
- Actual: admission1035 clears;1036 draws and1037/1038 defeat at Warped Shaman
  W5. Three consecutive nonwins stop training at46 after166520 actual earned XP.
  Hero mana reaches zero; remaining original Shamans and newly spawned adds live.
- Evidence: p15-nova-act5-earned-suffix-v1 report/journal/exit in retained packet
  d2-counted-source-z3jj3xa1. Export/economy/quest/training audits pass; no later
  Act V quest Start or Claim.11,297 ordinary salvages credit33,891scrap while
  all2,684 protected backpack items,493 stash items and equipped gear persist.
- Suspected cause: inherited boss-focused order lacks the already-paid
  Frost Nova11 area/control spell in the packed Shaman wave.
- Next: inspect only the three actual failed recordings with a small owned-order
  comparison; select a native preference change if it addresses those failures.
  No earlier-act replay, repeated seed study, rank/stat reset or gameplay tuning.

- Verification: Fixed in maintained training policy; three exact failed controls reproduce, Static/Blizzard/Nova wins each. Native359 attempts/351wins/eight nonwins earn55; no seeded acceptance claimed.
