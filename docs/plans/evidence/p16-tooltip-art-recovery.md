# P05/P16 — Item-tooltip artwork recovery

2026-11-04; BUG707 locally fixed. Human2, `feat/playable-foundations`, HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited edits. Previous
goal turn was status-only/no progress.

An unchanged earned Leaf exposes a remaining integration gap: ItemTooltip's
bare image stays broken with naturalWidth0 and only one request after actual
browser offline→online restoration. It now reuses GameImage's source-keyed
fallback/reconnect handling. Authored source,80px frame, contain fitting and
item details are preserved; no new polling, cache busting or contract changes.

One regression fails before the production edit; all12affected tooltip tests,
two-file lint and scoped strict types pass. Unchanged shared-image tests and
completed-act checks are not repeated. The original fixture lacked weaponType;
its failure is retained separately from the corrected legitimate RED.

Four installed-Chromium147 cases (zh-CN/en,360×640/1280×800) each verify fallback,
a failed reconnect retry, then successful same-URL recovery. Each makes three
requests with two deliberately disconnected failures. Waiting/reconnecting
after success adds none; healthy/recovered nodes remain mounted. Earned fixture
and details stay exact; fitting remains contain/78×78 inside the frame, without
overflow/page errors. Deliberate aborts are the only console/resource errors.
Mobile fallback and English recovered screenshots were visually inspected.

The first harness launched from its temporary directory, preventing Tailwind
from finding the project theme. That observer failure is retained; launching
from repository CWD corrects it without changing project configuration.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-tooltip-recovery-ah2ykrm1`.
It retains source snapshots/diffs, provenance, raw checks, observer failures,
scripts, screenshots and reports. Source closure SHA256:
`e13b7f80377540fafe4b13c36aec85a0676cf9e53b06a2471162e972ebcce8a0`.
Browser report SHA256:
`e11359149811319fa61afe4e52ee1f58791a11cc04b98edb2dfed0f141fdd596`.
All20recorded PIDs and seven disposable profile/cache/config/tmp paths are
absent; cleanup failures/disposables empty. Root retains required evidence and
human2 through umbrella review, then owns exact cleanup/release. Shared caches
are preserved.

This is implementer/source-browser evidence, not production-service-worker or
independent whole-app acceptance. No gameplay, crafting, farming, import/save
lifecycle, build/broad suite, agent, install, commit, push or publication.
Counts14ActI/8Normal/formal0of210unchanged; full privatev1 active/incomplete.
Six build routes and broader acquisition/economy/pacing/difficulty/app/final
acceptance remain open. Closed trials stay closed; extended human playtesting
follows implementation as requested.
