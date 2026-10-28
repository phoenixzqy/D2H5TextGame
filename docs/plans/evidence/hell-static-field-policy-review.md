# Hell Static Field policy approval

Accepted narrow D04 amendment,2026-10-27. H1 compatibility was committed as
`4c2035b24495207e3a47191705ea5f53d27d3fc0` before this amendment. Existing D04
explicitly excluded Hell; this new approval selects its missing skill floor.

The exact proposed contract paragraph is now appended unchanged in
[D04](../decisions/D04-static-field-v1.md#native-hell-amendment--2026-10-27), with
[Hell contract](../../design/hell-replay-contract.md) and
[ADR-013](../../decisions/ADR-013-source-backed-hell-replay.md) references.
Hell uses `hellFloorFraction: 0.5`; current-health fraction0.25, Normal0,
Nightmare0.33, H5 mitigation and all learned/cost/cooldown rules remain.
Official provenance: [Arreat Summit](https://classic.battle.net/diablo2exp/skills/sorceress-lightning.shtml#staticfield),
retrieved read-only2026-10-27, states33% Nightmare and50% Hell. External text
supplies numeric provenance only.

Root retains exact shared approval artifacts under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-h2-hell-b6de0n4x/`:

| Artifact | SHA256 | Verdict/scope |
| --- | --- | --- |
| `static-field-policy-proposal.md` | `e6bb6930282f667acbe654df104104e72abd7b7537f1995086ac73c92f6e22bf` | Exact policy paragraph and finite boundary |
| `static-field-design-review.json` | `33bd142aa06a93d4705b6e11f57e7a2a563457aa6e9aa471f1001ffcd091a5dc` | Assigned design-contract owner, GD-DESIGN-REVIEW APPROVE |
| `producer-runtime-review.json` | `900ba2f8a3619b708d597f1b9fed9b8d2cf485f6bb55fcfa872b01d14a117178` | Producer technical boundary APPROVE/securityPASS |

Both reviewers released readers. Root selects and records the exact approved
policy; no user choice or prior Hell fallback is inferred. Root owns these
artifacts through H2 integration, independent review and retention, then removes
the verified disposable originals after retained evidence consumers release.

This records design approval only. Required implementation covers closed
schema/type/authored row, exhaustive three-profile floor dispatch, immutable
combat capture, foreign difficulty refusal and bilingual detail rows. Required
meaningful tests cover above/at/below-floor damage, odd ceiling/1HP, independent
multi-target floors, unchanged mitigation, yielding without payment/cooldown/RNG,
actual current/next/replayed Hell and retained Normal/Nightmare behavior. No code,
data, test, build, browser, gameplay, earned acquisition, balance, pacing or
full-v1 acceptance is established by this document.
