# BUG-074 — Recheck the acknowledged sacrifice instance when arming

- **Status:** Corrected locally; independent revised review and commit pending.
- **Severity:** Medium — stale acknowledgement can authorize a changed instance after a failed subscriber notification; selecting and acknowledging again is a workaround. Arming itself does not consume an item.
- **Owner / affected systems:** frontend-dev; IronGolemPanel local acknowledgement and guarded selection adapter.
- **Build:** parent `4f725440a266518026017a15c99477ba711427c0`, uncommitted standalone panel frozen by iron-panel-review.json SHA486056ff5bd810fa6deca69dbb5db82f4f6690112dc6871aae851cc9492e03fa.
- **Environment:** Linux, Vitest1.6.1/jsdom mounted React18 component; en. No browser viewport/layout claim. No combat or RNG seed applies.

## Reproduction

1. Register an inventory subscriber before mounting the panel; make it throw on notification.
2. Mount a configured Necromancer, choose the Short Sword instance and acknowledge its permanent sacrifice.
3. Replace the backpack item with a distinct same-ID instance (attack99), catching the earlier subscriber exception. The write succeeds but the panel's subscriber is not reached.
4. Confirm the displayed acknowledgement remains checked and Arm remains enabled; click Arm.

## Expected and actual

Expected: action-time live item identity must match the exact acknowledged
instance. Refuse arming, announce that acknowledgement is required, reread live
state and require a new acknowledgement. Retain item, mana and other authority.
Actual: the render-time acknowledgement boolean reaches the guarded adapter;
that adapter resolves the replacement by ID and arms it without fresh consent.
The causal regression fails because selection becomes `{heroId:'panel-hero',
itemId:'chosen'}` instead of null;35 existing controls pass.

## Evidence and root cause

Retained root-owned packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les`.
`commands/iron-panel-stale-ack-red/{command.json,output.log,source/}` preserves
exact pre-fix sources, command and failure:1failed/35passed,12.130s wrapper,
10.93s Vitest. Independent TD/five-axis and QA v1au reviews returned CONCERNS.
The original frozen manifest and all earlier RED/GREEN results are retained.

The component captures a boolean from the last render. Ownership and eligibility
are reread inside the shared API, but a boolean does not bind consent to an
instance. Recheck the live draft reference at click time, then let the shared API
preserve guard and acknowledgement error ordering. No payment or save change.

## Resolution and regression

Arm rereads the live draft and requires the exact acknowledged item reference
before calling the existing guarded adapter. The causal regression now passes;
final serial types/lint/full7251tests/production build pass. Commit identity
will be recorded after independent publication review. Regression:
`src/features/skills/IronGolemPanel.test.tsx` — “refuses stale acknowledgement
after a same-ID replacement skips the mounted subscriber”. It also requires
live unchecked/disabled state, no payment and successful explicit reacknowledgement.
Native browser/save/earned acceptance remains separate.
