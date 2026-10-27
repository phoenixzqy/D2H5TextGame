# D06 — Dragon Flight implementation evidence

Status: local foundation/runtime validated; complete Flight and full private-v1 acceptance open.
Contract: [D06 Flight](../decisions/D06-assassin-flight-v1.md). Bug: [BUG310](../../../production/bugs/BUG-310-implement-dragon-flight-blink.md).

The original native reproduction has three failed blink observations at ranks1/2/20
and one passing paid Physical-kick control, seed7. Expanded pre-runtime branch
reproduction has21 failures/nine controls. These are behavioral REDs; the initial
missing-definition collection error is not counted as a behavioral failure.

Foundation e76ad891 validates closed JSON/schema tuning and immutable rank/display
helpers (23 cases). Runtime ea3ba9c3 adds one private, paid, half-open1s blink,
+1percentage point magical dodge per effective paid rank, at the same15MP payment
as the unchanged Physical kick. Native prerequisites/full registration and committed
shadow authority are required. Visible imported markers grant no power. Both CD
aliases, source/owner life, source side and exact expiry are enforced. No movement,
extra RNG, save shape or earned campaign change is introduced.

The33 native cases prove actual seeded Fire dodge versus same-roll scalar controls,
unchanged Physical/Thorns and periodic HP settlement, exact2700ms expiry, invalid
sources/resources/cooldowns/registration rejection, marker stripping, missed-kick
payment and actual three-charge Tiger discharge through a paid Flight kick.

[Exact receipts and hashes](fixtures/assassin-flight/runtime-checkpoint.json):

- Foundation23PASS; scoped types/lintPASS; engine10034/384PASS577.548s.
- Final runtime-related112/8PASS18.564s; native33PASS7.951s.
- Final scoped strict typesPASS8.765s and lintPASS11.084s.
- Frozen e76ad891 plus both runtime paths: engine10034/384PASS190.285s;
  all2544repository/three external inputs and HEAD unchanged. Root polled the
  original77288 tool handle terminal before committing. Engine discovery does
  not include the native store cases; their separate related receipt is required.

The prior full19833 unit gate predates Flight and is not current Flight acceptance.
Shared preview currently has three retained REDs at ranks1/2/20. Bilingual
current/next/MAX descriptions, positive finite chip, real paid Warrior/Command,
death/reflection/shield/lifecycle and production mobile/desktop combat/save/offline
remain. No skill-inventory credit, earned balance/campaign or independent approval.

Original logs, source/input hashes and diagnosis snapshots remain in the exact
root-owned Flight task recorded in the packet, needed by ongoing implementation
and final evidence consumers. Root owns eventual archive/readback and exact
cleanup after consumers finish; no cleanup of this active task is claimed.
