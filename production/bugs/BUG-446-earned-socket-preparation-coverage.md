# BUG-446 — Exercise earned socket resources before balance conclusions

Status: native socket preparation verified; insufficient for Lost City.
Severity: Medium (QA policy limitation; no product defect inferred).
Build: b5a0898 plus local private-v1 work and BUG440.
Environment: WSL/Node24.21.0 production paths, locale/viewport independent.
Affected systems: earned campaign diagnostics/equipment/material economy; root.

1. Run Static-v2 or its exact-prefix bounded-entry/Vitality continuations.
2. At the genuine201-admission/761-wave stop, inspect inventory materials and
   equipped socket capacity. Five normal diamonds and six normal rubies remain
   unused. Chest has2empty sockets, boots2, head1 and gloves1.
3. LostCity fails even after native stat reset: L20 W1, L21/L22 W3. Hero MR0.

Expected: evaluate legal earned gem insertion and account its complete costs/
item transformations before concluding existing gear cannot support progression.
Actual: current diagnostic discards nonshortlisted normals and never sockets
the retained gear. Normal diamonds add6flatMR in armor; normal rubies add30HP.
These are already earned resources, not hypothetical drops or imported power.

Evidence: `p15-earned-nova-focus-act2-static-v2.json`, Vitality-v1 journal/report,
`src/data/items/gem-effects.json`, actual equipment/item/material payloads.
Existing strict audit intentionally requires unchanged item payloads and no
material spending. Keep it unchanged: add a separate exact transformation/debit
audit and normalize only verified transformations for the original conservation
check. No broad ID/payload stripping or unexplained sink exception.

Native `p15-earned-nova-focus-act2-sockets-v1` technical PASS221.395s.
All6native insertions and4transformed IDs independently reconcile; two normal
rubies/four normal diamonds consumed, HP607→667/MR0→24, no other derived stat
change. Exact201-admission/761-wave/full-export prefix and native Vitality reset
retained. Still fails LostCity ord201W1/224W3/249W3; later W3 survives16.400/
13.000s versus9.300/5.600s Vitality-only. 998waves/989wins/9nonwins; 9581earned
items equal exact terminal ownership plus9304explicit normal discards after
verified socket/debit reconciliation. Source/quest/point/save/economy audits pass.
Independent `p15-socket-transformation-audit-v1.json` verifies every action,
receipt, complete inventory delta, derived stats and final upgraded payloads.
Seven actual waves: `p15-lost-city-socket-frozen-waves-v1.json`. No descendants
or private cache remain. No production balance or full campaign acceptance.

Next small screen combines only Nova-before-Static priority with these actual
socketed inputs. The earlier unprepared priority-only rejection remains valid.
Retain ranks/resources/enemies/timing/RNG, reproduce all7actual waves plus5earned
Oasis waves exactly, then16fixed seeds and original seed on each failed input
and the Oasis boss control. No native adoption unless this screen supports it.
