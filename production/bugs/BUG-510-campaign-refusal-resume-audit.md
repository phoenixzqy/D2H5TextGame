# BUG-510 — Audit resumed no-op quest refusals without losing history

Status: fixed locally, uncommitted; targeted and native continuation verified. Severity: Medium; verification continuation blocked.
Owner: root / qa-engineer. Environment: WSL, Node24;
feat/playable-foundations, base b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
Browser/locale/viewport: not applicable to deterministic campaign accounting.

Reproduction:
1. Retain Throw35/120991XP/next883/36actions from
   p15-barbarian-double-throw-izual-continuation-v2.json in the root packet.
2. Its terminal action36 is Fallen Angel Claim/not-completed; its before and
   after quest/point/campaign observations are identical. BUG509 caused the
   missing proof, and its game-source correction is now verified separately.
3. Resume from that exact save with a new accepted victory and a successful
   claim. Keep the refused action in the full historical journal.
4. auditCampaignQuests requires every failure to be terminal, indexes the route
   by raw entry count and requires every earlier-act entry to be successful.
   It rejects valid resumed history and later Act V boundaries.

Expected: no-op refusals stay in history without consuming the intended route
step. A retry of that same step may succeed after new native proof. All raw
settlement indices and their continuity remain authoritative; success grants,
claimed sources, thrown partial commits and malformed evidence remain checked.
Actual: valid resumed accounting is impossible unless the refusal is erased or
the audit is bypassed. Neither is acceptable.

Root cause: one raw journal index serves both attempted-action chronology and
successful-route position. Separate those concepts in the shared auditor.
Keep thrown exceptions terminal because they can retain partial commitments.

Security check: pass. Local verification accounting only. Preserve every raw
entry/event and verify refusal before==after. Do not waive identity, point,
receipt, material/economy or quest order checks. No proof injection, CI change,
credentials, installs, external writes, publication or deployment.

Fix and validation: tests/campaign/quest-audit.ts now distinguishes successful
route positions from raw attempt chronology. Refusals require exact unchanged
before/after state and the expected same route action; partial thrown entries
remain terminal. Raw settlement indices retain chronology and authority.
The new quest-refusal-resume.regression.test.ts passes all10cases, including
actual refused-claim/retry lineage and negative graph/order/point/index cases.
Retained first green run:73/77pass; the4failures were stale optional Act V
fixture observations (BUG511). Only that8-case fixture file was corrected
and rerun, passing8/8. Reused unaffected69cases yield77/77 affected coverage.
Scoped strict types/lint pass. No earlier-act or completed campaign replay.

Native acceptance: p15-barbarian-double-throw-izual-proof-v1.json resumes all36
historical actions, retains the original no-op refusal, earns new original
Izual proof, Claims Fallen Angel and completes Hellforge. Full inline quest
audit passes with resumedRefusals1, izualProofs1 and hephastoProofs1; exact
economy/export audits pass. Ends35/221361XP/next886/45actions on Chaos W6
defeat, preserving every partial reward. No audit bypass or rewritten history.
