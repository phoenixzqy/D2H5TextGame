# D04 — Concentrate's missing paid defense

2026-10-25; [BUG219](../../../production/bugs/BUG-219-concentrate-missing-defense.md).
Root author investigation; independent review/design and earned balance open.

Twelve actual native L30 rank1/2/20 ×seed7/19/41/97 cases legally compose
Bash/Stun/Concentrate. Synthetic million-HP/100MP/100Defense/100Attack Speed
and a post-first-action hold isolate one paid cast at1700ms and incoming
200Attack hits from2000ms. Every case pays10MP, grants no personal defensive
capability, and takes100HP from each positive enemy hit, equal to a basic-first
control's landed damage. Defense remains100; only the authored Physical damage
effect is registered. Input/replay equality is checked.

Do not claim identical entire hit schedules:9/12dodge schedules differ because
the first actions use different RNG draw patterns. `concentrate-normalized.json`
retains per-landed-hit observations separately. No defensive potency/duration is
invented from the brief old description. The final assertion intentionally exits1
after all12complete observations are written. No repair or skill credit.

[Frenzy raw packet](fixtures/frenzy/raw.tar.gz) retains `concentrate-repro.ts`,
`concentrate-observations.json`, `concentrate-normalized.json`, and
`next-concentrate` command/log/live/terminal receipts. Source basef208b176 plus
the frozen Frenzy/BUG217/BUG218 changes; Concentrate unchanged. No genuine
campaign or remote action; Ancients/Rite L33/next402/Baal uncleared preserved.
