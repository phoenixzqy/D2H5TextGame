# BUG-220 — Berserk ignores the Attack it promises to convert

- Status: reproduced; repair and independent acceptance open.
- Severity: High — advertised weapon/Attack conversion does not exist.
- Owner: root, engine/data/UI; independent design/QA and earned balance open.
- Build: `5d5524b6`, Node24/Vitest1.6.1, native combat; no browser viewport.
- Locales: en/zh-CN both promise Physical-to-Arcane conversion.
- Seeds: 7/19/41/97; legal native L30 ranks1/2/20.

## Reproduction

1. Use Bash1→Stun1→Concentrate1→Berserk at the requested rank.
2. Declare synthetic HP/MP/100Attack Speed, no criticals or target resistance;
   hold the hero after1701ms to isolate its paid1700ms cast.
3. Repeat the same seed with snapshot Attack100 and1100.
4. Compare actual outgoing Arcane HP loss, one attempt and20MP payment.

Expected: converted Attack contributes to the hit; the v1 contract specifies
100%Attack in addition to the existing rank-scaled Arcane base.
Actual before repair: both snapshots deal exactly82/90/234 at seed7 ranks1/2/20.
Changing Attack by1000 has no effect. The registered effect contains only a
fixed Arcane range; no Attack coefficient is authored or forwarded.

Evidence: `src/stores/barbarian-attacks.causal.test.ts` produced three Berserk
REDs alongside three Concentrate REDs; both Stun controls passed (8total).
No synthetic state becomes earned progress; no genuine campaign or remote action.
