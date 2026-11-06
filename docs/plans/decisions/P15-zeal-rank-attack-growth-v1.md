# P15 — Zeal rank-based Attack growth

Type: Tuning of the existing per-rank Attack curve. Authorized private-v1
implementation/balance work; root sole writer. Current skills GDD retains
Physical40–60/+4 per rank,1s,10MP and a three-target cross. BUG534 shows that
capped flat damage hits the later-act Defense floor despite earned Attack342.

Zeal adds `scaling.attackDamagePctPerLevel: 20` percentage points of snapshot
Attack per allocated rank above one, per resolved target. Rank1 adds0%; rank2
adds20%; rank20 adds380%. This uses the same curve as Double Swing/Double Throw
without changing Zeal's single-hit-per-target model. The Attack contribution
joins the existing flat bonus before combo, increased damage, crit, resistance
and ordinary Defense. Rank1 remains unchanged; equipment and existing authorized
Attack buffs now matter at higher ranks. No armor/resistance bypass is introduced.

Schema permits the existing field on Zeal only in addition to the three already
authorized skills, requires its presence on Zeal, and retains finite nonnegative
numeric validation and current eligibility/target rules. Other skills remain
unchanged. Existing registration and current/next/MAX display already consume
this field, including the bilingual additional-Attack stat line.

The20pp value is provisional tuning, not final balance signoff. Its purpose is
to make earned Attack affect the advertised build; later-act/holdout/pacing
acceptance remains open. Do not grant levels/items/points, bypass Defense or
promote restored forecasts to earned saves to make the route pass.

Acceptance: meaningful literal Attack sensitivity at ranks1/2/20 after25%
physical resistance and ordinary Defense; malformed/foreign field rejection;
rank1 compatibility, three original targets, one payment/action, unchanged
registration/cost/CD; pure current/next/MAX additional-Attack previews; retained
Outer Steppes wave before/after and new earned continuation from next310.

Security check: pass. Local JSON/schema tuning uses an existing finite native
damage path; no credentials/network/install/permission/save-version change.
Plan review: ready. Reuse the existing engine/UI consumer, constrain the schema,
preserve exact before-source bytes and bind successor verification to the two
changed production inputs. Existing earned evidence remains historical; only
new Act IV evidence certifies the new tuning. Earlier-act inner-loop checks are
unnecessary because rank1 and unchanged siblings have focused controls.
