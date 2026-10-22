# BUG-075 — Reject sparse Corpse Explosion effects before payment

- **Status:** Fixed in `7cd5768`; reproduced during pre-commit TD review of D06 engine delivery.
- **Severity:** Critical — malformed injected registry data crashes the battle runner after payment. The production JSON catalog is dense; no native production occurrence is claimed.
- **Owner / affected systems:** engine-dev; CE registered-semantics validation and synchronous cast payment.
- **Build:** parent `ddd918c`; uncommitted candidate sources captured by `commands/sparse-effects-red/source/` below.
- **Environment:** Linux, Node24.21.0, Vitest engine project. Pure engine; browser/viewport and locale are not applicable. Seed7.

## Reproduction

1. Load the production skill catalog and copy CE's registered effects array.
2. Extend its length from1 to2 without adding an element, leaving a trailing hole.
3. Register the otherwise unchanged `necromancer.corpse_explosion` with that array.
4. Run the fixed-seed snapshot in `src/engine/combat/corpse-explosion.test.ts`: a1HP enemy dies from ignite at1000ms; an eligible hero acts at1700ms while another enemy survives.

## Expected and actual

Expected: reject the malformed registered spell before corpse consumption,
MP payment or effects, then use the ordinary legal fallback.
Actual: the comparator accepts the array because only enumerable keys match.
The cast reserves a body and pays MP, then throws while reading `effect.kind`
from the undefined array entry. The definition-level assertion also returns
true instead of false. Two regressions fail;3,627 existing controls pass.

## Evidence and root cause

Root-owned retained evidence:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-corpse-engine-6qvxle5x`.
`commands/sparse-effects-red/{command.json,output.log,source/}` binds exact source,
`npm run test:engine -- --reporter=dot`, exit1 and the two failures.
Output SHA256: `efd53fff7ab38bf4a9f4bb59905f645191f9db3437a2cc1c8ae25047bf252b65`.
The structural comparator checks enumerable keys but omits array length.
Compare lengths as well as all dense expected entries; keep the independent
source reference and existing payment boundary. Do not change authored tuning.

## Workaround and resolution

The structural comparator now requires equal array lengths as well as exact
dense keys, rejecting the malformed registry entry before payment. Production's
dense registered effects and tuning remain unchanged. Fix: `7cd5768`.
Regressions are “rejects a trailing sparse effect before payment rather than
throwing during effects” (combat) and “rejects an extended sparse effect array
rather than matching only enumerable keys” (skills).

Final settled validation: engine3,631/91 files, full7,837/252 files, typecheck,
lint/purity91 and production build all pass. Both regression failures are
retained alongside the passing source/receipts. Independent QA engine APPROVE /
test evidence ADEQUATE and TD/five-axis APPROVE bind frozen review SHA256
`2625041c5e2ca7ed0ecd3663c92727be0bbdf68afd9e10ddbd3199e72f217913`
at the root above. Native/browser/earned acceptance is outside this bug closure.
