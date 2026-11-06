# Enlistment and Act IV finite side wishes — 2026-11-02

Six more finite side quests grant10 wishes each: the Kashya/Greiz/Asheara/Qual-Kehk mercenary unlocks, Tyrael blessing and Halbu service. This adds60 wishes;8 of22 finite side rows now total80. All24 main rows remain450. The frozen remaining finite budget is10 per row: planned side220 and all finite670 when the other14 publishers are completed. These figures are authored budgets, not earned campaign/economy acceptance.

The five repeatable regional bounties grant zero direct wishes, including first claim. Existing gem-shard rewards remain exact; kill wishes still follow the global selected chance. Drop-tables and enlistment design documents now state this policy and the exact two-field Claim bundles. No bounty/save fields, claim flags or old wallets are changed, and no old claim is compensated.

## Implementation

Town and Warband source publishers reserve the existing finite-currency owner before any store publication, grant wishes before claimed-last, and verify currency at each boundary. Recruitment, source proofs, hero gates, invested actual mercenary instances/gear/progression, dismissal replacement and previous fielding preserve their established contracts. Enlist itself grants no wishes. Tyrael/Halbu use the existing shared numeric/service transaction without changing their two skill points or socket-armor charge.

BUG586 fixes an ordering issue found in review: adding currency restoration after the existing final source check lets a currency-rollback observer change the claim flag afterward. Two cases reproduce this. Currency now restores before the existing scoped source/physical participants and final source checks; wallet verification runs last. Every participant restoration is attempted and errors remain explicit. No compensating write loop or full-wallet snapshot is introduced.

## Verification

Twelve intended missing-reward assertions fail before implementation. Selected13 author/native/policy cases then pass. The first BUG586 harness incorrectly targets markQuestRewardClaimed; these publishers use direct map setState. Correcting that injected boundary produces the genuine state failure in both publishers, and those original byte comparisons pass after the order correction.

727 distinct cases pass incrementally across9 affected suites, excluding filtered/skipped cases. Final99 town/Warband Claim cases rerun after the order correction; the affected service, schema/loader, generic claims, Enlist and bounty cases are retained. The final result is not a single full-suite sweep. Scoped strict types and explicit lint pass without suppressions.

Checks cover single-payment, fresh/retained source claims, dismissal/replacement/fielding, no Enlist income, exact reward drift/accessor refusal, safe headroom, silent/throwing ingress, held debit/quest guards, independent same-wallet additions, source/physical rollback, explicit restoration errors and retry. Removing the six new fields reproduces the entire prior side document exactly by deep equality. Existing main/bounty documents are unchanged.

No completed combat/campaign, earlier-act build route, browser campaign, install, CI, commit or publication is run. Existing browser evidence is retained; no UI implementation changed. All task processes are terminal; the exact temporary type config is archived/removed and the source-audit runner removes its exact task cache. Root retains the external packet's original failures, baselines, logs, receipts and drivers through full-v1/review consumers, and owns eventual cleanup.

## Remaining work

Fourteen finite side publishers still need wishes: Gheed, cow rumor, Fara, Lost Caravan, Drognan, Summoner's Secret, Alkor, Jade Statuette, Ormus, Jamella, Larzuk, Anya, Malah and Nihlathak. Gheed/Fara must settle gems plus wishes inside their existing source transaction while preserving independent additions to each currency.

The retained Javelin campaign did not claim these six rows. Its prospective non-kill arithmetic remains455 (340 claimed-main bonuses +115 for23 Normal clears); historical wallet/earned evidence remain unchanged. Actual L70 Hell faucet, protected inventory pressure, fourteen-build chronological acquisition/fairness/holdouts, retry/manual-idle, calibrated30–50 active hours, integratedG0–G7, soak, review and later owner playtest remain. Accepted balance0; browser works; CI excluded; no pending question or external blocker.
