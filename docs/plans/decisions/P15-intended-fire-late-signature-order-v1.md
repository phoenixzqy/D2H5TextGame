# Intended Fire: use the learned Meteor and Fire Ball pair

## Decision and scope

BUG-645 identifies a campaign profile rotation defect. Once native Meteor and
Fire Ball ranks are both positive, the intended Fire profile prepares Meteor >
Fire Ball > the other declared skills in their existing order. Before that
boundary, preserve the declared early rotation. Only this profile opts into
`fire-meteor-ball-v1`; player controls and production skill selection remain
unchanged. No skill coefficients, allocations, equipment, resources, companions
or training limits change.

## Retained failure and comparison

At level 51, training ordinal 746 / wave 4 drew at 60 seconds with Izual at
1,595 HP. Meteor20, Fire Wall6 and Blaze1 took every hero turn; Fire Ball20
never cast despite sufficient mana. The default farming fallback then exhausted
River preparation at level 52. This is not a demonstrated production engine
defect.

Exactly one candidate was frozen before outcomes. The original control
reproduces all retained events and final parties exactly. Changing only hero
skill order wins at 19.087 seconds with hero 1,115 HP / 663 mana and no living
enemies. Fire Ball casts eight times and Meteor three times. The control and
candidate consume two battles total; no additional candidate or seed search ran.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-fire-late-signature-order-v1`. Frozen plan SHA256:
`d9637ce48bc0639df46d9d7fddcfd1ba5683dee601bb0fa1016688515283b263`.
Production and campaign inputs remain identical throughout that diagnostic.

## Local regression and limits

Two native-growth cases at levels 24 and 51 fail on the original rotation,
then pass after the correction. All 13 selected Fire cases pass: learned pair
order, real fire damage and 50/20 mana payments, unchanged native save state,
early levels 6/12/18/23, opt-out behavior, sequential/batched growth and existing
signature delivery. Scoped strict TypeScript and explicit four-file lint pass.
The initial test setup used a name longer than the 16-character limit; that
failure is retained separately and corrected before the genuine RED run.
Validation receipts use prefix `p15-fire-signature-policy-v1`.
Final readback passes: all 2,151 production inputs are unchanged, exactly the
four intended campaign files differ, and every recorded child process is absent.
Diagnostic cache and transient type configs are absent. Root retains the
required packet and claimed human2 worktree through umbrella review and owns
their eventual cleanup/release; closure is `p15-fire-signature-policy-v1-closure.json`.

Supplied regression XP establishes allocation and rotation behavior, not earned
acquisition. The comparison establishes one conditional training-wave win,
not an Act IV route clear or population balance acceptance. River's original
200-admission allowance remains exhausted. No earned history, failed attempt,
native successor or cost is replaced; the genuine successor remains level
52 / next 914, native-export SHA256
`9ed14aa46b64542bdd33f66b06d5305f0365dba1964300473a48bdf92d73f56e`.

## Earned continuation — 2026-11-04

The profile correction now has [earned Acts IV–V completion evidence](../evidence/p15-fire-act4-and-act5-completion.md).
From that exact52/next914 successor, two remaining Act IV admissions and five
Act V admissions win46 waves without farming or retry. The saved level53/
next921 result includes all five Act V main claims, Baal's title and Nightmare
unlock. Both frozen accounting readers pass. The original checkpoint and
exhausted training allowance remain unchanged. Intended Normal completions
increase to4/14; independent review and formal balance acceptance remain open.
