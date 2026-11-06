# Restore-write serializer worker rejected — 2026-11-03

The serializer-only worker for validated startup/import persistence is rejected.
Matched production desktop reload median increases from 563.399883 to 897.817316
ms (59.36% slower), exceeding the frozen 10% regression limit. Desktop import
also slows. No timing retry or completed mobile baseline/comparison follows.
This produces no retained application improvement and does not close BUG592.

The 214 affected unit cases pass on the candidate. Initial scoped types/lint
fail on candidate test readonly/non-null and unknown rejection handling; those
failures were not repaired after the measured rejection. Do not attribute these
candidate checks to the restored source or call the browser round complete.

An early stop of the exact owned Chromium process rejected an outstanding
download promise; the driver exited1 before its final report and finally block.
Its final production JSON report does not exist. Retained raw measurements and
limits are recorded in the closure, alongside source hashes, archived rejected
files, emitted assets and process/disposable cleanup verification.

Four modified source/test paths match their exact preimages. Five new worker/
serializer/test paths were archived and removed. Both recorded processes and
six exact task-owned config/build/cache paths are verified absent. No broad
browser-internal temporary-directory cleanup is claimed. Required evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files: `bug592-restore-write-worker-v1-{plan,affected,early-stop,closure}.json`
and `bug592-restore-write-worker-v1-production.mjs`. Root retains this evidence
and the claimed human2 worktree through umbrella review and owns eventual cleanup.

No campaign advancement: 14 individual intended Act I clears, three five-act
Normal completions and formal balance0/210 remain. Browser works; CI excluded;
no pending owner answer or external blocker. Next inspect retained late-act
failures for a demonstrated gameplay progression/mechanics defect, without
replaying exhausted routes or more speculative serialization experiments.
