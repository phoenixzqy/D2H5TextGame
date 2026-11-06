# P15 — Pass owned native act to recorded combat

BUG456/2026-10-30(local). Exact ActIV control found generic boss enrage at
15% with proper act4 versus10% on native defaultact1. Snapshot construction
in shared `stageWave` omits run.act; engine intentionally defaults direct
callers toAct1. Fix that shared native construction with `act:run.act`.
No numeric/formula/default-engine/save/data/locale change. New and accepted
next-wave staging/public priority replay all use the same constructor.

TDD: native published snapshot firststage across5acts; next-wave/replay
retain acceptedact despite changed map selection; controlled14%boss produces
exact correct-act standalone events/outcome and earlier15%threshold than10%.
Tests use explicitly constructed highpower/native factories and real recorded
engine, no earned campaign credit. Source changes limited to sharedsnapshot
and meaningful regression. Run RED, minimalfix, focused green/types/lint,
then relevant existing native/engine checks and fresh ActIV rebaseline.

Plan review ready: source-owned context at shared boundary, preserve
standalone default, replay acceptedorigin, no retuning to hide mana deadline.
Security check pass: typed local context only, no extra privileges/dependencies/
network/data publication. Claimed worktree remainsowned; rootsolewriter,
noagents/installs/commits/push/PR/deploy. Current frozen ActIII public V4
PASS40.961s and nativeaudit pass, screenshotsreviewed; browser/processesclosed.
763bundle files/9childdirs/42900422bytes verified and removed exactly; bundle
absent, sharedparent retained. Histories/rawscripts/saves retained for root
umbrellaQA cleanup. CIexcluded/Chromiumworks/ownerplaytestlater. Fullv1open.
