# ORMU-17 — Transport authority through ordinary wave receipts

Status: implemented and independently reviewed; integrated feature acceptance open.
Depends on native staging. Scope: combatHelpers.ts, recordedWaveReceipt.ts and
ormus-native.test.ts.

Issue before initial staging using the captured seed/challenge ordinal/fallback.
Pass the candidate into staging; transport only its exact witness into receipts.
Reject copied tokens before preparation. Explicit replay permanently disqualifies
the run after replay admission and before locked reuse or unlocked restaging,
including staging failure. Idle, claimed and other-area runs receive no witness.

QA: wiring RED preceded source changes. Initial locked-replay fixture omitted its
required Blood Golem prerequisite; that setup failure is excluded from causal
evidence and corrected without weakening assertions. Wiring8/native cases and
existing receipt120/staging26 controls pass. Producer source review APPROVE. No
proof is granted by installation or playback alone.
