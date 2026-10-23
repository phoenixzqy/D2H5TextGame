# D04/D07 — Full resources at new challenge entry

GD-DESIGN-REVIEW: APPROVE. TD-CONTRACT-REVIEW: APPROVE.
Producer plan-review: ready. Security check: pass. 2026-10-22; BUG088.

`docs/design/combat-formulas.md` §10.1 controls each new manual or idle
challenge: hero and fielded mercenary start at full HP/MP using their current
authoritative level/core/equipment maxima. This happens before startup costs
and recording. New challenges reset transient recovery carry to zero.

The hero currently enters with saved pools, while the mercenary enters full.
Correct only newly built hero runtime `life`/`mana` in `startSubAreaRun`.
Keep the default adapter and its historical nested `stats.life/mana` metadata
unchanged; runtime pools govern combat and resource bars. Nested parity was
an unnecessary proposal constraint, withdrawn by TD after producer review.

D04 timing preserves actual resources between waves. D05 Warmth/Meditation
prohibit configuration changes, replay, playback or wall time from refilling
an ongoing challenge. Those rules do not supersede fresh entry. Do not persist
entry healing or battle output, change saves, refill each wave or replay, alter
startup payments, or weaken transition/receipt/settlement guards. Failed staging
and publication recovery retain their existing atomicity and replay authority.

QA accepts controlled first-wave snapshot fixtures passed to real staging for
unrelated recovery coverage; their exact recovery/carry assertions must remain.
The new entry regression uses real production entry without that wrapper.
Five genuine RED cases reproduce depleted/zero/negative pools; two adapter/carry
controls pass. Raw evidence is retained under the challenge-entry evidence root.

After final validation, run the original earned L12 route once: input SHA
`8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`,
seed2223645302, ordinals102–106, Blood Moor→Cold Plains→Burial Grounds→Dark
Wood→Catacombs. Preserve Frost Nova/Ice Blast, mercenary configuration and the
already declared real transfer of `it-7is2r-10i`. No additional farming, point
spending, gear search, respec, resource command or retry; stop first nonwin.
Automatic production entry filling is the intended change. Report actual
awards and carry. No C/G/campaign acceptance follows from this correction alone.
