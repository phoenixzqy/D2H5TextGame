# BUG-512 — End diagnostic combat before restoring the next comparison

Status: fixed in the task-owned driver; verified. Severity: Low (QA driver only).
Owner: root. Environment: WSL / Node24 / existing human-worktree-2.

Reproduction: next-chaos-policy-run-v1 evaluates the owned jade amulet across
six waves, then calls restoreEarnedSave for the next candidate after only
abortSubAreaRun. Its retained log rejects this with Earned restore requires
quiescent service stores. Native admission leaves combatStore.inCombat true;
abortSubAreaRun deliberately clears lifecycle/recording ownership only.

Expected: abandon the diagnostic run, then use returnCampaignToMap to end combat
before restoring another candidate. Actual: first candidate rows are retained;
two remaining options are untested. No native settlement, rewards or saved
progress changed. Root cause: driver omitted the production terminal Return step.

Correction: new immutable v2 driver runs only the two untested options, calls
abortSubAreaRun and returnCampaignToMap before each restore, and retains the
original v1 bytes/log/rows. Existing restore guard remains unchanged.
Validation: corrected v2 completes both previously untested comparisons with exit0,
all stores restored and no descendants/cache retained. Scoped strict types/lint
pass. Later v3/v4 comparisons and the native Chaos continuation also finish
without this error. The first six failed candidate rows remain in v1; they
were not rerun by v2. No production guard or game behavior changed.
Security: local diagnostics only; no external publication, grants or audit bypass.
