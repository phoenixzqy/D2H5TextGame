# P15 — Current32 fresh Act I corrected measurements

Status: both cases completed technically; independent evidence review APPROVE.
Neither policy cleared Act I. No gameplay or numeric changes follow
automatically from these descriptive results.

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Freeze: `p15-current32-screen-before-v4.json`,3007 exact source/tool inputs;
reviewed BUG398/400/401 corrections and gzip reader. Both cases ran once in fresh
processes, sequentially, with unchanged policy/clock/route/bounds. No protected
character/save was read or advanced.

| Profile | Native terminal | Played/won | Actual earned XP/items | Combat minutes | Actual equips/capacity refusals |
| --- | --- | --- | --- | --- | --- |
| Cold Sorceress | L12, Catacombs W5 draw |309/308|168580/2996|78.174|21/11|
| Fire Sorceress | L12, Cold Plains W3 draw |294/293|150160/2858|107.943|13/11|

Each draw lasts60000native ms and grants zero failed-wave rewards. Cold retains
156life/272mana, observed mana minimum259, with12enemies alive. Fire retains
242life/187mana, observed minimum187, with one47life enemy alive. Neither hero
died or exhausted mana in its terminal wave. These policies fail to finish the
encounter within the timer; this does not establish a general class defect.
Both claimed actual Den500XP, already included above. Native combat minutes
exclude player decisions and do not validate30–50active hours.

Root's reviewed terminal readers exit0 and agree on source/campaign stability,
installed tools, checkpoint/export, actual wave rewards, economy totals, ordinal
order, first-nonwin stop and ranked native gear attempts/refusals. Journal sizes:
cold7132979compressed/275737694raw bytes;
fire6696495compressed/255553579raw bytes. Lossless records now fit the unchanged
190MiB physical cap. Root wrapper durations132.960s and81.416s are execution
times, not game hours.

Evidence: per-case `p15-current32-act1-{cold,fire}-v4/` reports/gzip journals/logs/
execution/process identities; root run and audit exit receipts;
`p15-current32-{cold,fire}-terminal-review-v4.json`;
`p15-current32-pair-closure-v4.json`. Independent reviewer verified every3007live
pin and both report manifests before releasing the source lock for the next
harness card. `p15-current32-independent-review-v4.md` independently reconstructs
every item payload, ownership/backpack order, equipment, XP, material/currency
delta and complete failed-wave state. All recorded case PIDs are absent; no
unhandled/worker/fatal error channel was found. Evidence consumers have released.

All original v1/v2/v3 failures remain retained. Original cold-v3 economyAudit
remains null; fire-v2/v3 remain unexecuted. No rerun/replacement, cohort/holdout,
earned14-build/five-act/retry/pacing/full-v1 acceptance is claimed. CI remains
excluded; owner playtest follows implementation. Root retains the packet through
umbrella acceptance; no campaign processes remain running.
