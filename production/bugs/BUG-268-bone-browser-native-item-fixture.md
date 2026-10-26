# BUG-268 — Supply native socket capacity in the bone browser fixture

- Severity: Medium; acceptance tooling stops before combat, with a valid native fixture as the workaround.
- Status: Corrected externally at `bdc747b8`; native decoder and production browser pass.
- Owner: root acting as QA owner; no delegation or independent sign-off.
- Environment: production Chromium, en, 360×640; Node v24.21.0 decoder reproduction.
- Scope: synthetic fixture only; no defect in the importer has been established.

## Reproduction

1. Run the retained `bone-public-combat.cjs` production browser driver.
2. Create a fresh Necromancer, export it, and add the declared synthetic survival cap.
3. Import through Settings. The import dialog remains open; combat never starts.
4. Pass the exact retained JSON through production `decodeSave` with Vite SSR.

Expected: a structurally valid synthetic save imports before combat assertions.

Actual: `effectiveSocketCapacity` throws `Invalid native item socket capacity`.
The cap omits `socketCapacity`, which native weapon/armor items must own even
when the capacity is zero. The importer correctly rejects this malformed item.
Neither failed browser attempt establishes a combat failure.

## Evidence and correction boundary

Root retains original browser failure, diagnostic failure and decoder terminal
receipts/logs in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v`.
`bone-defenses-fixture-decode.log` SHA256:
`b5711854004d5da25132ea74ad399a3cb57c7c081eaab7574fafa52723c2c128`.

Correct only the synthetic cap to own `socketCapacity: 0`. Retain its other
fields, resources, assertions and timeouts. Preserve original drivers/results;
rerun decoder and browser in separate output paths. Do not relax save validation
or change production code to accept the malformed test item.

## Integrated validation at bdc747b8

Full18359tests/845files/two existing opt-in skips, engine9382/352, strict types, lint, official build/bridge and756URLprecache pass. Corrected decoder exits0/4.165s; canonical browser4/4/43.143s and visible-chip4/4/48.601s pass without importer changes. Original failures are preserved; details and immutable receipts are in docs/plans/evidence/d06-bone-defenses-core.md and its integrated packet. No new inventory credit or independent/earned/full-v1 acceptance.
