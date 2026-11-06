# P15 — Fire Druid late-boss Fissure growth candidate

BUG-538 reproduces the cap-throughput failure with earned source35/356231/next427.
The180 coefficient from BUG-537 was provisional. Diablo75%fire/460flat armor
leaves a surviving capped caster unable to beat60s. Owned crit gear and a
prospective maximum Mastery projection still draw; no projected rewards are earned.

Screen one numeric candidate: Fissure damagePerLevel180→400. Rank1 stays60–90;
rank20 becomes7660–7690. No boss-specific exception, global damage change,
resource/cooldown/target/Burn change, XP grant or save migration.

Root owns only druid.json and the related combat/UI expectations, this decision
and bug report. Preserve exact before-images. Add a RED cap-hit regression at
Diablo defenses, then compare native and next-entry boss plus density inputs on
32 fixed tuning seeds each. Native baseline events/pools/time must reproduce
before editing; after must use the identical frozen inputs. Retain every outcome.
Apply only after the baseline and RED pass as evidence. Verify current schema,
combat/Burn/negative/resource tests and bilingual previews, then bind the exact
source transition. Qualify the entire unfinished Chaos area before native retry.
Earlier earned state, paid sockets, losses, Forge and seals remain intact.

Plan review: ready for bounded tuning; existing nonlinear mitigation and late
resistance are preserved. Earlier ranks and cross-build fairness may shift;
all29-area/identity/holdout/fairness/pacing gates remain open. No campaign replay,
full-suite rerun or ship approval is implied by this screen. Required packet
artifacts stay root-owned through umbrella acceptance; disposable configs/caches
are removed after their checks. No agents, install, commit, push or publication.

Security check: pass; authorized local numeric data/tests and evidence only;
no networking, credentials, permissions, CI or persistence behavior changes.
