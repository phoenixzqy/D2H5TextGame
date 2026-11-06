# P15 — Late Summon Druid Heart allocation

2026-11-04. Allocation component locally complete; full privatev1 active and
incomplete. Previous goal turn was status-only/no progress. Existing owned
human2 registration was revalidated before edits.

[BUG711](../../../production/bugs/BUG-711-druid-late-heart-investment.md) and
[prospective decision](../decisions/P15-druid-late-heart-investment-v1.md) record
the permanent Heart1 gap and late party-damage tradeoff before implementation.
Exactly one target, Heart20 from40, follows Grizzly20/Dire10 and precedes late
Spirit/Oak/Raven investment. All existing targets and other profiles stay exact.
No production coefficient, mechanic, UI or save format changes.

## Verification

The initial test attempt used incorrect expectations for two starter ranks,
level12/24/36 bonus points and already-spent sequential early points. Its log
and test bytes are retained; it is not the valid RED. Corrected pre-edit tests
fail three times on the missing late investment. After the five-line JSON edit,
six selected cases pass (three new cases, two existing Druid growth cases and
the registry/prerequisite case). Scoped strict types and explicit test-file
lint pass. No broad suite, build, earlier-act replay or installation.

Sequential growth retains Heart1 before40 and existing ranks; at40 Grizzly12/
Heart1 reflects earlier native spending. Batched fresh40 has Grizzly20/Dire10/
Heart8. Both reach Heart20 by80, conserving points, experience, reset counters
and other save domains. Native allied projection matches the allocated rank.
Repeated growth is idempotent and never refunds existing investment.

A supplied-XP level56 fixture has the same61 allocated ranks as the actual
level50 earned source, including Heart1/Oak10/Raven6. Selecting the new profile
with zero free points changes nothing. An explicit native town skill reset
refunds61, consumes one of three free reset allowances and costs zero currency.
Reallocation produces Heart20/Grizzly20/Dire10/Spirit6/Oak1/Raven1, with each
vine1 and no Firestorm reinvestment. This illustrates the life/weak-pet tradeoff;
it is a constructed reset test, not an earned reset or viability proof.

Separate Python structural readback verifies the one-target insertion, exact
old targets/all other profiles, byte-identical pre-existing test cases and all
2100 unchanged production files. Actual50/next724 export SHA256 stays
`5308aca886f5a2ea41153babc9de258396472e66cf5c38e2589e6051fe56db7b`.
Root five-axis self-review is not independent design/QA acceptance.

## Custody and scope

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-heart-growth-k00gaj2z`.
It retains original bytes, prospective plan, initial/corrected RED, GREEN,
types/lint results, implementation patch, separate readback and root review.
All five recorded check PIDs are absent; temporary type config is archived as
text and removed. No server or named task cache was created; cleanup passes.
Root retains this packet and human2 through unfinished umbrella review, then
owns their exact cleanup/worktree release.

No earned reset, admission, training, retry, gear/order trial or closed budget
is renewed. A future earned preparation must explicitly consume the actual
reset allowance and export its successor before any separately planned trial.
BUG708 stays open.14ActI/8Normal/formal0of210 unchanged; six builds, economy/
pacing, higher difficulties/endgame, PWA/a11y/performance and independent final
acceptance remain open. No new agents, CI, commit, push or publication.
