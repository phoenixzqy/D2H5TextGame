# D06 — Blood Golem missing life-leech aura

2026-10-26; BUG250; baseline`de803c76`; root author diagnosis only.
[Bug](../../../production/bugs/BUG-250-apply-blood-golem-life-leech.md),
[provisional complete repair contract](../decisions/D06-blood-golem-v1.md).
No production fix or skill credit yet.

Original native rank1/2/20 preparations each actually pay25MP at time0 and create
one unchanged native body. The injured synthetic owner and body both deal
positive ordinary damage; real enemy attacks injure the body, and the million-HP
target survives so no kill/orb recovery can mask the result. Both friendly damage
sources receive zero healing. All setup/payment/damage/injury/target-survival/
input-immutability assertions pass; only required positive recovery fails.
Unlearned and poor24MP controls pass without body/payment/healing.

Terminal RED:3failed/two passed,exit1,7.076s; command
`node_modules/.bin/vitest run src/stores/necromancer-blood-golem.causal.test.ts`,
logSHA256`b9ab7e7e209938fc32aed63a841f31a10dac02bc897003d58f6fea7c27b0f485`.
Node24.21.0/Vitest1.6.1/linux-x64,seed7,actual native L30 prerequisites/ranks.
Browser/viewport independent; both locales retain the10% life-leech promise.

The original broad positive-heal oracle diagnoses total absence, not complete
percentage/beneficiary/damage-kind/authority behavior. The contract requires exact
literal and negative counterexamples before credit. In particular, a fixed body
heal or direct-hit-only shortcut would not establish the stated aura.

Root owns active packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-golem-bogayo0q`
through full validation, retention and exact cleanup. Original test bytes/source
hash/terminal log and receipt/task ownership are retained. The reproduction is
currently an uncommitted failing test for the next production repair; no failing
regression has been hidden, skipped or committed as a passing implementation.
All started validation handles are terminal. No build/dist or browser server.

Inventory remains160bounded/51unverified/one engine-only/one review-needed,
Necromancer18/32. Completed Fire Golem source`2fe4de9a`/closure`de803c76` retains its
separate validated evidence. No genuine campaign/replay or remote action. Other
summons, independent/earned acceptance and full C2-C4/G0-G7/privatev1 remain open.
