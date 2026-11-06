# BUG-484 — Use an earned Act V training area with sufficient XP

- Severity: Medium; maintained campaign preparation/verification efficiency.
- Status: fixed locally; native preparation verified, fresh integration pending.
- Environment: WSL/Node24.21.0, human2 HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce
  plus current changes. Native services; no browser/viewport/locale involved.
- Reproduction: restore the earned Chaos768/Act IV Claim save at40; the maintained
  pre-Act V request trains Plains to55 with maximum600 admissions.
- Expected: bounded earned preparation reaches55 and continues the main quests,
  without unnecessary earlier-act replay or changes to XP/enemy data.
- Actual: first Plains admission yields23160XP against22879557 required;265
  complete native wins earn7360000XP and reach46. Initial and observed-average
  projections exceed600 admissions. Run stopped deliberately through its task
  wall guard; this is not natural budget exhaustion. All earned state, native
  export/economy/quest/point/training audits are retained; no Act V credit yet.
- Evidence: packet `d2-counted-source-z3jj3xa1`, Act V checkpoint-continuation-v1
  report/journal/exit and explicit efficiency-stop/graceful-stop records.
- Root cause: the preparation request chooses lower-XP Plains before Act V,
  although prior earned evidence supports Foothills with stronger XP yield.
- Recovery evidence: next actual1034 Foothills clears six waves at46, yields
  51800XP, Claims Siege and retains all inherited state/audits in11.371s.
- Fix: maintained Nova main-quest route prepares to55 after actual Siege Claim
  in already-cleared Foothills. Keep600 admissions/3 consecutive/10 total nonwins,
  existing outer limits and all losses/costs. Generic earlier contracts stay
  explicit. Continue from the earned Siege save rather than repeat preparation.

- Verification: Maintained after-Siege Foothills request implemented; native359 admissions earn55 within declared bounds. Final fresh integration remains pending.
